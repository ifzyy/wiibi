/**
 * cookieConsent — single source of truth for the visitor's cookie choices.
 *
 * Stored in localStorage so it's available synchronously site-wide (including
 * for guests, before any auth call resolves). For logged-in users the same
 * object is also persisted to their account (PATCH /users/me) so the decision
 * follows them across devices; on login we hydrate localStorage from the
 * server copy.
 *
 * `essential` is always on and not represented here — it cannot be declined.
 */

const STORAGE_KEY = 'wb_cookie_consent';

// Bump when the cookie policy materially changes — older saved consent with a
// lower version can then be treated as "needs to be asked again".
export const CONSENT_VERSION = 1;

// Defaults applied when the visitor hasn't made an explicit choice yet.
export const DEFAULT_CONSENT = {
  analytics:       true,
  marketing:       false,
  personalization: true,
};

const CATEGORIES = Object.keys(DEFAULT_CONSENT);

/** Keep only known boolean categories — guards against malformed/old data. */
const normalize = (raw) => {
  const out = { ...DEFAULT_CONSENT };
  if (raw && typeof raw === 'object') {
    for (const key of CATEGORIES) {
      if (typeof raw[key] === 'boolean') out[key] = raw[key];
    }
  }
  return out;
};

/** Current consent (falls back to defaults). Never throws. */
export const getConsent = () => {
  try {
    return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return { ...DEFAULT_CONSENT };
  }
};

/** True when a category is allowed. e.g. hasConsent('analytics'). */
export const hasConsent = (category) => getConsent()[category] === true;

/**
 * Persist consent locally and notify listeners (same-tab via a custom event;
 * other tabs get the native 'storage' event for free).
 * Returns the normalized object actually written.
 */
export const setConsent = (consent) => {
  const next = normalize(consent);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, version: CONSENT_VERSION }));
    window.dispatchEvent(new CustomEvent('cookieconsent:change', { detail: next }));
  } catch {
    /* storage unavailable (private mode) — in-memory default still applies */
  }
  return next;
};

/**
 * Mirror a logged-in user's saved consent into localStorage so site-wide
 * gating reflects their account choice. No-op when the user has no saved
 * decision yet (keeps the local/default value).
 */
export const hydrateConsent = (serverConsent) => {
  if (serverConsent && typeof serverConsent === 'object') {
    setConsent(serverConsent);
  }
};
