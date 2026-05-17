/**
 * controllers/paymentController.js
 *
 * Handles the payment lifecycle ONLY. Zero order business logic lives here.
 *
 * Responsibilities:
 *  1. Initialize payment    — get Paystack link for an existing order
 *  2. Verify payment        — handle browser redirect after card flow
 *  3. Webhook               — handle async Paystack events (primary success path)
 *  4. Admin refund          — initiate refund via OrderService + PaymentService
 *  5. Mark manual complete  — ops marks a manual bank transfer refund as done
 *  6. Mock gateway          — dev-only fake checkout page
 *
 * Key architectural rules:
 *  • NO DB transactions in this file. Transactions are OrderService's job.
 *  • External payment API calls happen OUTSIDE any transaction.
 *  • handlePaymentSuccess / handlePaymentFailure are called here — not in OrderService.
 *
 * Email resolution in handleInitialize (in priority order):
 *  1. order.guestEmail   — set at order creation from the checkout form (primary)
 *  2. order.user?.email  — fallback for legacy orders created before guestEmail was always stored
 *  3. req.body.email     — sent by PaymentPage as a last-resort fallback for old NULL rows
 *
 * Switching mock → real Paystack:
 *  Change ONE import line at the top. Nothing else in this file changes.
 */

import asyncHandler from '../utils/Asynchandler.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import { AppError, NotFoundError, ValidationError } from '../utils/AppError.js';
import { Op } from 'sequelize';
import db from '../models/index.js';
import {
  initializePayment,
  verifyPayment,
  initiateRefund,
  verifyWebhookSignature,
  simulateWebhook,
} from '../services/MockPaymentService.js';
// ─── TO GO LIVE: swap the line above for: ────────────────────────────────────
// import {
//   initializePayment,
//   verifyPayment,
//   initiateRefund,
//   verifyWebhookSignature,
// } from '../services/PaystackService.js';
// ─────────────────────────────────────────────────────────────────────────────
import {
  handlePaymentSuccess,
  handlePaymentFailure,
  initiateRefundFlow,
  updateRefundStatus,
  getOrderById,
} from '../services/OrderService.js';

const FRONTEND_URL  = process.env.FRONTEND_URL  ?? 'http://localhost:5173';
const BACKEND_URL   = process.env.BACKEND_URL   ?? 'http://localhost:5000';
const WEBHOOK_URL   = `${BACKEND_URL}/api/payment/webhook`;
const CALLBACK_BASE = `${BACKEND_URL}/api/payment/verify`;

// Paystack rejects refund API calls for charges older than 20 days
const PAYSTACK_REFUND_WINDOW_MS = 20 * 24 * 60 * 60 * 1000;

const toKobo   = (ngn) => Math.round(parseFloat(ngn) * 100);
const fromKobo = (k)   => parseFloat(k) / 100;

/* ── Initialize ──────────────────────────────────────────────────────────── */

/**
 * POST /api/payment/initialize
 *
 * Email resolution (in priority order):
 *  1. order.guestEmail   — stored at checkout for ALL orders going forward
 *  2. order.user?.email  — legacy fallback for old orders pre-dating guestEmail convention
 *  3. req.body.email     — sent by PaymentPage from router state for orders where
 *                          guest_email is NULL in DB (existing broken orders)
 *
 * This three-tier fallback means:
 *  - New orders: always resolved from order.guestEmail (set at createOrderFromCart)
 *  - Old orders with NULL guest_email: resolved from req.body.email sent by PaymentPage
 *  - After this deploy: req.body.email fallback will never be needed for new orders
 */
export const handleInitialize = asyncHandler(async (req, res) => {
  const { orderId, email: bodyEmail } = req.body;
  if (!orderId) throw new ValidationError('orderId is required');

  const userId     = req.user?.id ?? null;
  const guestToken = req.headers['x-guest-token'] ?? null;

  const order = await db.Order.findOne({
    where:      { id: orderId },
    attributes: [
      'id', 'orderNumber', 'totalAmount', 'currency',
      'paymentStatus', 'status', 'userId', 'guestToken',
      'guestEmail', 'paymentReference',
    ],
    include: [{
      model:      db.User,
      as:         'user',
      attributes: ['id', 'email'],
      required:   false,
    }],
  });

  if (!order) throw new NotFoundError('Order not found');

  // Ownership check
  if (userId) {
    if (order.userId && order.userId !== userId) throw new AppError('Order not found', 404);
  } else if (guestToken) {
    if (order.guestToken !== guestToken) throw new AppError('Order not found', 404);
  } else {
    throw new AppError('Authentication or guest token required', 401);
  }

  if (order.paymentStatus === 'paid')      throw new AppError('Order is already paid', 409);
  if (order.status        === 'cancelled') throw new AppError('Cannot pay for a cancelled order', 422);

  // ── Email resolution ──────────────────────────────────────────────────────
  // Three-tier fallback — see JSDoc above.
  const email = order.guestEmail || order.user?.email || bodyEmail || null;

  if (!email) {
    throw new AppError(
      'No email address found for this order. Please contact support.', 422
    );
  }

  // If order.guestEmail was NULL (old order), persist the email now so future
  // retries don't need the bodyEmail fallback either.
  if (!order.guestEmail && email) {
    await order.update({ guestEmail: email });
  }

  const reference = order.paymentReference;
  if (!reference) {
    throw new AppError('Order is missing a payment reference. Please contact support.', 500);
  }

  const result = await initializePayment({
    email,
    amount:      toKobo(order.totalAmount),
    orderId:     order.id,
    orderNumber: order.orderNumber,
    currency:    order.currency ?? 'NGN',
    reference,
    callbackUrl: `${CALLBACK_BASE}/${order.id}`,
  });

  // Simulate async webhook in dev — fires after MOCK_WEBHOOK_DELAY_MS
  if (process.env.NODE_ENV !== 'production') {
    const outcome = Math.random() < parseFloat(process.env.MOCK_PAYMENT_FAIL_RATE ?? '0')
      ? 'failed'
      : 'success';
    simulateWebhook(outcome, reference, WEBHOOK_URL);
  }

  return sendCreated(res, {
    reference:         result.reference,
    authorization_url: result.authorization_url,
    access_code:       result.access_code,
    orderNumber:       order.orderNumber,
    amount:            order.totalAmount,
  }, 'Payment initialized');
});

/* ── Verify ──────────────────────────────────────────────────────────────── */

/**
 * GET /api/payment/verify/:orderId?reference=xxx
 *
 * Browser lands here after the card flow. Verifies with Paystack and
 * delegates state change to OrderService. Idempotent — if already paid,
 * redirects to success without reprocessing.
 */
export const handleVerify = asyncHandler(async (req, res) => {
  const { orderId }   = req.params;
  const { reference } = req.query;
  if (!reference) throw new ValidationError('Payment reference is required');

  const order = await db.Order.findByPk(orderId, {
    attributes: ['id', 'orderNumber', 'paymentStatus', 'paymentReference'],
  });
  if (!order) throw new NotFoundError('Order not found');

  // IDEMPOTENCY: already paid → redirect to success without re-verifying.
  if (order.paymentStatus === 'paid') {
    return res.redirect(`${FRONTEND_URL}/orders/${order.orderNumber}?payment=success`);
  }

  const result = await verifyPayment(reference);

  if (!result.status || result.data?.status !== 'success') {
    await handlePaymentFailure(
      order.paymentReference,
      result.data?.gateway_response || 'Payment was not completed',
    ).catch(() => {});

    return res.redirect(
      `${FRONTEND_URL}/payment?orderId=${orderId}&error=${encodeURIComponent('Payment was not completed')}`
    );
  }

  await handlePaymentSuccess(order.paymentReference, result.data);
  return res.redirect(`${FRONTEND_URL}/orders/${order.orderNumber}?payment=success`);
});

/* ── Webhook ─────────────────────────────────────────────────────────────── */

/**
 * POST /api/payment/webhook
 *
 * PRIMARY payment confirmation path. Always responds 200 immediately.
 * Both handlePaymentSuccess and handlePaymentFailure are idempotent —
 * duplicate deliveries are harmless.
 */
export const handleWebhook = asyncHandler(async (req, res) => {
  res.status(200).json({ received: true });

  const sig     = req.headers['x-paystack-signature'];
  const rawBody = req.rawBody ?? JSON.stringify(req.body);

  if (!verifyWebhookSignature(rawBody, sig)) {
    console.warn('[Webhook] Invalid signature — ignoring');
    return;
  }

  const { event, data } = req.body;

  try {
    if (event === 'charge.success') {
      await handlePaymentSuccess(data.reference, data);

    } else if (event === 'charge.failed') {
      await handlePaymentFailure(
        data.reference,
        data.gateway_response || 'Payment declined by gateway',
      );

    } else if (event === 'refund.processed') {
      await db.Refund.update(
        { status: 'completed', processedAt: new Date() },
        { where: { gatewayReference: data.refund_reference } }
      );
    }
  } catch (err) {
    console.error(`[Webhook] Error processing event "${event}":`, err.message);
  }
});

/* ── Admin refund ─────────────────────────────────────────────────────────── */

/**
 * POST /api/payment/refund
 *
 * Flow:
 *  1. initiateRefundFlow()  → creates 'pending' refund record, commits to DB
 *  2. Call Paystack OUTSIDE the transaction
 *  3. updateRefundStatus()  → updates refund record with gateway result
 */
export const handleAdminRefund = asyncHandler(async (req, res) => {
  const { orderId, amount, reason, method } = req.body;
  if (!orderId) throw new ValidationError('orderId is required');

  const { refund, order, paymentReference, refundAmount } = await initiateRefundFlow(orderId, {
    amount:  amount ? parseFloat(amount) : null,
    reason:  reason ?? 'Admin refund',
    method:  method ?? 'Paystack',
    actorId: req.user.id,
  });

  let finalStatus    = 'pending';
  let gatewayRef     = null;
  let manualRequired = false;
  let finalMethod    = refund.method;

  const chargeAgeMs          = Date.now() - new Date(order.createdAt).getTime();
  const beyondPaystackWindow = chargeAgeMs > PAYSTACK_REFUND_WINDOW_MS;
  const hasReference         = !!paymentReference;
  const canUsePaystack       = hasReference && !beyondPaystackWindow && finalMethod === 'Paystack';

  if (finalMethod === 'Paystack' && (!hasReference || beyondPaystackWindow)) {
    finalMethod    = 'Bank Transfer';
    finalStatus    = 'manual_required';
    manualRequired = true;
    console.warn(
      `[Refund] Order ${orderId} — ${!hasReference ? 'no paymentReference' : 'past 20-day window'} — forcing manual`
    );
  }

  if (canUsePaystack) {
    try {
      const gatewayResult = await initiateRefund({
        reference:    paymentReference,
        amount:       toKobo(refundAmount),
        merchantNote: reason ?? 'Admin refund',
      });
      gatewayRef  = gatewayResult?.data?.refund_reference ?? null;
      finalStatus = 'pending';
    } catch (err) {
      console.error('[Refund] Paystack initiateRefund failed:', err.message);
      finalMethod    = 'Bank Transfer';
      finalStatus    = 'manual_required';
      manualRequired = true;
    }
  }

  const updatedRefund = await updateRefundStatus(refund.id, {
    gatewayReference: gatewayRef,
    status:           finalStatus,
  });

  const message = manualRequired
    ? 'Refund logged as manual_required — process via Bank Transfer and mark complete when done'
    : 'Refund initiated via Paystack';

  return sendCreated(res, {
    refund:         updatedRefund,
    manualRequired,
    method:         finalMethod,
  }, message);
});

/* ── Mark manual refund complete ─────────────────────────────────────────── */

export const handleMarkRefundComplete = asyncHandler(async (req, res) => {
  const { refundId } = req.params;
  const { note }     = req.body;

  const refund = await db.Refund.findByPk(refundId);
  if (!refund) throw new NotFoundError('Refund not found');

  if (refund.status === 'completed') {
    throw new AppError('Refund is already marked as completed', 409);
  }

  const updated = await updateRefundStatus(refund.id, {
    status:        'completed',
    failureReason: null,
  });

  const order = await db.Order.findByPk(refund.orderId, { attributes: ['id', 'status'] });
  if (order && note) {
    await db.OrderTracking.create({
      orderId:   order.id,
      status:    order.status,
      note:      `Manual refund of ₦${parseFloat(refund.amount).toLocaleString('en-NG')} marked complete` +
                 (note ? ` · ${note}` : ''),
      updatedBy: req.user.id,
    });
  }

  return sendSuccess(res, updated, 'Refund marked as complete');
});

/* ── Mock gateway (dev only) ─────────────────────────────────────────────── */

export const handleMockGateway = asyncHandler(async (req, res) => {
  const { reference, orderId: qOrderId } = req.query;

  const order = qOrderId && await db.Order.findByPk(qOrderId, {
    attributes: ['id', 'orderNumber', 'totalAmount'],
  });

  const orderId   = order?.id ?? qOrderId ?? '';
  const amountNgn = order ? parseFloat(order.totalAmount) : 0;
  const amountFmt = amountNgn > 0 ? 'NGN ' + amountNgn.toLocaleString('en-NG') : '...';
  const verifyUrl = CALLBACK_BASE + '/' + orderId + '?reference=' + encodeURIComponent(reference || '');
  const failUrl   = FRONTEND_URL + '/payment?orderId=' + orderId + '&error=' + encodeURIComponent('Payment was declined');

  const crypto = await import('crypto');
  const nonce  = crypto.default.randomBytes(16).toString('base64');

  const html = [
    '<!DOCTYPE html><html lang="en"><head>',
    '<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>',
    '<title>Mock Payment Gateway</title>',
    '<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,sans-serif;background:#F9F9F9;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px}.card{background:#fff;border-radius:16px;padding:40px 32px;width:100%;max-width:400px;border:1px solid #F1F1F1}h1{font-size:20px;font-weight:900;color:#1A1102;margin-bottom:2px}.sub{font-size:12px;color:#B8A98A;margin-bottom:28px}.badge{display:inline-block;background:#FFF8E7;color:#FFAA14;border:1px solid #FFAA14;border-radius:99px;font-size:10px;font-weight:700;padding:2px 10px;margin-bottom:20px}.amount{font-size:32px;font-weight:900;color:#1A1102;margin-bottom:4px}.ref{font-size:11px;color:#B8A98A;font-family:monospace;margin-bottom:24px;word-break:break-all}.test{background:#F9F9F9;border-radius:10px;padding:14px;margin-bottom:24px;font-size:12px;color:#6B6040;line-height:1.7}.test strong{color:#1A1102}button{width:100%;padding:14px;border-radius:10px;border:none;font-weight:800;font-size:14px;cursor:pointer;margin-bottom:10px;transition:opacity .15s}.pay{background:#FFAA14;color:#1A1102}.fail{background:#F9F9F9;color:#B8A98A;border:1px solid #F1F1F1}button:disabled{opacity:.5;cursor:not-allowed}#proc{display:none;text-align:center;color:#6B6040;font-size:13px;margin-top:8px}</style>',
    '</head><body><div class="card">',
    '<h1>Paystack</h1><p class="sub">Secure Checkout (Mock)</p>',
    '<div class="badge">Dev Environment</div>',
    '<div class="amount">' + amountFmt + '</div>',
    '<div class="ref">ref: ' + (reference || '') + '</div>',
    '<div class="test"><strong>Test card</strong><br>4084 0840 8408 4081<br>CVV: 408 &nbsp; Expiry: 01/99 &nbsp; PIN: 0000 &nbsp; OTP: 123456</div>',
    '<button class="pay" id="btn-pay">Pay ' + amountFmt + '</button>',
    '<button class="fail" id="btn-fail">Simulate Failed Payment</button>',
    '<p id="proc">Processing...</p></div>',
    '<script>',
    'var PAY_URL="' + verifyUrl + '";var FAIL_URL="' + failUrl + '";',
    'var proc=document.getElementById("proc");var btnPay=document.getElementById("btn-pay");var btnFail=document.getElementById("btn-fail");',
    'function disableAll(msg){proc.textContent=msg;proc.style.display="block";btnPay.disabled=true;btnFail.disabled=true;}',
    'btnPay.addEventListener("click",function(){disableAll("Processing payment...");setTimeout(function(){window.location.href=PAY_URL;},1500);});',
    'btnFail.addEventListener("click",function(){disableAll("Simulating failure...");setTimeout(function(){window.location.href=FAIL_URL;},1500);});',
    '<\/script></body></html>',
  ].join('\n');

  res.setHeader('Content-Security-Policy',
    "default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-" + nonce + "'"
  );
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html.replace('<script>', '<script nonce="' + nonce + '">'));
});