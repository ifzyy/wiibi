/**
 * routes/solarRoutes.js
 * Mounted at /api/solar
 *
 * Fully public — no account needed at any step.
 * Guest token via X-Guest-Token header (same as cart).
 */

import express from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { validateCalculateInput, validateLeadInput } from '../middleware/validateSolar.js';
import {
  getAppliances,
  calculate,
  createLead,
  getLeadById,
} from '../controllers/solarController.js';

const router = express.Router();

// GET  /api/solar/appliances     — step 1: load appliance list + locations
router.get('/appliances', getAppliances);

// POST /api/solar/calculate      — step 3: run sizing + match products (stateless)
router.post('/calculate', validateCalculateInput, calculate);

// POST /api/solar/leads          — step 4: create lead (quote request or add-to-cart)
router.post('/leads', optionalAuth, validateLeadInput, createLead);

// GET  /api/solar/leads/:id      — retrieve own lead by id
router.get('/leads/:id', optionalAuth, getLeadById);

export default router;