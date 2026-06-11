/**
 * services/paymentProvider.js
 *
 * Selects the active payment provider based on environment.
 * Both providers export the same interface:
 *   initializePayment(opts)
 *   verifyPayment(reference)
 *   initiateRefund(opts)
 *   verifyWebhookSignature(rawBody, signature)
 *   simulateWebhook(reference, webhookUrl, delay?)   — no-op in production
 *   markFailed(reference)                            — no-op in production
 *
 * To switch to Paystack: set PAYMENT_PROVIDER=paystack in .env
 * NODE_ENV=production also forces Paystack regardless of PAYMENT_PROVIDER.
 */

const usePaystack =
  process.env.NODE_ENV === 'production' ||
  process.env.PAYMENT_PROVIDER === 'paystack';

let provider;

if (usePaystack) {
  provider = await import('./PaystackService.js');
} else {
  provider = await import('./MockPaymentService.js');
}

export const initializePayment      = provider.initializePayment;
export const verifyPayment          = provider.verifyPayment;
export const initiateRefund         = provider.initiateRefund;
export const verifyWebhookSignature = provider.verifyWebhookSignature;
export const simulateWebhook        = provider.simulateWebhook ?? (() => {});
export const markFailed             = provider.markFailed      ?? (() => {});

export const PROVIDER_NAME = usePaystack ? 'paystack' : 'mock';
