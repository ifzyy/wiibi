/**
 * routes/promoRoutes.js
 *
 *  /api/promo/*         — public (validate a code at checkout)
 *  /api/admin/promos/*  — admin-only CRUD
 *
 * The promo banner itself is stored in global_settings (key `promo_banner`)
 * and managed through the existing settings endpoints — no route here.
 */
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import {
  handleValidatePromo,
  handleListPromos,
  handleCreatePromo,
  handleUpdatePromo,
  handleDeletePromo,
} from '../controllers/promoController.js';

/* ── Public ──────────────────────────────────────────────────────────────── */
export const publicPromoRouter = express.Router();
publicPromoRouter.post('/validate', handleValidatePromo);

/* ── Admin ───────────────────────────────────────────────────────────────── */
export const adminPromoRouter = express.Router();
adminPromoRouter.use(authenticate, requireRole('admin'));
adminPromoRouter.get('/',        handleListPromos);
adminPromoRouter.post('/',       handleCreatePromo);
adminPromoRouter.patch('/:id',   handleUpdatePromo);
adminPromoRouter.delete('/:id',  handleDeletePromo);

export default publicPromoRouter;
