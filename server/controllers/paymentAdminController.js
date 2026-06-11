/**
 * controllers/paymentAdminController.js
 *
 * Admin-only payment reporting. Read-heavy.
 * All writes (refund initiation, status updates) still go through
 * the existing paymentController.js — this file never modifies data.
 */

import Joi from 'joi';
import asyncHandler from '../utils/Asynchandler.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import { ValidationError } from '../utils/AppError.js';
import {
  getPaymentLog,
  getPaymentStats,
  getRefundLog,
  getPaymentDetail,
  reconcile,
} from '../services/PaymentAdminService.js';

/* ── Shared date range schema ─────────────────────────────────────────────── */

const dateRangeFields = {
  startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow(null, ''),
  endDate:   Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow(null, ''),
};

/* ── GET /admin/payments ──────────────────────────────────────────────────── */

export const handleGetPaymentLog = asyncHandler(async (req, res) => {
  const { error, value } = Joi.object({
    page:          Joi.number().integer().min(1).default(1),
    limit:         Joi.number().integer().min(1).max(100).default(20),
    paymentStatus: Joi.string()
      .valid('paid', 'unpaid', 'failed', 'partially_refunded', 'refunded')
      .allow(null, ''),
    currency: Joi.string().length(3).uppercase().allow(null, ''),
    search:   Joi.string().max(200).allow(null, ''),
    ...dateRangeFields,
  }).validate(req.query, { convert: true });

  if (error) throw new ValidationError(error.details[0].message);

  const result = await getPaymentLog({
    ...value,
    startDate:     value.startDate || null,
    endDate:       value.endDate   || null,
    paymentStatus: value.paymentStatus || null,
    search:        value.search        || null,
    currency:      value.currency      || null,
  });

  return sendPaginated(res, result.payments, result.pagination);
});

/* ── GET /admin/payments/stats ────────────────────────────────────────────── */

export const handleGetPaymentStats = asyncHandler(async (req, res) => {
  const { error, value } = Joi.object(dateRangeFields)
    .validate(req.query, { convert: true });

  if (error) throw new ValidationError(error.details[0].message);

  const stats = await getPaymentStats({
    startDate: value.startDate || null,
    endDate:   value.endDate   || null,
  });

  return sendSuccess(res, stats);
});

/* ── GET /admin/payments/refunds ──────────────────────────────────────────── */

export const handleGetRefundLog = asyncHandler(async (req, res) => {
  const { error, value } = Joi.object({
    page:   Joi.number().integer().min(1).default(1),
    limit:  Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string()
      .valid('pending', 'processing', 'completed', 'failed', 'manual_required')
      .allow(null, ''),
    method: Joi.string()
      .valid('Paystack', 'Bank Transfer', 'Cash', 'Flutterwave', 'Credit Note')
      .allow(null, ''),
    ...dateRangeFields,
  }).validate(req.query, { convert: true });

  if (error) throw new ValidationError(error.details[0].message);

  const result = await getRefundLog({
    ...value,
    status:    value.status    || null,
    method:    value.method    || null,
    startDate: value.startDate || null,
    endDate:   value.endDate   || null,
  });

  return sendPaginated(res, result.refunds, result.pagination);
});

/* ── GET /admin/payments/:orderId ─────────────────────────────────────────── */

export const handleGetPaymentDetail = asyncHandler(async (req, res) => {
  const data = await getPaymentDetail(req.params.orderId);
  return sendSuccess(res, data);
});

/* ── GET /admin/payments/reconcile ───────────────────────────────────────── */

export const handleReconcile = asyncHandler(async (_req, res) => {
  const result = await reconcile();
  return sendSuccess(res, result, result.hasIssues
    ? 'Reconciliation found issues requiring attention'
    : 'All payment records are consistent'
  );
});

/* ── GET /admin/payments/export ───────────────────────────────────────────── */

export const handleExportPayments = asyncHandler(async (req, res) => {
  const { paymentStatus, startDate, endDate } = req.query;

  const result = await getPaymentLog({
    page:          1,
    limit:         5000,
    paymentStatus: paymentStatus || null,
    startDate:     startDate     || null,
    endDate:       endDate       || null,
  });

  const payments = result.payments ?? [];

  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const headers = [
    'Order No.', 'Customer', 'Email', 'Payment Status',
    'Amount', 'Currency', 'Reference', 'Order Status', 'Date',
  ];

  const rows = payments.map(p => {
    const name = p.user
      ? [p.user.firstName, p.user.lastName].filter(Boolean).join(' ')
      : 'Guest';
    return [
      p.orderNumber     ?? p.id,
      name,
      p.user?.email     ?? p.guestEmail ?? '',
      p.paymentStatus   ?? '',
      p.totalAmount     ?? 0,
      p.currency        ?? 'NGN',
      p.paymentReference ?? '',
      p.status          ?? '',
      p.createdAt ? new Date(p.createdAt).toISOString() : '',
    ].map(esc).join(',');
  });

  const csv      = [headers.map(esc).join(','), ...rows].join('\n');
  const filename = `payments-${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\uFEFF' + csv);
});
