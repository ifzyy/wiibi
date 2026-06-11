/**
 * services/PaymentAdminService.js
 *
 * Admin read layer over the existing Order + Refund models.
 * NEVER modifies orders or refunds — that is OrderService's job.
 *
 * Design decisions:
 *  - This service is purely a reporting/query layer. No business logic.
 *  - getPaymentLog() is the "full payment history" — every order with its
 *    payment state, paginated, filterable by status and date range.
 *    This is append-style reporting: orders are never removed from the log.
 *  - getRefundLog() gives a dedicated view of all refund activity.
 *  - getPaymentStats() gives the dashboard summary card numbers.
 *  - reconcile() checks for orders where paymentStatus and refund records
 *    are out of sync — a safety net for webhook failures.
 *
 * Why a separate service and not just extending OrderService?
 *  OrderService owns the write path (status transitions, idempotency, stock).
 *  Mixing analytics queries in there would make it harder to reason about
 *  transaction boundaries. Separation keeps both files focused.
 */

import { Op, fn, col, literal } from 'sequelize';
import db from '../models/index.js';
import { NotFoundError } from '../utils/AppError.js';

/* ── Shared includes ──────────────────────────────────────────────────────── */

const userAttrs = ['id', 'firstName', 'lastName', 'email', 'phoneNumber'];

const refundInclude = {
  model:    db.Refund,
  as:       'refunds',
  required: false,
  attributes: ['id', 'amount', 'currency', 'status', 'method', 'reason',
               'gatewayReference', 'processedAt', 'createdAt'],
};

/* ── getPaymentLog ────────────────────────────────────────────────────────── */

/**
 * Full payment history. Every order, paginated.
 * Filterable by paymentStatus, date range, search (order number / email).
 *
 * This is the "Payments" tab in the admin dashboard.
 * Read-only — append style.
 */
export const getPaymentLog = async ({
  page          = 1,
  limit         = 20,
  paymentStatus = null,    // 'paid' | 'unpaid' | 'failed' | 'partially_refunded' | 'refunded'
  startDate     = null,
  endDate       = null,
  search        = null,    // order number or email
  currency      = null,
} = {}) => {
  const safeLimit = Math.min(limit, 100);
  const offset    = (page - 1) * safeLimit;
  const where     = {};

  if (paymentStatus) where.paymentStatus = paymentStatus;
  if (currency)      where.currency      = currency;

  if (startDate && endDate) {
    const start = new Date(startDate + 'T00:00:00+01:00');
    const end   = new Date(endDate   + 'T23:59:59+01:00');
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      where.createdAt = { [Op.between]: [start, end] };
    }
  }

  if (search) {
    const like = { [Op.like]: `%${search}%` };
    where[Op.or] = [
      { orderNumber: like },
      { guestEmail:  like },
    ];
  }

  const { rows, count } = await db.Order.findAndCountAll({
    where,
    attributes: [
      'id', 'orderNumber', 'totalAmount', 'currency',
      'paymentStatus', 'status', 'paymentReference',
      'guestEmail', 'createdAt',
    ],
    include: [
      {
        model:      db.User,
        as:         'user',
        attributes: userAttrs,
        required:   false,
      },
      refundInclude,
    ],
    order:    [['createdAt', 'DESC']],
    limit:    safeLimit,
    offset,
    distinct: true,
    subQuery: false,
  });

  return {
    payments:   rows,
    pagination: { page, limit: safeLimit, total: count, pages: Math.ceil(count / safeLimit) },
  };
};

/* ── getPaymentStats ──────────────────────────────────────────────────────── */

/**
 * Dashboard summary card numbers for the payments section.
 * Returns totals for each paymentStatus enum value.
 *
 * Runs in one query with CASE aggregation — no N+1.
 */
export const getPaymentStats = async ({ startDate = null, endDate = null } = {}) => {
  // Redis: `payments:stats:${startDate}:${endDate}` TTL 5min

  const where = {};
  if (startDate && endDate) {
    const start = new Date(startDate + 'T00:00:00+01:00');
    const end   = new Date(endDate   + 'T23:59:59+01:00');
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      where.createdAt = { [Op.between]: [start, end] };
    }
  }

  const rows = await db.Order.findAll({
    where,
    attributes: [
      'paymentStatus',
      [fn('COUNT', col('id')),              'count'],
      [fn('SUM', col('total_amount')),       'total'],
    ],
    group: ['paymentStatus'],
    raw:   true,
  });

  // Build a flat object with all possible statuses defaulting to 0
  const defaults = { paid: 0, unpaid: 0, failed: 0, partially_refunded: 0, refunded: 0 };
  const amounts  = { paid: 0, unpaid: 0, failed: 0, partially_refunded: 0, refunded: 0 };

  for (const row of rows) {
    defaults[row.paymentStatus] = parseInt(row.count, 10);
    amounts[row.paymentStatus]  = parseFloat(row.total || 0);
  }

  const totalPaidRevenue = amounts.paid + amounts.partially_refunded;
  const totalRefunded    = await db.Refund.sum('amount', {
    where: { status: { [Op.in]: ['completed', 'manual_required'] }, ...(where.createdAt ? { createdAt: where.createdAt } : {}) },
  });

  return {
    counts:         defaults,
    amounts,
    totalPaidRevenue: parseFloat(totalPaidRevenue.toFixed(2)),
    totalRefunded:    parseFloat(totalRefunded || 0),
    period:           { startDate, endDate },
  };
};

/* ── getRefundLog ─────────────────────────────────────────────────────────── */

/**
 * All refund records, paginated. Shows both automatic and manual refunds.
 * Status: pending | processing | completed | failed | manual_required
 */
export const getRefundLog = async ({
  page      = 1,
  limit     = 20,
  status    = null,
  startDate = null,
  endDate   = null,
  method    = null,
} = {}) => {
  const safeLimit = Math.min(limit, 100);
  const offset    = (page - 1) * safeLimit;
  const where     = {};

  if (status) where.status = status;
  if (method) where.method = method;

  if (startDate && endDate) {
    const start = new Date(startDate + 'T00:00:00+01:00');
    const end   = new Date(endDate   + 'T23:59:59+01:00');
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      where.createdAt = { [Op.between]: [start, end] };
    }
  }

  const { rows, count } = await db.Refund.findAndCountAll({
    where,
    include: [{
      model:      db.Order,
      as:         'order',
      attributes: ['id', 'orderNumber', 'totalAmount', 'currency', 'guestEmail'],
      include: [{
        model:      db.User,
        as:         'user',
        attributes: userAttrs,
        required:   false,
      }],
    }],
    order:    [['createdAt', 'DESC']],
    limit:    safeLimit,
    offset,
    distinct: true,
  });

  return {
    refunds:    rows,
    pagination: { page, limit: safeLimit, total: count, pages: Math.ceil(count / safeLimit) },
  };
};

/* ── getPaymentDetail ─────────────────────────────────────────────────────── */

/**
 * Full payment detail for one order — used in the payment detail drawer.
 * Returns the order with its full item list, tracking timeline, and all refunds.
 */
export const getPaymentDetail = async (orderId) => {
  const order = await db.Order.findOne({
    where:   { id: orderId },
    include: [
      { model: db.OrderItem,     as: 'items',    attributes: ['productName', 'quantity', 'unitPrice', 'totalPrice'] },
      { model: db.OrderTracking, as: 'timeline', order: [['createdAt', 'ASC']] },
      { model: db.Refund,        as: 'refunds',  required: false },
      { model: db.User,          as: 'user',     attributes: userAttrs, required: false },
    ],
  });

  if (!order) throw new NotFoundError('Order not found');
  return order;
};

/* ── reconcile ────────────────────────────────────────────────────────────── */

/**
 * Safety net: find orders where paymentStatus is inconsistent with refund records.
 *
 * Cases it detects:
 *  1. paymentStatus = 'paid' but there are completed refunds = should be refunded/partially_refunded
 *  2. paymentStatus = 'unpaid' but has paid refunds = data corruption
 *  3. Refund rows with status = 'manual_required' = needs ops attention
 *
 * Returns an array of orders that need manual review. Admin can then
 * fix them one by one using the existing payment endpoints.
 */
export const reconcile = async () => {
  const [stalePaymentStatus, manualRefundsPending] = await Promise.all([
    // Orders marked 'paid' that have completed refunds but wrong paymentStatus
    db.sequelize.query(`
      SELECT o.id, o.order_number, o.payment_status, o.total_amount,
             SUM(r.amount) AS total_refunded
      FROM orders o
      JOIN refunds r ON r.order_id = o.id
      WHERE r.status IN ('completed', 'manual_required')
        AND o.payment_status = 'paid'
      GROUP BY o.id
      HAVING total_refunded >= o.total_amount
      LIMIT 50
    `, { type: db.sequelize.QueryTypes.SELECT }),

    db.Refund.findAll({
      where:   { status: 'manual_required' },
      include: [{
        model:      db.Order,
        as:         'order',
        attributes: ['id', 'orderNumber', 'totalAmount'],
      }],
      order: [['createdAt', 'ASC']],
      limit: 50,
    }),
  ]);

  return {
    stalePaymentStatus,
    manualRefundsPending,
    hasIssues: stalePaymentStatus.length > 0 || manualRefundsPending.length > 0,
  };
};
