/**
 * controllers/analyticsController.js
 *
 * Thin controller. All logic lives in AnalyticsService.
 * Responsibilities here: validate input, call service, format response.
 */

import Joi from 'joi';
import asyncHandler from '../utils/Asynchandler.js';
import { sendSuccess } from '../utils/response.js';
import { ValidationError } from '../utils/AppError.js';
import {
  getDashboardSummary,
  getSalesSummary,
  getOrderStats,
  getTrafficSummary,
  aggregateDay,
} from '../services/AnalyticsService.js';

/* ── Date range defaults ─────────────────────────────────────────────────── */

const today    = () => new Date().toISOString().slice(0, 10);
const daysAgo  = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const dateRangeSchema = Joi.object({
  startDate: Joi.string().pattern(DATE_PATTERN).default(() => daysAgo(29)),
  endDate:   Joi.string().pattern(DATE_PATTERN).default(() => today()),
}).and('startDate', 'endDate');   // both or neither

const validateRange = (query) => {
  const { error, value } = dateRangeSchema.validate({
    startDate: query.startDate || daysAgo(29),
    endDate:   query.endDate   || today(),
  });
  if (error) throw new ValidationError(error.details[0].message);
  if (value.startDate > value.endDate) throw new ValidationError('startDate must be before endDate');
  return value;
};

/* ── Handlers ────────────────────────────────────────────────────────────── */

/**
 * GET /admin/analytics/dashboard
 * The main dashboard endpoint — returns everything in one request.
 */
export const handleGetDashboard = asyncHandler(async (req, res) => {
  const { startDate, endDate } = validateRange(req.query);
  const data = await getDashboardSummary({ startDate, endDate });
  return sendSuccess(res, data);
});

/**
 * GET /admin/analytics/sales
 * Sales totals + daily breakdown for charting.
 */
export const handleGetSales = asyncHandler(async (req, res) => {
  const { startDate, endDate } = validateRange(req.query);
  const data = await getSalesSummary({ startDate, endDate });
  return sendSuccess(res, data);
});

/**
 * GET /admin/analytics/orders
 * Order counts by status and payment status.
 */
export const handleGetOrderStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = validateRange(req.query);
  const data = await getOrderStats({ startDate, endDate });
  return sendSuccess(res, data);
});

/**
 * GET /admin/analytics/traffic
 * Page views, unique visitors, top pages.
 */
export const handleGetTraffic = asyncHandler(async (req, res) => {
  const { startDate, endDate } = validateRange(req.query);
  const limit = Math.min(parseInt(req.query.limit || '10'), 50);
  const data  = await getTrafficSummary({ startDate, endDate, topPagesLimit: limit });
  return sendSuccess(res, data);
});

/**
 * POST /admin/analytics/aggregate
 * Manually trigger aggregation for a specific date (ops use only).
 * e.g. { "date": "2026-05-24" }
 */
export const handleTriggerAggregation = asyncHandler(async (req, res) => {
  const { error, value } = Joi.object({
    date: Joi.string().isoDate().required(),
  }).validate(req.body);
  if (error) throw new ValidationError(error.details[0].message);

  await aggregateDay(value.date);
  return sendSuccess(res, { date: value.date }, `Aggregation complete for ${value.date}`);
});

/**
 * POST /admin/analytics/track
 * Records a page view. Called server-side from a middleware.
 * Can also be called directly from the frontend via API.
 */
export const handleTrackPageView = asyncHandler(async (req, res) => {
  // Lightweight fire-and-forget — respond immediately, write async
  const {
    path,
    sessionId  = null,
    referrer   = null,
    responseMs = null,
  } = req.body;

  if (!path || typeof path !== 'string') {
    return res.status(204).end();   // silently ignore bad requests
  }

  // Normalise: strip query string, limit length
  const normPath = path.split('?')[0].slice(0, 500);

  // Hash the IP for privacy — never store raw
  const crypto   = await import('crypto');
  const dailySalt = new Date().toISOString().slice(0, 10);
  const ip        = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || '';
  const ipHash    = crypto.default
    .createHash('sha256')
    .update(ip + dailySalt)
    .digest('hex');

  // Fire and forget — don't block the response
  import('../models/index.js').then(({ default: db }) => {
    db.PageView.create({
      userId:     req.user?.id ?? null,
      sessionId,
      path:       normPath,
      referrer:   referrer?.slice(0, 500) || null,
      userAgent:  req.headers['user-agent']?.slice(0, 500) || null,
      ipHash,
      responseMs: responseMs ? parseInt(responseMs, 10) : null,
    }).catch(err => console.error('[PageView] Write failed:', err.message));
  });

  return res.status(204).end();
});
