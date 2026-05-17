import express from 'express';
import { optionalAuth, authMiddleware } from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import {
  handleInitialize,
  handleVerify,
  handleWebhook,
  handleAdminRefund,
  handleMockGateway,
} from '../controllers/paymentController.js';

const router = express.Router();

// optionalAuth: attaches req.user if token present, else guest continues.
// The controller verifies ownership via userId or X-Guest-Token.
router.post('/initialize', optionalAuth, handleInitialize);

// Paystack redirects the browser here — no auth, no guest token needed.
// The orderId in the URL is enough to find the order.
router.get('/verify/:orderId', handleVerify);

// Webhook: no auth — signature-verified with HMAC instead.
router.post('/webhook', handleWebhook);

// Admin only
router.post('/refund', authMiddleware, requireRole('admin'), handleAdminRefund);

// Dev only — fake checkout page
if (process.env.NODE_ENV !== 'production') {
  router.get('/mock-gateway', handleMockGateway);
}

export default router;

/*
 * ── app.js reminder ───────────────────────────────────────────────────────
 *
 * Capture rawBody before express.json() for webhook signature verification:
 *
 *   app.use(express.json({
 *     verify: (req, _res, buf) => { req.rawBody = buf.toString('utf8'); }
 *   }));
 *
 * Mount routes:
 *   app.use('/api/orders',  orderRoutes);
 *   app.use('/api/payment', paymentRoutes);
 */