/**
 * services/MockPaymentService.js
 *
 * Mirrors the real Paystack API contract exactly.
 *
 * KEY DESIGN:
 *  - Outcome (success/failed) is pre-determined at initializePayment() time.
 *  - Both verifyPayment() and simulateWebhook() read from the same stored outcome.
 *  - This prevents the race condition where verify and webhook could disagree.
 *  - markFailed(reference) lets the mock-fail endpoint override the outcome
 *    before the auto-webhook fires.
 *
 * Webhook simulation flow:
 *  - Auto-webhook fires MOCK_WEBHOOK_DELAY_MS after initializePayment() —
 *    tests the webhook-first production path (webhook arrives before browser redirect).
 *  - handleVerify also fires a second webhook after success/failure —
 *    tests idempotent duplicate delivery.
 *  - handleMockFail fires a failure webhook immediately when user clicks
 *    "Simulate Failed Payment" on the mock gateway, overriding any pending auto-webhook.
 *
 * TO GO LIVE:
 *  Change the import in paymentProvider.js from MockPaymentService → PaystackService.
 *  Nothing else changes.
 *
 * ENV VARS:
 *   MOCK_PAYMENT_FAIL_RATE=0.2    → 20 % of auto-webhooks will fail
 *   MOCK_WEBHOOK_DELAY_MS=45000   → delay before auto-webhook fires (default 45 s)
 *   MOCK_WEBHOOK_SECRET=xxx       → HMAC key for signing webhook payloads
 */

import crypto from 'crypto';

const FAIL_RATE        = parseFloat(process.env.MOCK_PAYMENT_FAIL_RATE ?? '0');
// The auto-webhook delay must be long enough for a HUMAN to click "Pay" or
// "Simulate Failed Payment" on the mock gateway first. At the old 2s default
// the success webhook always won the race — the order was paid before the
// user could simulate a failure, and mock-fail became a no-op. 45s still
// exercises the webhook-first path when the gateway page is abandoned.
const WEBHOOK_DELAY_MS = parseInt(process.env.MOCK_WEBHOOK_DELAY_MS    ?? '45000');

export const WEBHOOK_SECRET = process.env.MOCK_WEBHOOK_SECRET ?? 'mock_webhook_secret_dev';

/* ── In-memory transaction store ─────────────────────────────────────────── */

const txStore = new Map();

/* ── initializePayment ───────────────────────────────────────────────────── */

/**
 * Stores the payment and pre-determines the outcome.
 * Real Paystack: POST https://api.paystack.co/transaction/initialize
 *
 * @param {{
 *   email:       string,
 *   amount:      number,   — kobo (NGN × 100)
 *   orderId:     string,
 *   orderNumber: string,
 *   currency:    string,
 *   reference:   string,   — PAY-xxx generated at order creation
 *   callbackUrl: string,
 * }} opts
 */
export const initializePayment = async ({
  email,
  amount,
  orderId,
  orderNumber,
  currency    = 'NGN',
  reference,
  callbackUrl,
}) => {
  if (!reference) {
    throw new Error('[MockPaymentService] reference is required — generate it in OrderService');
  }

  // Pre-determine outcome so verify and webhook always agree
  const outcome     = Math.random() < FAIL_RATE ? 'failed' : 'success';
  const access_code = `ac_${Date.now().toString(36).toUpperCase()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  txStore.set(reference, {
    reference,
    orderId,
    orderNumber,
    email,
    amount,
    currency,
    status:      'pending',
    _outcome:    outcome,   // pre-determined; read by verifyPayment + buildWebhookPayload
    initiatedAt: new Date().toISOString(),
  });

  const baseUrl           = callbackUrl?.replace(/\/verify.*$/, '');
  const authorization_url = `${baseUrl}/mock-gateway?orderId=${orderId}&reference=${reference}`;

  return { reference, authorization_url, access_code };
};

/* ── verifyPayment ───────────────────────────────────────────────────────── */

/**
 * Real Paystack: GET https://api.paystack.co/transaction/verify/:reference
 * Reads the pre-determined outcome — no independent randomisation.
 */
export const verifyPayment = async (reference) => {
  const tx = txStore.get(reference);

  if (!tx) {
    return { status: false, message: 'Transaction reference not found', data: null };
  }

  const txStatus = tx._outcome === 'failed' ? 'failed' : 'success';
  txStore.set(reference, { ...tx, status: txStatus, verifiedAt: new Date().toISOString() });

  return {
    status:  true,
    message: 'Verification successful',
    data: {
      id:         Math.floor(Math.random() * 9_000_000) + 1_000_000,
      reference,
      amount:     tx.amount,
      currency:   tx.currency,
      status:     txStatus,
      paid_at:    txStatus === 'success' ? new Date().toISOString() : null,
      created_at: tx.initiatedAt,
      channel:    'card',
      fees:       Math.round(tx.amount * 0.015),
      gateway_response: txStatus === 'success' ? 'Approved' : 'Declined',
      customer:   { email: tx.email },
      metadata:   { orderId: tx.orderId, orderNumber: tx.orderNumber },
      authorization: {
        authorization_code: `AUTH_mock_${crypto.randomBytes(6).toString('hex')}`,
        card_type: 'visa',
        last4:     '4081',
        exp_month: '12',
        exp_year:  '2027',
        bank:      'TEST BANK',
        channel:   'card',
        reusable:  true,
      },
    },
  };
};

/* ── initiateRefund ──────────────────────────────────────────────────────── */

/**
 * Real Paystack: POST https://api.paystack.co/refund
 * Returns a structured failure instead of throwing when the tx is unknown.
 * Callers must check result.status before trusting result.data.
 */
export const initiateRefund = async ({ reference, amount, merchantNote }) => {
  const tx = txStore.get(reference);

  if (!tx) {
    return {
      status:  false,
      message: 'Transaction not found in mock store — likely a restarted server',
      data:    null,
    };
  }

  const refundReference = `refund_${Date.now().toString(36).toUpperCase()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  return {
    status:  true,
    message: 'Refund has been queued for processing',
    data: {
      transaction_reference: reference,
      refund_reference:      refundReference,
      amount:                amount ?? tx.amount,
      currency:              tx.currency ?? 'NGN',
      merchant_note:         merchantNote ?? 'Refund initiated',
      status:                'pending',
      created_at:            new Date().toISOString(),
    },
  };
};

/* ── markFailed ──────────────────────────────────────────────────────────── */

/**
 * Overrides the pre-determined outcome to 'failed'.
 * Called by handleMockFail when the user explicitly clicks "Simulate Failed Payment"
 * on the mock gateway — ensures the subsequent webhook fires as charge.failed.
 */
export const markFailed = (reference) => {
  const tx = txStore.get(reference);
  if (tx) txStore.set(reference, { ...tx, _outcome: 'failed' });
};

/* ── buildWebhookPayload ─────────────────────────────────────────────────── */

/**
 * Builds and signs a Paystack-shaped webhook payload.
 * Reads outcome from txStore._outcome so it always matches verifyPayment().
 */
export const buildWebhookPayload = (reference) => {
  const tx = txStore.get(reference) ?? { reference, amount: 0, currency: 'NGN', _outcome: 'success' };

  const event = tx._outcome === 'failed' ? 'charge.failed' : 'charge.success';

  const body = JSON.stringify({
    event,
    data: {
      reference,
      amount:           tx.amount,
      currency:         tx.currency,
      status:           tx._outcome === 'failed' ? 'failed' : 'success',
      gateway_response: tx._outcome === 'failed' ? 'Declined' : 'Approved',
      customer:         { email: tx.email },
      metadata:         { orderId: tx.orderId, orderNumber: tx.orderNumber },
      paid_at:          tx._outcome === 'success' ? new Date().toISOString() : null,
    },
  });

  const signature = crypto.createHmac('sha512', WEBHOOK_SECRET).update(body).digest('hex');
  return { body, signature };
};

/* ── simulateWebhook ─────────────────────────────────────────────────────── */

/**
 * Fires a webhook to the given URL after MOCK_WEBHOOK_DELAY_MS.
 * Outcome is read from txStore at fire time (not at call time) so that
 * markFailed() called between now and then is honoured.
 *
 * Called by handleInitialize (auto-webhook, tests webhook-first production path)
 * and by handleVerify / handleMockFail (immediate duplicate, tests idempotency).
 *
 * @param {string} reference
 * @param {string} webhookUrl
 * @param {number} [delay]    — override WEBHOOK_DELAY_MS for immediate delivery
 */
export const simulateWebhook = (reference, webhookUrl, delay = WEBHOOK_DELAY_MS) => {
  setTimeout(async () => {
    const { body, signature } = buildWebhookPayload(reference);
    try {
      await fetch(webhookUrl, {
        method:  'POST',
        headers: {
          'Content-Type':         'application/json',
          'x-paystack-signature': signature,
        },
        body,
      });
    } catch (err) {
      console.warn('[MockPayment] Webhook delivery failed:', err.message);
    }
  }, delay);
};

/* ── verifyWebhookSignature ──────────────────────────────────────────────── */

/**
 * Verifies HMAC-SHA512 signature on an incoming webhook.
 * @param {string} rawBody   — raw request body string (not JSON.parsed)
 * @param {string} signature — req.headers['x-paystack-signature']
 */
export const verifyWebhookSignature = (rawBody, signature) => {
  if (!signature) return false;
  const expected = crypto
    .createHmac('sha512', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  // Constant-time compare — mirrors PaystackService so behaviour matches prod.
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(signature), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
