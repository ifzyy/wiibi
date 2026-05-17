/**
 * middleware/validateSolar.js
 */

import { LOCATIONS } from '../services/SolarCalculatorService.js';

const VALID_AUTONOMY  = [8, 12, 24, 48];
const VALID_BATTERY   = ['lithium', 'tubular', 'dry-cell'];
const VALID_HOME_TYPE = ['apartment', 'duplex', 'bungalow', 'office', 'other'];
const VALID_TIERS     = ['sufficient', 'recommended', 'overkill'];
const VALID_ORIGINS   = ['add_to_cart', 'request_quote'];
const VALID_STATUSES  = ['new', 'contacted', 'converted'];

function validateApplianceArray(appliances, errors) {
  if (!Array.isArray(appliances) || appliances.length === 0) {
    errors.push('appliances must be a non-empty array');
    return;
  }
  if (appliances.length > 100) {
    errors.push('Maximum 100 appliances per calculation');
    return;
  }
  appliances.forEach((a, i) => {
    const p = `appliances[${i}]`;
    if (typeof a.id !== 'number' && typeof a.id !== 'string') errors.push(`${p}.id is required`);
    if (!Number.isInteger(a.qty)    || a.qty  < 1 || a.qty  > 100) errors.push(`${p}.qty must be a positive integer (max 100)`);
    if (typeof a.hours !== 'number' || a.hours <= 0 || a.hours > 24) errors.push(`${p}.hours must be between 0 and 24`);
  });
}

// ── POST /api/solar/calculate ─────────────────────────────────────────────────
export function validateCalculateInput(req, res, next) {
  const errors = [];
  const { appliances, location, autonomyHours, batteryType, homeType } = req.body;

  validateApplianceArray(appliances, errors);

  if (!location || !LOCATIONS.includes(location)) {
    errors.push(`location must be one of: ${LOCATIONS.join(', ')}`);
  }

  const parsedAutonomy = parseInt(autonomyHours);
  if (!VALID_AUTONOMY.includes(parsedAutonomy)) {
    errors.push(`autonomyHours must be one of: ${VALID_AUTONOMY.join(', ')}`);
  }

  if (!batteryType || !VALID_BATTERY.includes(batteryType)) {
    errors.push(`batteryType must be one of: ${VALID_BATTERY.join(', ')}`);
  }

  if (homeType !== undefined && homeType !== null && !VALID_HOME_TYPE.includes(homeType)) {
    errors.push(`homeType must be one of: ${VALID_HOME_TYPE.join(', ')}`);
  }

  if (errors.length) return res.status(400).json({ message: 'Validation failed', errors });

  req.body.autonomyHours = parsedAutonomy;
  next();
}

// ── POST /api/solar/leads ─────────────────────────────────────────────────────
export function validateLeadInput(req, res, next) {
  const errors = [];
  const {
    appliances, location, autonomyHours, batteryType,
    homeType, chosenTier, origin, email,
  } = req.body;

  validateApplianceArray(appliances, errors);

  if (!location || !LOCATIONS.includes(location)) {
    errors.push(`location must be one of: ${LOCATIONS.join(', ')}`);
  }

  const parsedAutonomy = parseInt(autonomyHours);
  if (!VALID_AUTONOMY.includes(parsedAutonomy)) {
    errors.push(`autonomyHours must be one of: ${VALID_AUTONOMY.join(', ')}`);
  }

  if (!batteryType || !VALID_BATTERY.includes(batteryType)) {
    errors.push(`batteryType must be one of: ${VALID_BATTERY.join(', ')}`);
  }

  if (homeType !== undefined && homeType !== null && !VALID_HOME_TYPE.includes(homeType)) {
    errors.push(`homeType must be one of: ${VALID_HOME_TYPE.join(', ')}`);
  }

  if (chosenTier && !VALID_TIERS.includes(chosenTier)) {
    errors.push(`chosenTier must be one of: ${VALID_TIERS.join(', ')}`);
  }

  if (origin && !VALID_ORIGINS.includes(origin)) {
    errors.push(`origin must be one of: ${VALID_ORIGINS.join(', ')}`);
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('email must be a valid email address');
  }

  if (errors.length) return res.status(400).json({ message: 'Validation failed', errors });

  req.body.autonomyHours = parsedAutonomy;
  next();
}

// ── PATCH /api/admin/solar/leads/:id ─────────────────────────────────────────
export function validateLeadUpdate(req, res, next) {
  const { status } = req.body;
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      message: 'Validation failed',
      errors:  [`status must be one of: ${VALID_STATUSES.join(', ')}`],
    });
  }
  next();
}