import express from 'express';
import {
  handleCheckout,
  handleGetMyOrders,
  handleGetMyOrder,
  handleGetCancelReasons,
  handleCustomerCancel,
  handleAdminGetOrders,
  handleAdminGetOrder,
  handleUpdateStatus,
  handleAdminCancel,
  handleExportOrders,
} from '../controllers/orderController.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';

const router = express.Router();

/* ── Customer / Guest routes ──────────────────────────────────────────────── */

// optionalAuth: attaches req.user if a valid token is present, but does NOT
// reject unauthenticated requests — the controller handles guest logic itself.

router.post('/checkout',       optionalAuth,  handleCheckout);          // guest + auth
router.get ('/cancel-reasons', handleGetCancelReasons);                  // public
router.get ('/my',             authMiddleware, handleGetMyOrders);       // auth only (guests have no list)
router.get ('/my/:id',         optionalAuth,  handleGetMyOrder);         // guest (X-Guest-Token) + auth
router.post('/:id/cancel',     optionalAuth,  handleCustomerCancel);     // guest + auth

/* ── Admin routes ─────────────────────────────────────────────────────────── */
// Staff may view orders and move fulfillment status forward. Cancelling an
// order can trigger a REFUND (money out), so /admin-cancel stays admin-only.

router.get   ('/',                 authMiddleware, requireRole('admin', 'staff'), handleAdminGetOrders);
router.get   ('/export',           authMiddleware, requireRole('admin', 'staff'), handleExportOrders);
router.get   ('/:id',              authMiddleware, requireRole('admin', 'staff'), handleAdminGetOrder);
router.patch ('/:id/status',       authMiddleware, requireRole('admin', 'staff'), handleUpdateStatus);
router.post  ('/:id/admin-cancel', authMiddleware, requireRole('admin'),          handleAdminCancel);

export default router;