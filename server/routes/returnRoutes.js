/**
 * routes/returnRoutes.js
 *
 * All routes require admin role.
 *
 * Mount in app.js:
 *   import returnRoutes from './routes/returnRoutes.js';
 *   app.use('/api/returns', returnRoutes);
 */

import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import {
  handleGetReturns,
  handleRequestReturn,
  handleConfirmReturn,
  handleGetManualRefunds,
  handleGetAllRefunds,
  handleMarkRefundComplete,
} from '../controllers/returnController.js';

const router = express.Router();

// All return routes are admin-only
router.use(authMiddleware, requireRole('admin'));

router.get ('/',                              handleGetReturns);
router.post('/:orderId/request',             handleRequestReturn);
router.post('/:orderId/confirm',             handleConfirmReturn);
router.get ('/manual-refunds',               handleGetManualRefunds);
router.get ('/refunds',                      handleGetAllRefunds);
router.post('/refunds/:refundId/complete',   handleMarkRefundComplete);

export default router;