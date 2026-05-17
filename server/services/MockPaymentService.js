/**
 * services/MockPaymentService.js
 *
 * Mirrors the real Paystack API contract exactly.
 *
 * CRITICAL CHANGE from previous version:
 *  initializePayment() now ACCEPTS a `reference` parameter instead of generating one.
 *  The reference is generated at order creation in OrderService and passed through here.
 *  This is how real Paystack works — you pass your own reference and Paystack tracks it.
 *
 * TO GO LIVE: swap the import in paymentController.js:
 *   './MockPaymentService.js'  →  './PaystackService.js'
 *
 * PaystackService.js must export the same function signatures:
 *   initializePayment({ email, amount, orderId, orderNumber, currency, reference, callbackUrl })
 *   verifyPayment(reference)
 *   initiateRefund({ reference, amount, merchantNote })
 *   verifyWebhookSignature(rawBody, signature)
 *
 * ENV VARS:
 *   MOCK_PAYMENT_FAIL_RATE=0.2    → 20% of payments will fail (for testing)
 *   MOCK_WEBHOOK_DELAY_MS=2000    → ms before simulated webhook fires (default 2s)
 *   MOCK_WEBHOOK_SECRET=xxx       → secret used to sign webhook payloads
 */

import crypto from 'crypto';

const FAIL_RATE        = parseFloat(process.env.MOCK_PAYMENT_FAIL_RATE ?? '0');
const WEBHOOK_DELAY_MS = parseInt(process.env.MOCK_WEBHOOK_DELAY_MS    ?? '2000');

export const WEBHOOK_SECRET = process.env.MOCK_WEBHOOK_SECRET ?? 'mock_webhook_secret_dev';

/* ── In-memory transaction store ─────────────────────────────────────────── */
// In production Paystack maintains this — we replicate it in memory for tests.
const txStore = new Map();

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Initialize a payment.
 * Real Paystack: POST https://api.paystack.co/transaction/initialize
 *
 * KEY DIFFERENCE from old version:
 *   We accept `reference` from the caller (OrderService generated it).
 *   Real Paystack accepts a `reference` field in the request body and uses it
 *   as the stable identifier — which is what lets webhooks find the right order.
 *
 * @param {{
 *   email:       string,
 *   amount:      number,   — in kobo (NGN × 100)
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
  reference,           // REQUIRED — passed from OrderService, not generated here
  callbackUrl,
}) => {
  if (!reference) {
    throw new Error('[MockPaymentService] reference is required — generate it in OrderService');
  }

  const access_code = `ac_${Date.now().toString(36).toUpperCase()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  txStore.set(reference, {
    reference,
    orderId,
    orderNumber,
    email,
    amount,
    currency,
    status:      'pending',
    initiatedAt: new Date().toISOString(),
  });

  // authorization_url points to the mock checkout page
  const baseUrl           = callbackUrl?.replace(/\/verify.*$/, '');
  const authorization_url = `${baseUrl}/mock-gateway?orderId=${orderId}&reference=${reference}`;

  return { reference, authorization_url, access_code };
};

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Verify a payment.
 * Real Paystack: GET https://api.paystack.co/transaction/verify/:reference
 *
 * Returns the same shape as Paystack's real verify endpoint.
 */
export const verifyPayment = async (reference) => {
  const tx = txStore.get(reference);

  if (!tx) {
    return { status: false, message: 'Transaction reference not found', data: null };
  }

  // Apply configured fail rate — simulates real-world card declines
  const failed   = Math.random() < FAIL_RATE;
  const txStatus = failed ? 'failed' : 'success';
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
      paid_at:    failed ? null : new Date().toISOString(),
      created_at: tx.initiatedAt,
      channel:    'card',
      fees:       Math.round(tx.amount * 0.015),
      gateway_response: failed ? 'Declined' : 'Approved',
      customer:   { email: tx.email },
      metadata:   { orderId: tx.orderId, orderNumber: tx.orderNumber },
      authorization: {
        authorization_code: `AUTH_mock_${crypto.randomBytes(6).toString('hex')}`,
        card_type:  'visa',
        last4:      '4081',
        exp_month:  '12',
        exp_year:   '2027',
        bank:       'TEST BANK',
        channel:    'card',
        reusable:   true,
      },
    },
  };
};

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Initiate a refund.
 * Real Paystack: POST https://api.paystack.co/refund
 *
 * @param {{
 *   reference:    string,   — original payment reference
 *   amount?:      number,   — in kobo; omit for full refund
 *   merchantNote: string,
 * }} opts
 */
export const initiateRefund = async ({ reference, amount, merchantNote }) => {
  const tx = txStore.get(reference);

  if (!tx) {
    // Don't throw — return a structured failure the caller can handle gracefully
    return {
      status:  false,
      message: 'Transaction not found',
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

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Build and sign a webhook payload identical to what Paystack sends.
 * Used internally by simulateWebhook().
 */
export const buildWebhookPayload = (event, reference) => {
  const tx = txStore.get(reference) ?? { reference, amount: 0, currency: 'NGN' };

  const body = JSON.stringify({
    event,
    data: {
      reference,
      amount:           tx.amount,
      currency:         tx.currency,
      status:           event === 'charge.success' ? 'success'
                      : event === 'charge.failed'  ? 'failed'
                      : 'processed',
      gateway_response: event === 'charge.success' ? 'Approved' : 'Declined',
      customer:         { email: tx.email },
      metadata:         { orderId: tx.orderId, orderNumber: tx.orderNumber },
      paid_at:          event === 'charge.success' ? new Date().toISOString() : null,
    },
  });

  const signature = crypto.createHmac('sha512', WEBHOOK_SECRET).update(body).digest('hex');
  return { body, signature };
};

/**
 * Simulate Paystack calling your webhook (dev only).
 * Fires automatically after initializePayment() with a configurable delay.
 */
export const simulateWebhook = (outcome, reference, webhookUrl) => {
  setTimeout(async () => {
    const event = outcome === 'success' ? 'charge.success' : 'charge.failed';
    const { body, signature } = buildWebhookPayload(event, reference);
    try {
      await fetch(webhookUrl, {
        method:  'POST',
        headers: {
          'Content-Type':          'application/json',
          'x-paystack-signature':  signature,
        },
        body,
      });
    } catch (err) {
      console.warn('[MockPayment] Webhook delivery failed:', err.message);
    }
  }, WEBHOOK_DELAY_MS);
};

/**
 * Verify the HMAC-SHA512 signature on an incoming webhook.
 *
 * @param {string} rawBody    — raw request body string (NOT JSON.parsed)
 * @param {string} signature  — req.headers['x-paystack-signature']
 */
export const verifyWebhookSignature = (rawBody, signature) => {
  const expected = crypto
    .createHmac('sha512', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return expected === signature;
};