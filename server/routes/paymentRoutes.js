import express from 'express';
import { optionalAuth, authMiddleware } from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import { paymentRateLimit } from '../middleware/RateLimit.js';
import {
  handleInitialize,
  handleVerify,
  handleWebhook,
  handleAdminRefund,
  handleMarkRefundComplete,
  handleMockGateway,
  handleMockFail,
} from '../controllers/paymentController.js';

const router = express.Router();

// optionalAuth attaches req.user if token is present; guest continues without.
// The controller verifies ownership via userId or X-Guest-Token header.
router.post('/initialize', paymentRateLimit, optionalAuth, handleInitialize);

// Paystack / mock gateway redirects here after the card flow — no auth needed.
router.get('/verify/:orderId', paymentRateLimit, handleVerify);

// Webhook: no auth — HMAC-SHA512 signature-verified inside the handler.
router.post('/webhook', handleWebhook);

// Admin: initiate a refund
router.post('/refund', authMiddleware, requireRole('admin'), handleAdminRefund);

// Admin: mark a manual refund as completed
router.post('/refund/:refundId/mark-complete', authMiddleware, requireRole('admin'), handleMarkRefundComplete);

// Dev only — mock payment pages
if (process.env.NODE_ENV !== 'production') {
  router.get('/mock-gateway', handleMockGateway);
  router.get('/mock-fail',    handleMockFail);
}

export default router;

/*
 * ── server.js reminder ────────────────────────────────────────────────────
 *
 * rawBody must be captured before express.json() for webhook verification:
 *
 *   app.use(express.json({
 *     verify: (req, _res, buf) => { req.rawBody = buf.toString('utf8'); }
 *   }));
 *
 * Route mounts:
 *   app.use('/api/orders',  orderRoutes);
 *   app.use('/api/payment', paymentRoutes);
 */
