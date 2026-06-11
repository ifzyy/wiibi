/**
 * src/utils/solarLead.js
 *
 * Solar lead capture — POST /api/solar/leads (origins: request_quote | add_to_cart).
 *
 * Two producers:
 *  1. CalculatorModal — "Request a quote" form  → submitSolarLead(origin request_quote)
 *  2. StorePage       — adding a calculator-recommended product to cart
 *                       → recordAddToCartLead() (silent, deduped per calculation)
 *
 * The calculator saves its inputs to sessionStorage (saveCalcContext) right
 * before navigating to /store?recommended=… so the store can attach the full
 * calculation to the add_to_cart lead. Each new calculation resets the
 * dedupe flag, so one lead is recorded per calculation, not per cart click.
 */

import { api } from './api.js';

const CTX_KEY  = 'solarCalcContext';
const SENT_KEY = 'solarCalcLeadSent';

/** Persist calculator inputs for the store page; re-arms add_to_cart capture. */
export const saveCalcContext = (ctx) => {
  try {
    sessionStorage.setItem(CTX_KEY, JSON.stringify(ctx));
    sessionStorage.removeItem(SENT_KEY);
  } catch { /* storage unavailable — lead capture just won't fire */ }
};

export const getCalcContext = () => {
  try {
    return JSON.parse(sessionStorage.getItem(CTX_KEY));
  } catch {
    return null;
  }
};

/**
 * Create a lead. Payload needs the calculator inputs
 * (appliances, location, autonomyHours, batteryType) plus origin and,
 * for request_quote, name + phone. Returns the server response data.
 */
export const submitSolarLead = async (payload) => {
  const res = await api.post('/solar/leads', payload);
  // Guests get a token back so they can retrieve their lead later — keep it
  // only if we don't already have one (it also keys the guest cart).
  if (res.data?.guestToken && !localStorage.getItem('guestToken')) {
    localStorage.setItem('guestToken', res.data.guestToken);
  }
  return res.data;
};

/**
 * Silent add_to_cart lead — fire-and-forget, never throws.
 * No-ops unless a calculator context exists and no lead was sent for it yet.
 */
export const recordAddToCartLead = async () => {
  const ctx = getCalcContext();
  if (!ctx || sessionStorage.getItem(SENT_KEY)) return;

  sessionStorage.setItem(SENT_KEY, '1');           // optimistic dedupe
  try {
    await submitSolarLead({ ...ctx, origin: 'add_to_cart' });
  } catch {
    sessionStorage.removeItem(SENT_KEY);            // retry on the next add
  }
};
