/**
 * routes/solarAdminRoutes.js
 * Mounted at /api/admin/solar
 */

import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validateLeadUpdate } from '../middleware/validateSolar.js';
import {
  adminGetLeads,
  adminGetLeadById,
  adminUpdateLead,
  adminDeleteLead,
  adminGetAppliances,
  adminCreateAppliance,
  adminUpdateAppliance,
  adminDeleteAppliance,
  adminGetSettings,
  adminUpdateSetting,
  adminGetCoverage,
} from '../controllers/solarController.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

// ── Leads CRM ─────────────────────────────────────────────────────────────────
// GET    /api/admin/solar/leads?status=new&origin=&search=&page=&limit=
router.get('/leads',          adminGetLeads);
// GET    /api/admin/solar/leads/:id
router.get('/leads/:id',      adminGetLeadById);
// PATCH  /api/admin/solar/leads/:id  — update status + admin notes
router.patch('/leads/:id',    validateLeadUpdate, adminUpdateLead);
// DELETE /api/admin/solar/leads/:id
router.delete('/leads/:id',   adminDeleteLead);

// ── Appliances ────────────────────────────────────────────────────────────────
router.get('/appliances',        adminGetAppliances);
router.post('/appliances',       adminCreateAppliance);
router.patch('/appliances/:id',  adminUpdateAppliance);
router.delete('/appliances/:id', adminDeleteAppliance);

// ── Catalog coverage ──────────────────────────────────────────────────────────
// GET /api/admin/solar/coverage — gaps that would force calculator fallbacks
router.get('/coverage',          adminGetCoverage);

// ── Cost settings ─────────────────────────────────────────────────────────────
// GET   /api/admin/solar/settings
router.get('/settings',          adminGetSettings);
// PATCH /api/admin/solar/settings/:key   e.g. /settings/inverter_cost_min
router.patch('/settings/:key',   adminUpdateSetting);

export default router;