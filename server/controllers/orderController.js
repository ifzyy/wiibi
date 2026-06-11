import Joi from 'joi';
import asyncHandler from '../utils/Asynchandler.js';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response.js';
import { ValidationError, AppError } from '../utils/AppError.js';
import {
  checkout,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
  cancelOrderByCustomer,
  cancelOrderByAdmin,
  initiateRefundFlow,
  updateRefundStatus,
  CANCEL_REASONS,
} from '../services/OrderService.js';
import {
  initiateRefund,
} from '../services/paymentProvider.js';

/* ── Schemas ─────────────────────────────────────────────────────────────── */

const checkoutSchema = Joi.object({
  shippingAddress: Joi.object({
    fullName:     Joi.string().required(),
    email:        Joi.string().email(),
    addressLine1: Joi.string().required(),
    addressLine2: Joi.string().allow('', null),
    city:         Joi.string().required(),
    state:        Joi.string().required(),
    postalCode:   Joi.string().required(),
    country:      Joi.string().length(2).uppercase().required(),
    phone:        Joi.string().allow('', null),
  }).required(),
  idempotencyKey: Joi.string().max(128).allow(null),
  currency:       Joi.string().length(3).uppercase().default('NGN'),
  guestEmail:     Joi.string().email().allow(null),
  guestToken:     Joi.string().optional().allow(null, ''),
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled')
    .required(),
  paymentStatus: Joi.string()
    .valid('unpaid', 'paid', 'partially_refunded', 'refunded')
    .optional(),
  note:           Joi.string().max(500).allow('', null),
  trackingNumber: Joi.string().max(100).allow('', null),
  carrier:        Joi.string().max(100).allow('', null),
  // Estimated delivery date shown to the customer — YYYY-MM-DD
  expectedDelivery: Joi.date().iso().allow(null),
  refund: Joi.object({
    amount: Joi.number().positive().required(),
    reason: Joi.string().max(500).allow('', null),
    method: Joi.string()
      .valid('Paystack', 'Bank Transfer', 'Cash', 'Flutterwave', 'Credit Note')
      .required(),
  }).optional().allow(null),
});

const customerCancelSchema = Joi.object({
  reason:  Joi.string().max(200).required(),
  details: Joi.string().max(500).allow('', null),
});

const adminCancelSchema = Joi.object({
  reason:       Joi.string().max(500).allow('', null),
  issueRefund:  Joi.boolean().default(false),
  refundAmount: Joi.number().positive().allow(null),
  refundMethod: Joi.string()
    .valid('Paystack', 'Bank Transfer', 'Cash', 'Flutterwave', 'Credit Note')
    .default('Paystack'),
});

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const getGuestToken = (req) => req.headers['x-guest-token'] ?? null;

const toKobo = (ngn) => Math.round(parseFloat(ngn) * 100);

const PAYSTACK_REFUND_WINDOW_MS = 20 * 24 * 60 * 60 * 1000;

/**
 * Shared refund execution — called after an order is cancelled when needsRefund is true.
 * Creates the DB record first, then calls Paystack outside the transaction.
 * If Paystack fails or isn't usable, marks the refund as manual_required.
 *
 * @param {string}      orderId
 * @param {string|null} paymentReference
 * @param {number}      totalAmount
 * @param {string}      reason
 * @param {string}      method           — 'Paystack' | 'Bank Transfer' etc.
 * @param {string|null} actorId          — userId or null for customer self-service
 * @param {number|null} refundAmount     — null means full refund
 */
const executeRefund = async ({
  orderId,
  paymentReference,
  totalAmount,
  reason,
  method      = 'Paystack',
  actorId     = null,
  refundAmount = null,
}) => {
  // Step 1 — create pending refund record in DB (own transaction inside initiateRefundFlow)
  // Capture `order` so we can use order.createdAt for the Paystack 20-day window check.
  // Using refund.createdAt (just created) would make the window check always pass — wrong.
  const { refund, order: refundOrder, refundAmount: finalAmt } = await initiateRefundFlow(orderId, {
    amount:  refundAmount,
    reason,
    method,
    actorId,
  });

  let gatewayRef     = null;
  let finalStatus    = 'pending';
  let manualRequired = false;
  let finalMethod    = method;

  const hasReference   = !!paymentReference;
  const chargeAgeMs    = Date.now() - new Date(refundOrder.createdAt).getTime();
  const beyondWindow   = chargeAgeMs > PAYSTACK_REFUND_WINDOW_MS;
  const canUsePaystack = hasReference && !beyondWindow && method === 'Paystack';

  // Determine if we must force manual
  if (method === 'Paystack' && (!hasReference || beyondWindow)) {
    finalMethod    = 'Bank Transfer';
    finalStatus    = 'manual_required';
    manualRequired = true;
    console.warn(
      `[Refund] Order ${orderId} — ${!hasReference ? 'no paymentReference' : 'past 20-day window'} — forcing manual`
    );
  }

  // Step 2 — call provider OUTSIDE the DB transaction
  if (canUsePaystack) {
    try {
      const gatewayResult = await initiateRefund({
        reference:    paymentReference,
        amount:       toKobo(finalAmt),
        merchantNote: reason,
      });

      // status:false means the provider returned a structured failure (not an exception)
      if (!gatewayResult?.status) {
        throw new Error(gatewayResult?.message || 'Refund declined by payment provider');
      }

      gatewayRef  = gatewayResult?.data?.refund_reference ?? null;
      finalStatus = 'pending';
    } catch (err) {
      console.error('[Refund] Provider initiateRefund failed:', err.message);
      finalMethod    = 'Bank Transfer';
      finalStatus    = 'manual_required';
      manualRequired = true;
    }
  }

  // Step 3 — update refund record with gateway result
  const updatedRefund = await updateRefundStatus(refund.id, {
    gatewayReference: gatewayRef,
    status:           finalStatus,
  });

  return { refund: updatedRefund, manualRequired, method: finalMethod };
};

/* ── Customer handlers ───────────────────────────────────────────────────── */

export const handleCheckout = asyncHandler(async (req, res) => {
  const { error, value } = checkoutSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message);

  const userId     = req.user?.id ?? null;
  const guestToken = userId ? null : getGuestToken(req);
  const guestEmail = value.guestEmail ?? null;

  if (!userId && !guestToken) {
    throw new AppError('Guest token is required for guest checkout. Include X-Guest-Token header.', 400);
  }
  if (!userId && !guestEmail) {
    throw new ValidationError('Email address is required for guest checkout');
  }

  const order = await checkout(userId, {
    shippingAddress: value.shippingAddress,
    idempotencyKey:  value.idempotencyKey,
    currency:        value.currency,
    guestEmail,
    guestToken,
  });

  return sendCreated(res, order, 'Order placed successfully');
});

export const handleGetMyOrders = asyncHandler(async (req, res) => {
  const page   = parseInt(req.query.page  || '1');
  const limit  = Math.min(parseInt(req.query.limit || '20'), 100);
  const result = await getUserOrders(req.user.id, { page, limit });
  return sendPaginated(res, result.orders, result.pagination);
});

export const handleGetMyOrder = asyncHandler(async (req, res) => {
  const userId     = req.user?.id ?? null;
  const guestToken = userId ? null : getGuestToken(req);

  if (!userId && !guestToken) {
    throw new AppError('Authentication or guest token required to view an order', 401);
  }

  const order = await getOrderById(req.params.id, userId, guestToken);
  return sendSuccess(res, order);
});

export const handleGetCancelReasons = asyncHandler(async (_req, res) => {
  return sendSuccess(res, CANCEL_REASONS);
});

/**
 * POST /orders/:id/cancel
 *
 * Full flow:
 *  1. cancelOrderByCustomer() — cancels order, restores stock, commits
 *  2. If needsRefund → executeRefund() — creates refund record, calls Paystack
 *
 * The two steps are intentionally separate transactions.
 * If Paystack is down, the cancellation still succeeds and the refund is
 * saved as manual_required so ops can process it.
 */
export const handleCustomerCancel = asyncHandler(async (req, res) => {
  const { error, value } = customerCancelSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message);

  const userId     = req.user?.id ?? null;
  const guestToken = userId ? null : getGuestToken(req);

  if (!userId && !guestToken) {
    throw new AppError('Authentication or guest token required to cancel an order', 401);
  }

  // Step 1 — cancel the order
  const { order, needsRefund, paymentReference, totalAmount } =
    await cancelOrderByCustomer(req.params.id, userId, guestToken, value);

  // Step 2 — initiate refund if the order was already paid
  let refundResult = null;
  if (needsRefund) {
    refundResult = await executeRefund({
      orderId:          order.id,
      paymentReference,
      totalAmount,
      reason:           value.reason,
      method:           'Paystack',
      actorId:          userId,
      refundAmount:     null,   // full refund on customer cancellation
    });
  }

  const message = needsRefund
    ? refundResult?.manualRequired
      ? 'Order cancelled. Your refund will be processed manually within 3–5 business days.'
      : 'Order cancelled. Your refund will be processed within 3–5 business days.'
    : 'Order cancelled successfully.';

  return sendSuccess(res, {
    order,
    refund: refundResult?.refund ?? null,
  }, message);
});

/* ── Admin handlers ──────────────────────────────────────────────────────── */

export const handleAdminGetOrders = asyncHandler(async (req, res) => {
  const page          = parseInt(req.query.page  || '1');
  const limit         = Math.min(parseInt(req.query.limit || '20'), 100);
  const status        = req.query.status        || null;
  const paymentStatus = req.query.paymentStatus || null;
  const result        = await getAllOrders({ page, limit, status, paymentStatus });
  return sendPaginated(res, result.orders, result.pagination);
});

export const handleAdminGetOrder = asyncHandler(async (req, res) => {
  const order = await getOrderById(req.params.id);
  return sendSuccess(res, order);
});

export const handleUpdateStatus = asyncHandler(async (req, res) => {
  const { error, value } = updateStatusSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message);

  const order = await updateOrderStatus(req.params.id, {
    fulfillmentStatus: value.status,
    paymentStatus:     value.paymentStatus,
    note:              value.note,
    trackingNumber:    value.trackingNumber,
    carrier:           value.carrier,
    expectedDelivery:  value.expectedDelivery ?? null,
    refund:            value.refund ?? null,
    actorId:           req.user.id,
  });
  return sendSuccess(res, order, 'Order status updated');
});

/**
 * POST /admin/orders/:id/cancel
 *
 * Full flow:
 *  1. cancelOrderByAdmin() — cancels order, restores stock (if pre-ship), commits
 *  2. If needsRefund → executeRefund() — creates refund record, calls Paystack
 */
export const handleAdminCancel = asyncHandler(async (req, res) => {
  const { error, value } = adminCancelSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message);

  // Step 1 — cancel the order
  const { order, needsRefund, paymentReference, refundAmount, refundMethod } =
    await cancelOrderByAdmin(req.params.id, req.user.id, value);

  // Step 2 — initiate refund if needed
  let refundResult = null;
  if (needsRefund) {
    refundResult = await executeRefund({
      orderId:          order.id,
      paymentReference,
      totalAmount:      order.totalAmount,
      reason:           value.reason ?? 'Admin cancellation',
      method:           refundMethod,
      actorId:          req.user.id,
      refundAmount:     refundAmount,   // null = full refund, or admin-specified amount
    });
  }

  const message = needsRefund
    ? refundResult?.manualRequired
      ? 'Order cancelled. Refund requires manual processing.'
      : 'Order cancelled and refund initiated.'
    : 'Order cancelled.';

  return sendSuccess(res, {
    order,
    refund: refundResult?.refund ?? null,
  }, message);
});

export const handleExportOrders = asyncHandler(async (req, res) => {
  const status        = req.query.status        || null;
  const paymentStatus = req.query.paymentStatus || null;
  const result        = await getAllOrders({ page: 1, limit: 5000, status, paymentStatus });
  const orders        = result.orders ?? [];

  // Quote for CSV, and neutralise spreadsheet formula injection: customer-
  // controlled values (name, email) starting with = + - @ would otherwise
  // execute as formulas when an admin opens the export in Excel.
  const esc = (v) => {
    let s = String(v ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const headers = ['Order No.','Customer','Email','Phone','Total','Currency','Status','Payment','Tracking','Created At'];

  const rows = orders.map(o => {
    const addr = o.shippingAddress ?? {};
    const name = o.user
      ? [o.user.firstName, o.user.lastName].filter(Boolean).join(' ')
      : (o.shippingAddress?.fullName ?? 'Guest');
    const email = o.user?.email ?? o.guestEmail ?? '';
    return [
      o.orderNumber ?? o.id,
      name,
      email,
      addr.phone ?? o.user?.phoneNumber ?? '',
      o.totalAmount ?? 0,
      o.currency ?? 'NGN',
      o.status ?? '',
      o.paymentStatus ?? '',
      o.trackingNumber ?? '',
      o.createdAt ? new Date(o.createdAt).toISOString() : '',
    ].map(esc).join(',');
  });

  const csv      = [headers.map(esc).join(','), ...rows].join('\n');
  const filename = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\uFEFF' + csv);
});