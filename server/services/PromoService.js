/**
 * services/PromoService.js
 *
 * Promo-code validation + discount math. The single source of truth used by
 * BOTH the public validate endpoint and order creation, so the client can
 * never inflate a discount — checkout always recomputes it here, server-side.
 *
 * Discount applies to the cart SUBTOTAL only (never delivery). The computed
 * discount is clamped so it can never exceed the subtotal.
 */

import { Op } from 'sequelize';
import db from '../models/index.js';
import { AppError } from '../utils/AppError.js';

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/**
 * Look up an active, in-window promo by code (case-insensitive).
 * Returns the model instance or null. Does NOT check subtotal/usage — that's
 * done in evaluate() so we can give specific error messages.
 */
export const findUsablePromo = async (code, { transaction } = {}) => {
  if (!code || typeof code !== 'string') return null;
  return db.PromoCode.findOne({
    where: { code: code.trim().toUpperCase() },
    transaction,
    ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
  });
};

/**
 * Evaluate a promo against a subtotal.
 * @returns {{ discount: number, promo: PromoCode }}
 * @throws  {AppError} 422 with a customer-friendly message when invalid.
 */
export const evaluatePromo = (promo, subtotal) => {
  const now = new Date();
  const sub = Number(subtotal) || 0;

  if (!promo || !promo.isActive) {
    throw new AppError('This promo code is not valid.', 422);
  }
  if (promo.startsAt && now < new Date(promo.startsAt)) {
    throw new AppError('This promo code is not active yet.', 422);
  }
  if (promo.expiresAt && now > new Date(promo.expiresAt)) {
    throw new AppError('This promo code has expired.', 422);
  }
  if (promo.usageLimit != null && promo.usedCount >= promo.usageLimit) {
    throw new AppError('This promo code has reached its usage limit.', 422);
  }
  if (sub < Number(promo.minOrderAmount || 0)) {
    throw new AppError(
      `Add ₦${Number(promo.minOrderAmount).toLocaleString('en-NG')} worth of items to use this code.`,
      422
    );
  }

  let discount;
  if (promo.discountType === 'percentage') {
    discount = sub * (Number(promo.discountValue) / 100);
    if (promo.maxDiscount != null) discount = Math.min(discount, Number(promo.maxDiscount));
  } else {
    discount = Number(promo.discountValue);
  }

  // Never discount more than the subtotal.
  discount = round2(Math.min(discount, sub));
  if (discount <= 0) throw new AppError('This promo code gives no discount on your order.', 422);

  return { discount, promo };
};

/**
 * Public-facing validation: { code, subtotal } → discount preview.
 * Throws AppError on invalid. Never mutates usedCount.
 */
export const validatePromoCode = async (code, subtotal) => {
  const promo = await findUsablePromo(code);
  const { discount } = evaluatePromo(promo, subtotal);
  return {
    code:         promo.code,
    description:  promo.description,
    discountType: promo.discountType,
    discount,
  };
};

/* ── Admin CRUD ───────────────────────────────────────────────────────────── */

export const listPromos = async () => {
  const rows = await db.PromoCode.findAll({ order: [['createdAt', 'DESC']] });
  return rows;
};

export const createPromo = async (data) => {
  const code = String(data.code || '').trim().toUpperCase();
  if (!code) throw new AppError('Code is required', 422);
  if (!/^[A-Z0-9_-]{2,40}$/.test(code)) {
    throw new AppError('Code must be 2–40 letters, numbers, dashes or underscores.', 422);
  }
  const exists = await db.PromoCode.findOne({ where: { code } });
  if (exists) throw new AppError('A promo code with that code already exists.', 409);

  if (data.discountType === 'percentage' && Number(data.discountValue) > 100) {
    throw new AppError('Percentage discount cannot exceed 100%.', 422);
  }

  return db.PromoCode.create({
    code,
    description:    data.description ?? null,
    discountType:   data.discountType === 'fixed' ? 'fixed' : 'percentage',
    discountValue:  Number(data.discountValue) || 0,
    maxDiscount:    data.maxDiscount != null && data.maxDiscount !== '' ? Number(data.maxDiscount) : null,
    minOrderAmount: Number(data.minOrderAmount) || 0,
    usageLimit:     data.usageLimit != null && data.usageLimit !== '' ? Number(data.usageLimit) : null,
    startsAt:       data.startsAt || null,
    expiresAt:      data.expiresAt || null,
    isActive:       data.isActive !== false,
  });
};

export const updatePromo = async (id, data) => {
  const promo = await db.PromoCode.findByPk(id);
  if (!promo) throw new AppError('Promo code not found', 404);

  const fields = {};
  if (data.description    !== undefined) fields.description    = data.description ?? null;
  if (data.discountType   !== undefined) fields.discountType   = data.discountType === 'fixed' ? 'fixed' : 'percentage';
  if (data.discountValue  !== undefined) fields.discountValue  = Number(data.discountValue) || 0;
  if (data.maxDiscount    !== undefined) fields.maxDiscount    = data.maxDiscount === '' || data.maxDiscount == null ? null : Number(data.maxDiscount);
  if (data.minOrderAmount !== undefined) fields.minOrderAmount = Number(data.minOrderAmount) || 0;
  if (data.usageLimit     !== undefined) fields.usageLimit     = data.usageLimit === '' || data.usageLimit == null ? null : Number(data.usageLimit);
  if (data.startsAt       !== undefined) fields.startsAt       = data.startsAt || null;
  if (data.expiresAt      !== undefined) fields.expiresAt      = data.expiresAt || null;
  if (data.isActive       !== undefined) fields.isActive       = !!data.isActive;

  if ((fields.discountType ?? promo.discountType) === 'percentage' &&
      Number(fields.discountValue ?? promo.discountValue) > 100) {
    throw new AppError('Percentage discount cannot exceed 100%.', 422);
  }

  await promo.update(fields);
  return promo;
};

export const deletePromo = async (id) => {
  const promo = await db.PromoCode.findByPk(id);
  if (!promo) throw new AppError('Promo code not found', 404);
  await promo.destroy();
};
