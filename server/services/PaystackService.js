/**
 * services/PaystackService.js
 *
 * Real Paystack payment provider.
 * Exports the same interface as MockPaymentService.js so paymentProvider.js
 * can swap them transparently.
 *
 * TO ACTIVATE: set PAYMENT_PROVIDER=paystack in your .env (or NODE_ENV=production).
 *
 * REQUIRED ENV VARS:
 *   PAYSTACK_SECRET_KEY      — sk_live_xxx or sk_test_xxx
 *   PAYSTACK_WEBHOOK_SECRET  — from Paystack dashboard → Settings → Webhooks
 *
 * PAYSTACK DOCS:
 *   https://paystack.com/docs/api/transaction/
 *   https://paystack.com/docs/payments/webhooks/
 */

import crypto from 'crypto';

const BASE_URL      = 'https://api.paystack.co';
const SECRET_KEY    = process.env.PAYSTACK_SECRET_KEY;
const WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;

if (!SECRET_KEY && process.env.PAYMENT_PROVIDER === 'paystack') {
  console.warn('[PaystackService] PAYSTACK_SECRET_KEY is not set — API calls will fail');
}

const paystackFetch = async (path, opts = {}) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: {
      'Authorization': `Bearer ${SECRET_KEY}`,
      'Content-Type':  'application/json',
      ...(opts.headers ?? {}),
    },
  });

  const json = await res.json();

  if (!res.ok) {
    const message = json?.message ?? `Paystack API error ${res.status}`;
    throw new Error(message);
  }

  return json;
};

/* ── initializePayment ───────────────────────────────────────────────────── */

/**
 * POST https://api.paystack.co/transaction/initialize
 *
 * @param {{
 *   email:       string,
 *   amount:      number,   — kobo (NGN × 100)
 *   orderId:     string,
 *   orderNumber: string,
 *   currency:    string,
 *   reference:   string,   — PAY-xxx from OrderService
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
  if (!reference) throw new Error('[PaystackService] reference is required');

  const json = await paystackFetch('/transaction/initialize', {
    method: 'POST',
    body:   JSON.stringify({
      email,
      amount,
      currency,
      reference,
      callback_url: callbackUrl,
      metadata: {
        orderId,
        orderNumber,
        custom_fields: [
          { display_name: 'Order Number', variable_name: 'order_number', value: orderNumber },
        ],
      },
    }),
  });

  return {
    reference:         json.data.reference,
    authorization_url: json.data.authorization_url,
    access_code:       json.data.access_code,
  };
};

/* ── verifyPayment ───────────────────────────────────────────────────────── */

/**
 * GET https://api.paystack.co/transaction/verify/:reference
 */
export const verifyPayment = async (reference) => {
  try {
    const json = await paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`);
    return json;
  } catch (err) {
    return { status: false, message: err.message, data: null };
  }
};

/* ── initiateRefund ──────────────────────────────────────────────────────── */

/**
 * POST https://api.paystack.co/refund
 * Callers must check result.status — a false status means the API call failed
 * and the refund should be escalated to manual_required.
 *
 * @param {{
 *   reference:    string,   — original payment reference
 *   amount?:      number,   — kobo; omit for full refund
 *   merchantNote: string,
 * }} opts
 */
export const initiateRefund = async ({ reference, amount, merchantNote }) => {
  try {
    const body = { transaction: reference, merchant_note: merchantNote };
    if (amount) body.amount = amount;

    const json = await paystackFetch('/refund', {
      method: 'POST',
      body:   JSON.stringify(body),
    });

    return json;
  } catch (err) {
    return { status: false, message: err.message, data: null };
  }
};

/* ── verifyWebhookSignature ──────────────────────────────────────────────── */

/**
 * Validates the HMAC-SHA512 signature Paystack sends on every webhook.
 * @param {string} rawBody   — raw request body string (not JSON.parsed)
 * @param {string} signature — req.headers['x-paystack-signature']
 */
export const verifyWebhookSignature = (rawBody, signature) => {
  if (!WEBHOOK_SECRET) {
    console.warn('[PaystackService] PAYSTACK_WEBHOOK_SECRET not set — rejecting all webhooks');
    return false;
  }
  if (!signature) return false;
  const expected = crypto
    .createHmac('sha512', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  // Constant-time compare — a plain === leaks how many leading bytes matched.
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(signature), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

/* ── simulateWebhook (no-op in production) ───────────────────────────────── */

// The real Paystack fires webhooks from their servers — nothing to simulate.
export const simulateWebhook = () => {};
export const markFailed      = () => {};
