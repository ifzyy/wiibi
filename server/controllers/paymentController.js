/**
 * controllers/paymentController.js
 *
 * Handles the payment lifecycle ONLY. Zero order business logic lives here.
 *
 * Responsibilities:
 *  1. Initialize payment    — get gateway link for an existing order
 *  2. Verify payment        — handle browser redirect after card flow
 *  3. Webhook               — handle async provider events (primary success path)
 *  4. Admin refund          — initiate refund via OrderService + PaymentProvider
 *  5. Mark manual complete  — ops marks a manual bank transfer refund as done
 *  6. Mock gateway          — dev-only fake checkout page
 *  7. Mock fail             — dev-only: explicit failure path for "Simulate Failed"
 *
 * Architectural rules:
 *  • NO DB transactions in this file. Transactions are OrderService's job.
 *  • External payment API calls happen OUTSIDE any transaction.
 *  • Webhooks are the source of truth — verify is idempotent fallback.
 *
 * Email resolution in handleInitialize (priority order):
 *  1. order.guestEmail   — stored at order creation for all orders
 *  2. order.user?.email  — legacy fallback for orders created before guestEmail was stored
 *  3. req.body.email     — last-resort fallback sent by PaymentPage for old NULL rows
 *
 * Webhook simulation (dev only):
 *  - Auto-webhook fires MOCK_WEBHOOK_DELAY_MS after initialize (tests webhook-first path)
 *  - handleVerify fires a second webhook after processing (tests idempotent delivery)
 *  - handleMockFail fires a failure webhook immediately and redirects to error URL
 *
 * Switching to real Paystack:
 *  Set PAYMENT_PROVIDER=paystack (or NODE_ENV=production) in .env.
 *  Nothing in this file changes.
 */

import asyncHandler from '../utils/Asynchandler.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import { AppError, NotFoundError, ValidationError } from '../utils/AppError.js';
import db from '../models/index.js';
import {
  initializePayment,
  verifyPayment,
  initiateRefund,
  verifyWebhookSignature,
  simulateWebhook,
  markFailed,
} from '../services/paymentProvider.js';
import {
  handlePaymentSuccess,
  handlePaymentFailure,
  initiateRefundFlow,
  updateRefundStatus,
  getOrderById,
} from '../services/OrderService.js';
import { recordAudit } from '../services/AuditService.js';

const FRONTEND_URL  = process.env.FRONTEND_URL  ?? 'http://localhost:5173';
const BACKEND_URL   = process.env.BACKEND_URL   ?? 'http://localhost:5000';
const WEBHOOK_URL   = `${BACKEND_URL}/api/payment/webhook`;
const CALLBACK_BASE = `${BACKEND_URL}/api/payment/verify`;

// Paystack rejects refund API calls for charges older than 20 days
const PAYSTACK_REFUND_WINDOW_MS = 20 * 24 * 60 * 60 * 1000;

const toKobo = (ngn) => Math.round(parseFloat(ngn) * 100);

/* ── Initialize ──────────────────────────────────────────────────────────── */

/**
 * POST /api/payment/initialize
 *
 * Returns a gateway URL for the given order. Idempotent — calling twice
 * for the same already-paid order returns 409.
 *
 * Auto-webhook (dev only): fires after MOCK_WEBHOOK_DELAY_MS to simulate the
 * webhook-first production path (gateway fires webhook → browser callback is secondary).
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

  // Three-tier email resolution — see JSDoc above
  const email = order.guestEmail || order.user?.email || bodyEmail || null;
  if (!email) {
    throw new AppError(
      'No email address found for this order. Please contact support.', 422
    );
  }

  // Persist resolved email so future retries don't need the bodyEmail fallback
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

  // Auto-webhook (dev only): tests the webhook-first production path.
  // Fires after MOCK_WEBHOOK_DELAY_MS — no-op in production.
  if (process.env.NODE_ENV !== 'production') {
    simulateWebhook(reference, WEBHOOK_URL);
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
 * Browser lands here after the card flow. Verifies with the provider and
 * delegates state change to OrderService. Fully idempotent.
 *
 * After processing, a second webhook is fired (dev only) to test duplicate
 * delivery idempotency — both handlePaymentSuccess and handlePaymentFailure
 * are designed to handle this harmlessly.
 */
export const handleVerify = asyncHandler(async (req, res) => {
  const { orderId }   = req.params;
  const { reference } = req.query;
  if (!reference) throw new ValidationError('Payment reference is required');

  const order = await db.Order.findByPk(orderId, {
    attributes: ['id', 'orderNumber', 'paymentStatus', 'paymentReference'],
  });
  if (!order) throw new NotFoundError('Order not found');

  // IDEMPOTENCY: already paid → redirect to success without re-verifying
  if (order.paymentStatus === 'paid') {
    return res.redirect(`${FRONTEND_URL}/orders/${order.orderNumber}?payment=success`);
  }

  // SECURITY: the reference being verified MUST belong to THIS order.
  // Without this binding, a valid 'success' reference from any other (cheap)
  // transaction could be replayed against an expensive order to mark it paid.
  // Always verify the order's own server-generated reference — never the raw
  // query param the browser supplied.
  if (reference !== order.paymentReference) {
    throw new AppError('Payment reference does not match this order', 400);
  }

  const result = await verifyPayment(order.paymentReference);

  if (!result.status || result.data?.status !== 'success') {
    await handlePaymentFailure(
      order.paymentReference,
      result.data?.gateway_response || 'Payment was not completed',
    ).catch(() => {});

    // Fire failure webhook for idempotency testing (dev only)
    if (process.env.NODE_ENV !== 'production') {
      simulateWebhook(reference, WEBHOOK_URL, 0);
    }

    return res.redirect(
      `${FRONTEND_URL}/payment?orderId=${orderId}&error=${encodeURIComponent('Payment was not completed')}`
    );
  }

  await handlePaymentSuccess(order.paymentReference, result.data);

  // Fire success webhook for idempotency testing (dev only) — should be a no-op
  if (process.env.NODE_ENV !== 'production') {
    simulateWebhook(reference, WEBHOOK_URL, 0);
  }

  return res.redirect(`${FRONTEND_URL}/orders/${order.orderNumber}?payment=success`);
});

/* ── Mock fail (dev only) ────────────────────────────────────────────────── */

/**
 * GET /api/payment/mock-fail?reference=xxx&orderId=xxx
 *
 * Hit when the user clicks "Simulate Failed Payment" on the mock gateway.
 * - Overrides the pre-determined outcome in txStore to 'failed'
 * - Fires a failure webhook immediately (before the auto-webhook fires)
 * - Redirects to the frontend error URL
 *
 * This ensures the auto-webhook (fired MOCK_WEBHOOK_DELAY_MS after initialize)
 * also reads 'failed' from txStore and the order is not marked as paid.
 */
export const handleMockFail = asyncHandler(async (req, res) => {
  const { reference, orderId } = req.query;

  if (reference) {
    markFailed(reference);
    simulateWebhook(reference, WEBHOOK_URL, 0);
  }

  const errorParam = encodeURIComponent('Payment was declined (simulated)');
  return res.redirect(`${FRONTEND_URL}/payment?orderId=${orderId ?? ''}&error=${errorParam}`);
});

/* ── Webhook ─────────────────────────────────────────────────────────────── */

/**
 * POST /api/payment/webhook
 *
 * PRIMARY payment confirmation path. Always responds 200 immediately so the
 * provider doesn't retry. Both handlePaymentSuccess and handlePaymentFailure
 * are idempotent — duplicate deliveries are harmless.
 */
export const handleWebhook = asyncHandler(async (req, res) => {
  const sig     = req.headers['x-paystack-signature'];
  const rawBody = req.rawBody;

  // The signature is an HMAC of the EXACT bytes received. Falling back to
  // JSON.stringify(req.body) would re-serialise and never match — so a missing
  // rawBody means the express.json verify hook is misconfigured. Reject loudly
  // rather than silently accept (or silently reject) unverifiable webhooks.
  if (!rawBody) {
    console.error('[Webhook] Missing rawBody — express.json verify hook not configured; rejecting');
    return res.status(400).json({ received: false, message: 'Unverifiable payload' });
  }

  // Verify BEFORE acknowledging. A bad signature means the request is not from
  // Paystack at all (genuine deliveries always sign correctly), so a 401 here
  // cannot trigger provider retry storms — it only tells forgers nothing landed.
  if (!verifyWebhookSignature(rawBody, sig)) {
    console.warn('[Webhook] Invalid signature — rejecting');
    return res.status(401).json({ received: false, message: 'Invalid signature' });
  }

  // Acknowledge immediately so slow processing can't hit the provider's
  // delivery timeout; handlers below are idempotent under redelivery.
  res.status(200).json({ received: true });

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
 *  1. initiateRefundFlow() → creates 'pending' refund record, commits to DB
 *  2. Call provider outside the transaction
 *  3. updateRefundStatus() → updates refund record with gateway result
 *
 * If the provider returns status:false (not an exception), we treat it as a
 * failure and escalate to manual_required — same as a thrown error.
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

      // status:false means the provider returned a structured failure (not an exception)
      if (!gatewayResult?.status) {
        throw new Error(gatewayResult?.message || 'Refund declined by payment provider');
      }

      gatewayRef  = gatewayResult?.data?.refund_reference ?? null;
      finalStatus = 'pending';
    } catch (err) {
      console.error('[Refund] Provider initiateRefund failed:', err.message);
      finalMethod    = 'Bank Transfer';
      finalStatus    = 'manual_required';
      manualRequired = true;
    }
  }

  const updatedRefund = await updateRefundStatus(refund.id, {
    gatewayReference: gatewayRef,
    status:           finalStatus,
  });

  await recordAudit({
    actorId:    req.user.id,
    action:     'payment.refunded',
    entityType: 'order',
    entityId:   orderId,
    metadata:   { refundId: refund.id, amount: refundAmount, method: finalMethod, status: finalStatus, manualRequired },
    ip:         req.ip,
  });

  const message = manualRequired
    ? 'Refund logged as manual_required — process via Bank Transfer and mark complete when done'
    : 'Refund initiated via payment provider';

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
  if (order) {
    await db.OrderTracking.create({
      orderId:   order.id,
      status:    order.status,
      note:      `Manual refund of ₦${parseFloat(refund.amount).toLocaleString('en-NG')} marked complete` +
                 (note ? ` · ${note}` : ''),
      updatedBy: req.user.id,
    });
  }

  await recordAudit({
    actorId:    req.user.id,
    action:     'payment.refund_marked_complete',
    entityType: 'refund',
    entityId:   refund.id,
    metadata:   { orderId: refund.orderId, amount: refund.amount, note: note ?? null },
    ip:         req.ip,
  });

  return sendSuccess(res, updated, 'Refund marked as complete');
});

/* ── Mock gateway (dev only) ─────────────────────────────────────────────── */

export const handleMockGateway = asyncHandler(async (req, res) => {
  const { reference, orderId: qOrderId } = req.query;

  const order = qOrderId && await db.Order.findByPk(qOrderId, {
    attributes: ['id', 'orderNumber', 'totalAmount'],
  });

  const orderId    = order?.id ?? qOrderId ?? '';
  const amountNgn  = order ? parseFloat(order.totalAmount) : 0;
  const amountFmt  = amountNgn > 0 ? '₦' + amountNgn.toLocaleString('en-NG') : '...';
  const verifyUrl  = `${CALLBACK_BASE}/${orderId}?reference=${encodeURIComponent(reference || '')}`;
  const failUrl    = `${BACKEND_URL}/api/payment/mock-fail?reference=${encodeURIComponent(reference || '')}&orderId=${encodeURIComponent(orderId)}`;

  const { default: crypto } = await import('crypto');
  const nonce = crypto.randomBytes(16).toString('base64');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Mock Payment Gateway</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F4F4F0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px}
    .card{background:#fff;border-radius:20px;padding:36px 32px;width:100%;max-width:420px;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    .logo{display:flex;align-items:center;gap:10px;margin-bottom:20px}
    .logo-mark{width:36px;height:36px;background:#00C3F7;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;font-size:14px;letter-spacing:-.5px}
    .logo-name{font-weight:800;font-size:16px;color:#1a1a2e}
    .dev-badge{display:inline-flex;align-items:center;gap:5px;background:#FFF3CD;color:#856404;border:1px solid #FFE69C;border-radius:6px;font-size:11px;font-weight:700;padding:3px 10px;margin-bottom:20px}
    .dev-badge::before{content:'⚙';font-size:10px}
    .amount-block{background:#F8F9FA;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px}
    .amount-label{font-size:11px;color:#6C757D;font-weight:600;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}
    .amount-value{font-size:34px;font-weight:900;color:#1a1a2e;letter-spacing:-.02em}
    .order-num{font-size:11px;color:#ADB5BD;font-family:monospace;margin-top:4px}
    .ref-block{background:#F8F9FA;border-radius:8px;padding:10px 14px;margin-bottom:20px;font-size:11px;color:#6C757D;font-family:monospace;word-break:break-all}
    .ref-label{font-weight:700;color:#495057;margin-right:6px}
    .card-hint{border:1px solid #E9ECEF;border-radius:10px;padding:14px;margin-bottom:24px;font-size:12px;color:#495057;line-height:1.9}
    .card-hint strong{color:#1a1a2e}
    .hint-row{display:flex;gap:16px;margin-top:6px}
    .hint-chip{background:#F8F9FA;border-radius:6px;padding:3px 8px;font-family:monospace}
    .btn{width:100%;padding:14px;border-radius:12px;border:none;font-weight:800;font-size:14px;cursor:pointer;transition:all .15s;margin-bottom:10px;letter-spacing:.01em}
    .btn:disabled{opacity:.5;cursor:not-allowed}
    .btn-pay{background:#006400;color:#fff}
    .btn-pay:hover:not(:disabled){background:#005200}
    .btn-fail{background:#F8F9FA;color:#6C757D;border:1px solid #DEE2E6}
    .btn-fail:hover:not(:disabled){background:#F1F3F5;color:#495057}
    .status-msg{text-align:center;font-size:13px;color:#6C757D;margin-top:8px;min-height:20px;transition:opacity .2s}
    .footer{text-align:center;font-size:11px;color:#ADB5BD;margin-top:20px;display:flex;align-items:center;justify-content:center;gap:6px}
    .lock-icon{width:12px;height:14px;display:inline-block;vertical-align:middle}
  </style>
</head>
<body>
<div class="card">
  <div class="logo">
    <div class="logo-mark">PS</div>
    <span class="logo-name">Paystack</span>
  </div>

  <div class="dev-badge">Development Environment</div>

  <div class="amount-block">
    <div class="amount-label">Amount to pay</div>
    <div class="amount-value">${amountFmt}</div>
    ${order?.orderNumber ? `<div class="order-num">${order.orderNumber}</div>` : ''}
  </div>

  <div class="ref-block">
    <span class="ref-label">REF</span>${reference || '—'}
  </div>

  <div class="card-hint">
    <strong>Test Card Details</strong>
    <div class="hint-row">
      <span>Number</span>
      <span class="hint-chip">4084 0840 8408 4081</span>
    </div>
    <div class="hint-row">
      <span>CVV</span><span class="hint-chip">408</span>
      <span>Expiry</span><span class="hint-chip">01/99</span>
    </div>
    <div class="hint-row">
      <span>PIN</span><span class="hint-chip">0000</span>
      <span>OTP</span><span class="hint-chip">123456</span>
    </div>
  </div>

  <button class="btn btn-pay" id="btn-pay">Pay ${amountFmt}</button>
  <button class="btn btn-fail" id="btn-fail">Simulate Failed Payment</button>
  <div class="status-msg" id="status"></div>
</div>

<p class="footer">
  <svg class="lock-icon" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="6" width="10" height="8" rx="1.5" fill="#ADB5BD"/>
    <path d="M3.5 6V4a2.5 2.5 0 0 1 5 0v2" stroke="#ADB5BD" stroke-width="1.5" fill="none"/>
  </svg>
  Secured by Paystack · 256-bit SSL
</p>

<script nonce="${nonce}">
  var PAY_URL  = ${JSON.stringify(verifyUrl)};
  var FAIL_URL = ${JSON.stringify(failUrl)};
  var status   = document.getElementById('status');
  var btnPay   = document.getElementById('btn-pay');
  var btnFail  = document.getElementById('btn-fail');

  function disableAll(msg) {
    status.textContent = msg;
    btnPay.disabled    = true;
    btnFail.disabled   = true;
  }

  btnPay.addEventListener('click', function () {
    disableAll('Processing payment…');
    setTimeout(function () { window.location.href = PAY_URL; }, 1200);
  });

  btnFail.addEventListener('click', function () {
    disableAll('Simulating declined payment…');
    setTimeout(function () { window.location.href = FAIL_URL; }, 1200);
  });
<\/script>
</body>
</html>`;

  res.setHeader(
    'Content-Security-Policy',
    `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'`
  );
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});
