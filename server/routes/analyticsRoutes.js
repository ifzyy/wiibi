/**
 * routes/analyticsRoutes.js
 */
import express from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import {
  handleGetDashboard,
  handleGetSales,
  handleGetOrderStats,
  handleGetTraffic,
  handleTriggerAggregation,
  handleTrackPageView,
} from '../controllers/analyticsController.js';

const router = express.Router();

// All analytics routes are admin-only except /track.
// optionalAuth so a logged-in visitor's saved cookie consent can be honored
// (analytics opt-out → the view is not recorded). Guests pass through as null.
router.post('/track', optionalAuth, handleTrackPageView);   // public — called by frontend

router.use(authenticate);
router.use(requireRole('admin'));

router.get('/dashboard',   handleGetDashboard);
router.get('/sales',       handleGetSales);
router.get('/orders',      handleGetOrderStats);
router.get('/traffic',     handleGetTraffic);
router.post('/aggregate',  handleTriggerAggregation);  // ops only

export default router;
