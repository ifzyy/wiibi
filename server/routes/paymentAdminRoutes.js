/**
 * routes/paymentAdminRoutes.js
 *
 * Admin payment reporting routes.
 * Note: these are READ-ONLY. All payment writes (refund initiation,
 * mark-complete) stay on the existing paymentRoutes.js.
 */
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import {
  handleGetPaymentLog,
  handleGetPaymentStats,
  handleGetRefundLog,
  handleGetPaymentDetail,
  handleReconcile,
  handleExportPayments,
} from '../controllers/paymentAdminController.js';

const router = express.Router();

router.use(authenticate);
router.use(requireRole('admin'));

router.get('/',             handleGetPaymentLog);     // GET /admin/payments
router.get('/stats',        handleGetPaymentStats);   // GET /admin/payments/stats
router.get('/refunds',      handleGetRefundLog);      // GET /admin/payments/refunds
router.get('/reconcile',    handleReconcile);         // GET /admin/payments/reconcile
router.get('/export',       handleExportPayments);    // GET /admin/payments/export
router.get('/:orderId',     handleGetPaymentDetail);  // GET /admin/payments/:orderId

export default router;
