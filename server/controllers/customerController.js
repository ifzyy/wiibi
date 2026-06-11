/**
 * controllers/customerController.js
 */

import Joi from 'joi';
import asyncHandler from '../utils/Asynchandler.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import { ValidationError } from '../utils/AppError.js';
import {
  getCustomerList,
  getCustomerProfile,
  getCustomerOrders,
  getCustomerInquiries,
  getCustomerStats,
} from '../services/CustomerService.js';

/* ── GET /admin/customers ────────────────────────────────────────────────── */

export const handleGetCustomers = asyncHandler(async (req, res) => {
  const { error, value } = Joi.object({
    page:       Joi.number().integer().min(1).default(1),
    limit:      Joi.number().integer().min(1).max(100).default(20),
    search:     Joi.string().max(200).allow('', null),
    isActive:   Joi.boolean().allow(null),
    isVerified: Joi.boolean().allow(null),
    sortBy:     Joi.string().valid('createdAt', 'lastLoginAt', 'email', 'firstName').default('createdAt'),
    sortDir:    Joi.string().valid('ASC', 'DESC').default('DESC'),
  }).validate(req.query, { convert: true });

  if (error) throw new ValidationError(error.details[0].message);

  const result = await getCustomerList(value);
  return sendPaginated(res, result.customers, result.pagination);
});

/* ── GET /admin/customers/stats ──────────────────────────────────────────── */

export const handleGetCustomerStats = asyncHandler(async (_req, res) => {
  const stats = await getCustomerStats();
  return sendSuccess(res, stats);
});

/* ── GET /admin/customers/:id ────────────────────────────────────────────── */

export const handleGetCustomerProfile = asyncHandler(async (req, res) => {
  const data = await getCustomerProfile(req.params.id);
  return sendSuccess(res, data);
});

/* ── GET /admin/customers/:id/orders ─────────────────────────────────────── */

export const handleGetCustomerOrders = asyncHandler(async (req, res) => {
  const { error, value } = Joi.object({
    page:   Joi.number().integer().min(1).default(1),
    limit:  Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string()
      .valid('pending','processing','shipped','in_transit','delivered','cancelled','return_requested','returned')
      .allow(null),
  }).validate(req.query, { convert: true });

  if (error) throw new ValidationError(error.details[0].message);

  const result = await getCustomerOrders(req.params.id, value);
  return sendPaginated(res, result.orders, result.pagination);
});

/* ── GET /admin/customers/:id/inquiries ──────────────────────────────────── */

export const handleGetCustomerInquiries = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page  || '1');
  const limit = Math.min(parseInt(req.query.limit || '20'), 100);
  const data  = await getCustomerInquiries(req.params.id, { page, limit });
  return sendSuccess(res, data);
});
