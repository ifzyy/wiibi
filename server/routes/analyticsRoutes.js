/**
 * routes/analyticsRoutes.js
 */
import express from 'express';
import { authenticate } from '../middleware/auth.js';
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

// All analytics routes are admin-only except /track
router.post('/track', handleTrackPageView);   // public — called by frontend

router.use(authenticate);
router.use(requireRole('admin'));

router.get('/dashboard',   handleGetDashboard);
router.get('/sales',       handleGetSales);
router.get('/orders',      handleGetOrderStats);
router.get('/traffic',     handleGetTraffic);
router.post('/aggregate',  handleTriggerAggregation);  // ops only

export default router;
