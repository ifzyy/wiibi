/**
 * services/ReturnService.js
 *
 * Handles post-delivery return + refund flow.
 *
 * Flow:
 *   1. Admin creates a return request on a delivered order  → status: 'return_requested'
 *   2. Admin confirms items received                        → status: 'returned'
 *      - Stock restocked at confirmation, not at request
 *      - Refund triggered at confirmation
 *
 * Edge cases handled:
 *   - Double-refund guard (existing pending/completed refund blocks new one)
 *   - Amount cap (cannot refund more than order total)
 *   - Paystack 20-day window (auto-falls back to Bank Transfer / manual_required)
 *   - Missing paymentReference (flags manual_required)
 *   - Stock already restocked guard (idempotent — safe to call twice)
 *   - Order not in a returnable state (must be 'delivered' or 'return_requested')
 */

import { Op } from 'sequelize';
import db from '../models/index.js';
import { NotFoundError, AppError } from '../utils/AppError.js';
import { initiateRefund } from './paymentProvider.js';
import { sendOrderStatusEmail } from './EmailService.js';

const PAYSTACK_REFUND_WINDOW_MS = 20 * 24 * 60 * 60 * 1000;
const toKobo = (ngn) => Math.round(parseFloat(ngn) * 100);

// ── Request a return (admin initiates) ───────────────────────────────────────

/**
 * Mark an order as return_requested.
 * Does NOT restock or refund yet — that happens on confirmReturn().
 *
 * @param {string} orderId
 * @param {string} adminId
 * @param {{ reason: string, notes?: string }} payload
 */
export const requestReturn = async (orderId, adminId, { reason, notes }) => {
  const order = await db.Order.findOne({
    where:   { id: orderId },
    include: [{ model: db.OrderItem, as: 'items' }],
  });

  if (!order) throw new NotFoundError('Order not found');

  if (!['delivered'].includes(order.status)) {
    throw new AppError(
      `Only delivered orders can be marked for return (current status: ${order.status})`,
      422
    );
  }

  // No refund window check here — admin decides timing.
  // The window check happens at confirmReturn() when money actually moves.

  await order.update({ status: 'return_requested' });

  await db.OrderTracking.create({
    orderId:   order.id,
    status:    'return_requested',
    note:      `Return requested by admin · ${reason}` + (notes ? ` · ${notes}` : ''),
    updatedBy: adminId,
  });

  // Customer notification — fire-and-forget, never throws
  sendOrderStatusEmail(order, { note: reason });

  return order.reload({ include: [{ model: db.OrderItem, as: 'items' }] });
};

// ── Confirm return received + trigger refund ──────────────────────────────────

/**
 * Confirm that returned items have been physically received.
 * This is the point where:
 *   - Stock is restocked
 *   - Refund is triggered (or flagged manual if Paystack window passed)
 *
 * @param {string} orderId
 * @param {string} adminId
 * @param {{ refundMethod?: string, notes?: string }} payload
 */
const ORDER_WITH_DETAIL = (orderId) => db.Order.findByPk(orderId, {
  include: [
    { model: db.OrderItem,     as: 'items'    },
    { model: db.OrderTracking, as: 'timeline' },
    { model: db.Refund,        as: 'refunds'  },
  ],
});

const REFUND_ACTIVE = ['pending', 'processing', 'completed', 'manual_required'];

export const confirmReturn = async (orderId, adminId, { refundMethod = 'Paystack', notes } = {}) => {
  // ── Phase 1: DB transaction — restock, set status, create a PENDING refund ──
  // No external HTTP calls happen here. The gateway is called in phase 2, after
  // this transaction commits, so we never hold a row lock across a network call.
  const t = await db.sequelize.transaction();

  let refundId         = null;
  let paymentReference = null;
  let orderTotal       = 0;
  let orderCreatedAt   = null;
  let isPaid           = false;

  try {
    const order = await db.Order.findOne({
      where:   { id: orderId },
      include: [{ model: db.OrderItem, as: 'items' }],
      lock:    t.LOCK.UPDATE,
      transaction: t,
    });

    if (!order) throw new NotFoundError('Order not found');

    if (order.status !== 'return_requested') {
      throw new AppError(
        `Order must be in 'return_requested' state to confirm return (current: ${order.status})`,
        422
      );
    }

    // Guard: double-refund — block if any non-failed refund already exists.
    const existingRefund = await db.Refund.findOne({
      where: { orderId, status: { [Op.in]: REFUND_ACTIVE } },
      transaction: t,
    });
    if (existingRefund) {
      throw new AppError(
        'A refund already exists for this order. ' +
        'Wait for it to complete before confirming the return.',
        409
      );
    }

    // Restock — increment product stock for each returned item
    await Promise.all((order.items ?? []).map((item) =>
      db.Product.increment('stock', {
        by:          item.quantity,
        where:       { id: item.productId },
        transaction: t,
      })
    ));

    await order.update({ status: 'returned' }, { transaction: t });

    await db.OrderTracking.create({
      orderId:   order.id,
      status:    'returned',
      note:      'Items confirmed received — stock restocked' + (notes ? ` · ${notes}` : ''),
      updatedBy: adminId,
    }, { transaction: t });

    orderTotal       = parseFloat(order.totalAmount);
    paymentReference = order.paymentReference;
    orderCreatedAt   = order.createdAt;
    isPaid           = ['paid', 'partially_refunded'].includes(order.paymentStatus);

    if (isPaid) {
      const refund = await db.Refund.create({
        orderId,
        amount:      orderTotal,
        currency:    order.currency ?? 'NGN',
        reason:      'Return confirmed — full refund',
        method:      refundMethod,
        status:      'pending',
        processedBy: adminId,
        processedAt: new Date(),
      }, { transaction: t });
      refundId = refund.id;
    }

    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }

  // Customer notification ("return complete") — fire-and-forget after commit.
  // Sent regardless of refund outcome; refund specifics are admin-side.
  db.Order.findByPk(orderId).then(o => o && sendOrderStatusEmail(o, { note: notes })).catch(() => {});

  // Unpaid order — nothing to refund.
  if (!isPaid || !refundId) {
    return { order: await ORDER_WITH_DETAIL(orderId), manualRequired: false, method: refundMethod };
  }

  // ── Phase 2: call the gateway OUTSIDE any transaction ──────────────────────
  let finalMethod = refundMethod;
  let finalStatus = 'pending';
  let gatewayRef  = null;

  const hasReference = !!paymentReference;
  // Use the order's createdAt — when the charge actually happened. (updatedAt was
  // just bumped to 'returned', so it would make every order look brand new and
  // defeat the 20-day window check.)
  const beyondWindow = (Date.now() - new Date(orderCreatedAt).getTime()) > PAYSTACK_REFUND_WINDOW_MS;

  if (!hasReference) {
    finalMethod = 'Bank Transfer';
    finalStatus = 'manual_required';
    console.warn(`[ReturnService] Order ${orderId} has no paymentReference — manual refund required`);
  } else if (beyondWindow && finalMethod === 'Paystack') {
    finalMethod = 'Bank Transfer';
    finalStatus = 'manual_required';
    console.warn(`[ReturnService] Order ${orderId} past Paystack 20-day window — manual refund required`);
  } else if (finalMethod === 'Paystack') {
    try {
      const gatewayResult = await initiateRefund({
        reference:    paymentReference,
        amount:       toKobo(orderTotal),
        merchantNote: `Return confirmed · ${notes ?? 'Items received'}`,
      });
      // status:false is a structured failure (not a thrown error) — escalate to manual.
      if (!gatewayResult?.status) {
        throw new Error(gatewayResult?.message || 'Refund declined by payment provider');
      }
      gatewayRef  = gatewayResult?.data?.refund_reference ?? null;
      finalStatus = 'pending';
    } catch (err) {
      console.error('[ReturnService] Paystack refund failed:', err.message);
      finalMethod = 'Bank Transfer';
      finalStatus = 'manual_required';
    }
  }

  // Persist the gateway outcome on the refund record created in phase 1.
  const refund = await db.Refund.findByPk(refundId);
  await refund.update({
    method:           finalMethod,
    status:           finalStatus,
    gatewayReference: gatewayRef,
    processedAt:      new Date(),
  });

  // Only a fully-completed refund flips the order to 'refunded'.
  if (finalStatus === 'completed') {
    await db.Order.update({ paymentStatus: 'refunded' }, { where: { id: orderId } });
  }

  await db.OrderTracking.create({
    orderId,
    status: 'returned',
    note:   finalStatus === 'manual_required'
      ? `Manual refund of ₦${orderTotal.toLocaleString('en-NG')} required via ${finalMethod}`
      : `Refund of ₦${orderTotal.toLocaleString('en-NG')} initiated via ${finalMethod}`,
    updatedBy: adminId,
  });

  return {
    order:          await ORDER_WITH_DETAIL(orderId),
    manualRequired: finalStatus === 'manual_required',
    method:         finalMethod,
  };
};

// ── Get all return requests ───────────────────────────────────────────────────

export const getReturnRequests = async ({ page = 1, limit = 20, status = null } = {}) => {
  const safeLimit = Math.min(limit, 100);
  const offset    = (page - 1) * safeLimit;

  const where = { status: status ? status : { [Op.in]: ['return_requested', 'returned'] } };

  const { rows, count } = await db.Order.findAndCountAll({
    where,
    include: [
      { model: db.OrderItem,     as: 'items',    include: [{ model: db.Product, as: 'product', attributes: ['id', 'name', 'featured_image_url'] }] },
      { model: db.OrderTracking, as: 'timeline'  },
      { model: db.Refund,        as: 'refunds'   },
      { model: db.User,          as: 'user',     attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber'], required: false },
    ],
    order:    [['updatedAt', 'DESC']],
    limit:    safeLimit,
    offset,
    distinct: true,
  });

  return {
    returns: rows,
    pagination: { page, limit: safeLimit, total: count, pages: Math.ceil(count / safeLimit) },
  };
};

// ── All refunds (any status) ──────────────────────────────────────────────────
// Backs the admin Refunds tab. Without this, gateway refunds (status
// 'pending', e.g. from a customer cancelling a paid order) were invisible —
// the page only listed manual_required ones.

export const getAllRefunds = async ({ page = 1, limit = 20, status = null } = {}) => {
  const safeLimit = Math.min(limit, 100);
  const offset    = (page - 1) * safeLimit;

  const where = {};
  if (status) where.status = status;

  const [{ rows, count }, statusRows] = await Promise.all([
    db.Refund.findAndCountAll({
      where,
      include: [{
        model:      db.Order,
        as:         'order',
        attributes: ['id', 'orderNumber', 'totalAmount', 'currency', 'paymentReference', 'guestEmail'],
        include: [{
          model:      db.User,
          as:         'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber'],
          required:   false,
        }],
      }],
      order:    [['createdAt', 'DESC']],
      limit:    safeLimit,
      offset,
      distinct: true,
    }),
    // Per-status counts for the filter chips — always unfiltered
    db.Refund.findAll({
      attributes: ['status', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
      group:      ['status'],
      raw:        true,
    }),
  ]);

  const counts = {};
  for (const row of statusRows) counts[row.status] = parseInt(row.count, 10);

  return {
    refunds: rows,
    counts,
    pagination: { page, limit: safeLimit, total: count, pages: Math.ceil(count / safeLimit) },
  };
};

// ── Get pending manual refunds ────────────────────────────────────────────────

export const getPendingManualRefunds = async ({ page = 1, limit = 20 } = {}) => {
  const safeLimit = Math.min(limit, 100);
  const offset    = (page - 1) * safeLimit;

  const { rows, count } = await db.Refund.findAndCountAll({
    where:  { status: 'manual_required' },
    include: [{
      model:      db.Order,
      as:         'order',
      attributes: ['id', 'orderNumber', 'totalAmount', 'currency', 'paymentReference', 'guestEmail'],
      include: [{
        model:      db.User,
        as:         'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber'],
        required:   false,
      }],
    }],
    order:  [['createdAt', 'ASC']],
    limit:  safeLimit,
    offset,
    distinct: true,
  });

  return {
    refunds: rows,
    pagination: { page, limit: safeLimit, total: count, pages: Math.ceil(count / safeLimit) },
  };
};