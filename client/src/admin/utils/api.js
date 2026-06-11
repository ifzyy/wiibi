/**
 * src/utils/api.js
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
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  if (guestToken && !isLoggedIn) {
    config.headers['X-Guest-Token'] = guestToken;
  }
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

    // Refresh on expiry, or on NO_TOKEN when this browser had a session —
    // the access cookie may be gone while the refresh cookie is still valid.
    const hadSession = localStorage.getItem('isLoggedIn') === 'true';
    const shouldRefresh =
      status === 401 &&
      (code === 'TOKEN_EXPIRED' || (code === 'NO_TOKEN' && hadSession)) &&
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
      localStorage.removeItem('isLoggedIn');
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export { api as adminApi };

/* ── Order API helpers ───────────────────────────────────────────────────── */
export const fetchOrders = (params = {}) =>
  api.get('/orders', { params }).then((r) => r.data);

export const fetchOrder = (id) =>
  api.get(`/orders/${id}`).then((r) => r.data);

export const updateOrderStatus = (id, payload) =>
  api.patch(`/orders/${id}/status`, payload).then((r) => r.data);

export const fetchMyOrders = (params = {}) =>
  api.get('/orders/my', { params }).then((r) => r.data);

export const fetchMyOrder = (id) =>
  api.get(`/orders/my/${id}`).then((r) => r.data);

/* ── Page / nav constants ────────────────────────────────────────────────── */
export const PAGES = [
  { id: 'page-home',     label: 'Homepage', slug: 'home',     icon: 'home',  color: '#f59e0b' },
  { id: 'page-store',    label: 'Store',    slug: 'store',    icon: 'store', color: '#10b981' },
  { id: 'page-about',    label: 'About',    slug: 'about',    icon: 'users', color: '#6366f1' },
  { id: 'page-contact',  label: 'Contact',  slug: 'contact',  icon: 'file',  color: '#ec4899' },
  { id: 'page-blog',     label: 'Blog',     slug: 'blog',     icon: 'blog',  color: '#0ea5e9' },
  { id: 'page-services', label: 'Services', slug: 'services', icon: 'zap',   color: '#8b5cf6' },
];

export const NAV_SECTIONS = [
  { id: 'pages',     label: 'Pages',     icon: 'layout'        },
  { id: 'projects',  label: 'Projects',  icon: 'briefcase'     },
  { id: 'products',  label: 'Products',  icon: 'package'       },
  { id: 'orders',    label: 'Orders',    icon: 'shopping-cart' },
  { id: 'analytics', label: 'Analytics', icon: 'bar-chart'     },
  { id: 'customers', label: 'Customers', icon: 'users'         },
  { id: 'payments',  label: 'Payments',  icon: 'credit-card'   },
  { id: 'support',   label: 'Support',   icon: 'help-circle'   },
  { id: 'blog',      label: 'Blog',      icon: 'blog'          },
  { id: 'refunds',   label: 'Refunds',   icon: 'credit-card'   },
  { id: 'faqs',      label: 'FAQs',      icon: 'help-circle'   },
  { id: 'forms',     label: 'Forms',     icon: 'file-text'     },
  { id: 'settings',  label: 'Settings',  icon: 'settings'      },
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