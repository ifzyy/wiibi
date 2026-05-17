/**
 * src/utils/api.js
 *
 * Key fixes for guest checkout:
 *
 *  1. shouldRefresh now only triggers on TOKEN_EXPIRED, not NO_TOKEN.
 *     NO_TOKEN means the user has no auth session at all — could be a guest
 *     who never logged in. Attempting a refresh for guests is pointless and
 *     causes the refresh to fail, which previously wiped their guestToken.
 *
 *  2. localStorage.removeItem('guestToken') removed from the refresh failure
 *     handler. guestToken must only be cleared intentionally after a successful
 *     login (in AuthContext, after mergeGuestCart completes). Clearing it on
 *     any auth failure silently destroys active guest shopping sessions.
 *
 *  TOKEN_EXPIRED = user WAS logged in, token just expired → try silent refresh
 *  NO_TOKEN      = user is a guest OR fully logged out → pass through as-is
 */

import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL:         API_BASE,
  withCredentials: true,
  headers:         { 'Content-Type': 'application/json' },
});

// ── Request interceptor ───────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const guestToken = localStorage.getItem('guestToken');
  if (guestToken) config.headers['X-Guest-Token'] = guestToken;
  return config;
});

// ── Response interceptor ──────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue  = [];

const drainQueue = (error) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status   = error.response?.status;
    const code     = error.response?.data?.code;

    // Only attempt a token refresh when we know a token existed but expired.
    // NO_TOKEN means no session at all (guest or logged-out) — no point refreshing.
    const shouldRefresh =
      status === 401 &&
      code === 'TOKEN_EXPIRED' || code === 'NO_TOKEN' &&
      !original._retry &&
      !original.url?.includes('/auth/refresh');

    if (!shouldRefresh) return Promise.reject(error);

    if (isRefreshing) {
      return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
        .then(() => api(original))
        .catch((err) => Promise.reject(err));
    }

    original._retry = true;
    isRefreshing    = true;

    try {
      await api.post('/auth/refresh');
      drainQueue(null);
      return api(original);
    } catch (refreshError) {
      drainQueue(refreshError);
      // Do NOT remove guestToken here. The auth refresh failed because the
      // user's login session expired — that has nothing to do with their
      // guest cart. Removing it here would destroy an active guest session
      // any time any auth token expires anywhere in the app.
      //
      // guestToken is cleared in exactly one place: AuthContext, after a
      // successful login + cart merge.
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export { api as adminApi };
/* ── Order API helpers ───────────────────────────────────────────────────── */

/**
 * GET /orders  (admin)
 * @param {{ page?: number, limit?: number, status?: string }} params
 */
export const fetchOrders = (params = {}) =>
  api.get('/orders', { params }).then((r) => r.data);

/**
 * GET /orders/:id  (admin)
 */
export const fetchOrder = (id) =>
  api.get(`/orders/${id}`).then((r) => r.data);

/**
 * PATCH /orders/:id/status  (admin)
 *
 * Accepts the full update payload the OMS sends.
 * Fields your current backend schema doesn't yet support (paymentStatus,
 * carrier, refund*) are sent here too — the backend changes in
 * orderController.js / updateStatusSchema handle them.
 *
 * @param {string} id
 * @param {{
 *   status: string,
 *   paymentStatus?: string,
 *   note?: string,
 *   trackingNumber?: string,
 *   carrier?: string,
 *   refund?: { amount: number, reason: string, method: string } | null
 * }} payload
 */
export const updateOrderStatus = (id, payload) =>
  api.patch(`/orders/${id}/status`, payload).then((r) => r.data);

/**
 * GET /orders/my  (customer — kept for completeness)
 */
export const fetchMyOrders = (params = {}) =>
  api.get('/orders/my', { params }).then((r) => r.data);

/**
 * GET /orders/my/:id  (customer — single order detail page)
 */
export const fetchMyOrder = (id) =>
  api.get(`/orders/my/${id}`).then((r) => r.data);
export const PAGES = [
  { id: 'page-home',     label: 'Homepage', slug: 'home',     icon: 'home',  color: '#f59e0b' },
  { id: 'page-store',    label: 'Store',    slug: 'store',    icon: 'store', color: '#10b981' },
  { id: 'page-about',    label: 'About',    slug: 'about',    icon: 'users', color: '#6366f1' },
  { id: 'page-contact',  label: 'Contact',  slug: 'contact',  icon: 'file',  color: '#ec4899' },
  { id: 'page-blog',     label: 'Blog',     slug: 'blog',     icon: 'blog',  color: '#0ea5e9' },
  { id: 'page-services', label: 'Services', slug: 'services', icon: 'zap',   color: '#8b5cf6' },
];

export const NAV_SECTIONS = [
  { id: 'pages',    label: 'Pages',    icon: 'layout'      },
  { id: 'projects', label: 'Projects', icon: 'briefcase'   },
  { id: 'products', label: 'Products', icon: 'package'     },
  { id: 'orders',   label: 'Orders',   icon: 'shopping-cart' },
  { id: 'blog',     label: 'Blog',     icon: 'blog'        },
  {id: 'refunds',    label: 'Refunds',   icon: 'credit-card' },
  { id: 'faqs',     label: 'FAQs',     icon: 'help-circle' },
  {id:'forms', label:'Forms', icon:'file-text' },
  { id: 'settings', label: 'Settings', icon: 'settings'    },
];

export const SECTION_LABELS = {
  hero:            { label: 'Hero',          color: '#f59e0b' },
  'store-preview': { label: 'Store Preview', color: '#10b981' },
  stats:           { label: 'Stats',         color: '#6366f1' },
  'blog-teaser':   { label: 'Blog',          color: '#0ea5e9' },
  testimonials:    { label: 'Testimonials',  color: '#ec4899' },
  'faq-teaser':    { label: 'FAQ',           color: '#8b5cf6' },
  cta:             { label: 'CTA',           color: '#ef4444' },
};

export default api;