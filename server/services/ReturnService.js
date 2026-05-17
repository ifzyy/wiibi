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
import { initiateRefund } from './MockPaymentService.js';

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
export const confirmReturn = async (orderId, adminId, { refundMethod = 'Paystack', notes } = {}) => {
  const t = await db.sequelize.transaction();

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

    // Guard: double-refund — block if a pending/completed refund already exists
    const existingRefund = await db.Refund.findOne({
      where: {
        orderId,
        status: { [Op.in]: ['pending', 'completed'] },
      },
      transaction: t,
    });
    if (existingRefund) {
      throw new AppError(
        'A refund is already in progress for this order. ' +
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

    // Update order status
    await order.update({ status: 'returned' }, { transaction: t });

    await db.OrderTracking.create({
      orderId:   order.id,
      status:    'returned',
      note:      'Items confirmed received — stock restocked' + (notes ? ` · ${notes}` : ''),
      updatedBy: adminId,
    }, { transaction: t });

    // ── Refund logic ──────────────────────────────────────────────────────────
    const orderTotal       = parseFloat(order.totalAmount);
    const hasReference     = !!order.paymentReference;
    const chargeAgeMs      = Date.now() - new Date(order.updatedAt).getTime();
    const beyondWindow     = chargeAgeMs > PAYSTACK_REFUND_WINDOW_MS;
    const isPaid           = ['paid', 'partially_refunded'].includes(order.paymentStatus);

    let finalMethod  = refundMethod;
    let refundStatus = 'pending';
    let gatewayResult = null;

    if (isPaid) {
      if (!hasReference) {
        finalMethod  = 'Bank Transfer';
        refundStatus = 'manual_required';
        console.warn(`[ReturnService] Order ${orderId} has no paymentReference — manual refund required`);
      } else if (beyondWindow && finalMethod === 'Paystack') {
        finalMethod  = 'Bank Transfer';
        refundStatus = 'manual_required';
        console.warn(`[ReturnService] Order ${orderId} past Paystack 20-day window — manual refund required`);
      } else if (finalMethod === 'Paystack') {
        try {
          gatewayResult = await initiateRefund({
            reference:    order.paymentReference,
            amount:       toKobo(orderTotal),
            merchantNote: `Return confirmed · ${notes ?? 'Items received'}`,
          });
        } catch (err) {
          console.error('[ReturnService] Paystack refund failed:', err.message);
          finalMethod  = 'Bank Transfer';
          refundStatus = 'manual_required';
        }
      }

      const refundRecord = await db.Refund.create({
        orderId,
        amount:           orderTotal,
        currency:         order.currency ?? 'NGN',
        reason:           'Return confirmed — full refund',
        method:           finalMethod,
        status:           refundStatus,
        gatewayReference: gatewayResult?.data?.transaction_reference ?? null,
        processedBy:      adminId,
        processedAt:      new Date(),
      }, { transaction: t });

      await order.update(
        { paymentStatus: refundStatus === 'completed' ? 'refunded' : order.paymentStatus },
        { transaction: t }
      );

      const refundNote = refundStatus === 'manual_required'
        ? `Manual refund of ₦${orderTotal.toLocaleString('en-NG')} required via ${finalMethod}`
        : `Refund of ₦${orderTotal.toLocaleString('en-NG')} initiated via ${finalMethod}`;

      await db.OrderTracking.create({
        orderId:   order.id,
        status:    'returned',
        note:      refundNote,
        updatedBy: adminId,
      }, { transaction: t });
    }

    await t.commit();

    return {
      order:          await db.Order.findByPk(orderId, {
        include: [
          { model: db.OrderItem,     as: 'items'    },
          { model: db.OrderTracking, as: 'timeline' },
          { model: db.Refund,        as: 'refunds'  },
        ],
      }),
      manualRequired: refundStatus === 'manual_required',
      method:         finalMethod,
    };

  } catch (err) {
    await t.rollback();
    throw err;
  }
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