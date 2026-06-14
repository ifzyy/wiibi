/**
 * controllers/promoController.js
 *
 * Public: validate a code against a subtotal (discount preview).
 * Admin:  CRUD over promo codes.
 */
import Joi from 'joi';
import asyncHandler from '../utils/Asynchandler.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import { ValidationError } from '../utils/AppError.js';
import {
  validatePromoCode,
  listPromos,
  createPromo,
  updatePromo,
  deletePromo,
} from '../services/PromoService.js';

const validateSchema = Joi.object({
  code:     Joi.string().max(40).required(),
  subtotal: Joi.number().min(0).required(),
});

const upsertSchema = Joi.object({
  code:           Joi.string().max(40),
  description:    Joi.string().max(200).allow('', null),
  discountType:   Joi.string().valid('percentage', 'fixed'),
  discountValue:  Joi.number().min(0),
  maxDiscount:    Joi.number().min(0).allow(null, ''),
  minOrderAmount: Joi.number().min(0).allow(null, ''),
  usageLimit:     Joi.number().integer().min(1).allow(null, ''),
  startsAt:       Joi.date().iso().allow(null, ''),
  expiresAt:      Joi.date().iso().allow(null, ''),
  isActive:       Joi.boolean(),
});

/* ── Public ──────────────────────────────────────────────────────────────── */

export const handleValidatePromo = asyncHandler(async (req, res) => {
  const { error, value } = validateSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message);

  const result = await validatePromoCode(value.code, value.subtotal);
  return sendSuccess(res, result, 'Promo code applied');
});

/* ── Admin ───────────────────────────────────────────────────────────────── */

export const handleListPromos = asyncHandler(async (_req, res) => {
  const promos = await listPromos();
  return sendSuccess(res, promos);
});

export const handleCreatePromo = asyncHandler(async (req, res) => {
  const { error, value } = upsertSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message);
  const promo = await createPromo(value);
  return sendCreated(res, promo, 'Promo code created');
});

export const handleUpdatePromo = asyncHandler(async (req, res) => {
  const { error, value } = upsertSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message);
  const promo = await updatePromo(req.params.id, value);
  return sendSuccess(res, promo, 'Promo code updated');
});

export const handleDeletePromo = asyncHandler(async (req, res) => {
  await deletePromo(req.params.id);
  return sendSuccess(res, null, 'Promo code deleted');
});
