/**
 * controllers/solarController.js
 *
 * Orchestrates the full solar calculator flow.
 * Guest-first — mirrors your cart controller pattern exactly.
 *
 * Public:
 *   GET  /api/solar/appliances     → step 1 data
 *   POST /api/solar/calculate      → run sizing + match products (stateless)
 *   POST /api/solar/leads          → save lead (step 4 form + add-to-cart trigger)
 *   GET  /api/solar/leads/:id      → retrieve own lead
 *
 * Admin:
 *   GET    /api/admin/solar/leads          → CRM list
 *   GET    /api/admin/solar/leads/:id      → lead detail
 *   PATCH  /api/admin/solar/leads/:id      → update status / notes
 *   DELETE /api/admin/solar/leads/:id      → soft delete
 *   GET    /api/admin/solar/appliances     → full appliance list
 *   POST   /api/admin/solar/appliances     → add appliance
 *   PATCH  /api/admin/solar/appliances/:id → edit appliance
 *   DELETE /api/admin/solar/appliances/:id → remove appliance
 *   GET    /api/admin/solar/settings       → cost rate settings
 *   PATCH  /api/admin/solar/settings/:key  → update a setting
 */

import { randomUUID } from 'crypto';
import { Op }         from 'sequelize';
import db             from '../models/index.js';
import { runSizing, LOCATIONS } from '../services/SolarCalculatorService.js';
import { buildAllRecommendations } from '../services/SolarMatchingService.js';
import logger from '../utils/logger.js';

// ── Guest token — same pattern as your cart controller ────────────────────────
const resolveGuestToken = (req) =>
  req.headers['x-guest-token'] || randomUUID();

// ── Load settings into O(1) Map ───────────────────────────────────────────────
async function loadSettings() {
  const rows = await db.SolarSetting.findAll({ raw: true });
  return new Map(rows.map(r => [r.key, Number(r.value)]));
}

// ── Merge user appliance inputs with canonical DB data ────────────────────────
async function resolveAppliances(inputAppliances, criticalLoadsOnly = false) {
  const dbRows = await db.SolarAppliance.findAll({
    where: { isActive: true },
    raw:   true,
  });
  const dbMap = new Map(dbRows.map(a => [a.id, a]));

  let inputs = inputAppliances;

  // Filter to critical only if requested
  if (criticalLoadsOnly) {
    inputs = inputs.filter(i => dbMap.get(i.id)?.is_critical ?? false);
  }

  return inputs
    .map(input => {
      const match = dbMap.get(input.id);
      return {
        id:              input.id,
        name:            match?.name         ?? input.name   ?? 'Custom',
        watts:           match?.watts_max    ?? Number(input.watts ?? 0),
        qty:             input.qty,
        hours:           input.hours,
        surgeMultiplier: match?.surge_multiplier ?? input.surgeMultiplier ?? 1.0,
      };
    })
    .filter(a => a.watts > 0 && a.qty > 0 && a.hours > 0);
}

// ============================================================================
// PUBLIC CONTROLLERS
// ============================================================================

/**
 * GET /api/solar/appliances
 * Returns appliance list grouped by category + locations list.
 * Public — no auth, no token needed.
 */
export const getAppliances = async (req, res) => {
  try {
    const where = { isActive: true };
    if (req.query.critical === 'true') where.isCritical = true;

    const rows = await db.SolarAppliance.findAll({
      where,
      order: [['sortOrder', 'ASC']],
    });

    const grouped = rows.reduce((acc, a) => {
      const cat = a.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push({
        id:              a.id,
        name:            a.name,
        icon:            a.icon,
        wattsMin:        a.wattsMin,
        wattsMax:        a.wattsMax,
        watts:           a.wattsMax,        // value used in calculations
        defaultHours:    a.defaultHours,
        surgeMultiplier: a.surgeMultiplier,
        isCritical:      a.isCritical,
      });
      return acc;
    }, {});

    return res.json({
      categories: Object.keys(grouped),
      appliances: grouped,
      locations:  LOCATIONS,
    });
  } catch (err) {
    logger.error('getAppliances error: ' + err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/solar/calculate
 *
 * Stateless — runs sizing + product matching, returns three recommendations.
 * Nothing saved to DB here.
 *
 * Body: {
 *   appliances:        [{ id, qty, hours }]
 *   location:          string
 *   autonomyHours:     8 | 12 | 24 | 48
 *   batteryType:       'lithium' | 'tubular' | 'dry-cell'
 *   homeType?:         'apartment' | 'duplex' | 'bungalow' | 'office' | 'other'
 *   criticalLoadsOnly?: boolean
 * }
 */
export const calculate = async (req, res) => {
  try {
    const {
      appliances:       inputAppliances,
      location,
      autonomyHours,
      batteryType,
      homeType,
      criticalLoadsOnly = false,
    } = req.body;

    const [appliances, settings] = await Promise.all([
      resolveAppliances(inputAppliances, criticalLoadsOnly),
      loadSettings(),
    ]);

    if (!appliances.length) {
      return res.status(400).json({ message: 'No valid appliances after resolving inputs' });
    }

    // Step 1 — pure math
    const sizing = runSizing({ appliances, location, autonomyHours, batteryType }, settings);

    // Step 2 — match real products for all three tiers in parallel
    const recommendations = await buildAllRecommendations(sizing, batteryType);

    return res.json({
      metrics:         sizing.metrics,
      recommendations,                  // [sufficient, recommended, overkill]
      // Pass-through so client can re-submit these on /leads
      input: { location, autonomyHours, batteryType, homeType, criticalLoadsOnly },
    });
  } catch (err) {
    logger.error('solar calculate error: ' + err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/solar/leads
 *
 * Creates a lead. Called in two scenarios:
 *   1. Customer fills the quote request form (origin: 'request_quote')
 *   2. Customer hits "Add to cart" (origin: 'add_to_cart') — lead created silently
 *
 * Re-runs the full calculation server-side so we never trust client totals.
 * Returns guestToken so client persists it (same as cart).
 *
 * Body: {
 *   // Calculator inputs
 *   appliances, location, autonomyHours, batteryType, homeType?, criticalLoadsOnly?
 *   // Chosen tier
 *   chosenTier: 'sufficient' | 'recommended' | 'overkill'
 *   // Origin
 *   origin: 'request_quote' | 'add_to_cart'
 *   // Contact (required for request_quote, optional for add_to_cart)
 *   name?, phone?, email?
 * }
 */
export const createLead = async (req, res) => {
  try {
    const {
      appliances: inputAppliances,
      location,
      autonomyHours,
      batteryType,
      homeType,
      criticalLoadsOnly = false,
      chosenTier        = 'recommended',
      origin            = 'request_quote',
      name,
      phone,
      email,
    } = req.body;

    // Validate contact for quote requests
    if (origin === 'request_quote' && (!name?.trim() || !phone?.trim())) {
      return res.status(400).json({ message: 'Name and phone are required for quote requests' });
    }

    const guestToken = req.user ? null : resolveGuestToken(req);
    const userId     = req.user?.id ?? null;

    const [appliances, settings] = await Promise.all([
      resolveAppliances(inputAppliances, criticalLoadsOnly),
      loadSettings(),
    ]);

    if (!appliances.length) {
      return res.status(400).json({ message: 'No valid appliances' });
    }

    // Re-run full calculation fresh
    const sizing          = runSizing({ appliances, location, autonomyHours, batteryType }, settings);
    const recommendations = await buildAllRecommendations(sizing, batteryType);
    const chosen          = recommendations.find(r => r.tier === chosenTier) ?? recommendations[1];

    // Appliance snapshot for admin view — clean, no surge multipliers
    const applianceSnapshot = appliances.map(a => ({
      id: a.id, name: a.name, watts: a.watts, qty: a.qty, hours: a.hours,
    }));

    const lead = await db.SolarLead.create({
      guestToken,
      userId,
      name:  name?.trim()  || 'Anonymous',
      phone: phone?.trim() || 'Not provided',
      email: email?.trim() || null,

      location,
      autonomyHours,
      batteryType,
      homeType:           homeType || null,
      criticalLoadsOnly,
      appliancesSnapshot: applianceSnapshot,
      sizingSnapshot:     sizing.metrics,
      recommendationSnapshot: recommendations,
      chosenTier,
      chosenTotal:        chosen.productTotal ?? chosen.costMin,
      origin,
      status: 'new',
    });

    return res.status(201).json({
      id:         lead.id,
      guestToken: lead.guestToken,  // client stores in localStorage
      message:    origin === 'request_quote'
        ? 'Thanks! Our solar team will contact you within 24 hours.'
        : 'Lead recorded',
      chosenTier,
      chosenTotal: lead.chosenTotal,
    });
  } catch (err) {
    logger.error('createLead error: ' + err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/solar/leads/:id
 * Customer retrieves their own lead (by guest token or user id).
 */
export const getLeadById = async (req, res) => {
  try {
    const lead = await db.SolarLead.findByPk(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    const isAdmin  = req.user?.role === 'admin';
    const isOwner  = req.user
      ? lead.userId === req.user.id
      : lead.guestToken === req.headers['x-guest-token'];

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.json(lead);
  } catch (err) {
    logger.error('getLeadById error: ' + err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// ADMIN — LEADS
// ============================================================================

export const adminGetLeads = async (req, res) => {
  try {
    const { status, origin, location, search, page = 1, limit = 20 } = req.query;
    const parsedPage  = Math.max(1, parseInt(page));
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit)));
    const where       = {};

    if (status)   where.status   = status;
    if (origin)   where.origin   = origin;
    if (location) where.location = location;
    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      where[Op.or] = [
        { name:  { [Op.like]: term } },
        { phone: { [Op.like]: term } },
        { email: { [Op.like]: term } },
      ];
    }

    const { count, rows } = await db.SolarLead.findAndCountAll({
      where,
      order:    [['createdAt', 'DESC']],
      limit:    parsedLimit,
      offset:   (parsedPage - 1) * parsedLimit,
      include:  [{
        model:      db.User,
        as:         'user',
        attributes: ['id', 'email'],
        required:   false,
      }],
      attributes: [
        'id', 'name', 'phone', 'email', 'location',
        'autonomyHours', 'batteryType', 'homeType',
        'chosenTier', 'chosenTotal', 'origin', 'status',
        'adminNotes', 'createdAt', 'sizingSnapshot',
      ],
    });

    return res.json({
      leads: rows,
      pagination: {
        total: count,
        page:  parsedPage,
        pages: Math.ceil(count / parsedLimit),
        limit: parsedLimit,
      },
    });
  } catch (err) {
    logger.error('adminGetLeads error: ' + err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const adminGetLeadById = async (req, res) => {
  try {
    const lead = await db.SolarLead.findByPk(req.params.id, {
      include: [{ model: db.User, as: 'user', attributes: ['id', 'email'], required: false }],
    });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    return res.json(lead);
  } catch (err) {
    logger.error('adminGetLeadById error: ' + err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const adminUpdateLead = async (req, res) => {
  try {
    const lead = await db.SolarLead.findByPk(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    const { status, adminNotes } = req.body;
    const updates = {};
    if (status     !== undefined) updates.status     = status;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;

    await lead.update(updates);
    return res.json(lead);
  } catch (err) {
    logger.error('adminUpdateLead error: ' + err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const adminDeleteLead = async (req, res) => {
  try {
    const lead = await db.SolarLead.findByPk(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    await lead.destroy();
    return res.json({ message: 'Lead deleted' });
  } catch (err) {
    logger.error('adminDeleteLead error: ' + err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// ADMIN — APPLIANCES
// ============================================================================

export const adminGetAppliances = async (req, res) => {
  try {
    const rows = await db.SolarAppliance.findAll({ order: [['sortOrder', 'ASC']] });
    return res.json(rows);
  } catch (err) {
    logger.error('adminGetAppliances error: ' + err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const adminCreateAppliance = async (req, res) => {
  try {
    const {
      name, category, icon, wattsMin, wattsMax,
      defaultHours, surgeMultiplier, isCritical, sortOrder,
    } = req.body;

    if (!name || !category || !wattsMax) {
      return res.status(400).json({ message: 'name, category, and wattsMax are required' });
    }

    const row = await db.SolarAppliance.create({
      name, category,
      icon:            icon            ?? null,
      wattsMin:        Number(wattsMin ?? wattsMax),
      wattsMax:        Number(wattsMax),
      defaultHours:    Number(defaultHours    ?? 4),
      surgeMultiplier: Number(surgeMultiplier ?? 1.0),
      isCritical:      Boolean(isCritical     ?? false),
      sortOrder:       Number(sortOrder       ?? 0),
      isActive:        true,
    });
    return res.status(201).json(row);
  } catch (err) {
    logger.error('adminCreateAppliance error: ' + err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const adminUpdateAppliance = async (req, res) => {
  try {
    const row = await db.SolarAppliance.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Appliance not found' });

    const allowed = [
      'name', 'category', 'icon', 'wattsMin', 'wattsMax',
      'defaultHours', 'surgeMultiplier', 'isCritical', 'sortOrder', 'isActive',
    ];
    const updates = {};
    for (const f of allowed) { if (f in req.body) updates[f] = req.body[f]; }

    ['wattsMin', 'wattsMax', 'defaultHours', 'surgeMultiplier', 'sortOrder'].forEach(f => {
      if (f in updates) updates[f] = Number(updates[f]);
    });

    await row.update(updates);
    return res.json(row);
  } catch (err) {
    logger.error('adminUpdateAppliance error: ' + err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const adminDeleteAppliance = async (req, res) => {
  try {
    const row = await db.SolarAppliance.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Appliance not found' });
    await row.destroy();
    return res.json({ message: 'Appliance deleted' });
  } catch (err) {
    logger.error('adminDeleteAppliance error: ' + err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// ADMIN — SETTINGS
// ============================================================================

export const adminGetSettings = async (req, res) => {
  try {
    const rows = await db.SolarSetting.findAll({ order: [['id', 'ASC']] });
    return res.json(rows);
  } catch (err) {
    logger.error('adminGetSettings error: ' + err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const adminUpdateSetting = async (req, res) => {
  try {
    const setting = await db.SolarSetting.findOne({ where: { key: req.params.key } });
    if (!setting) return res.status(404).json({ message: 'Setting not found' });

    const { value } = req.body;
    if (value === undefined || isNaN(Number(value)) || Number(value) < 0) {
      return res.status(400).json({ message: 'value must be a non-negative number' });
    }

    await setting.update({ value: Number(value) });
    return res.json(setting);
  } catch (err) {
    logger.error('adminUpdateSetting error: ' + err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};