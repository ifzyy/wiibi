/**
 * src/utils/api.js
 *
 * FIXES APPLIED:
 *  1. Guest token is now only sent when the user is NOT logged in.
 *     Previously it was always attached, meaning after login the old guest
 *     token header was still being sent, causing cartController to resolve
 *     the guest cart instead of the user's cart.
 *
 *  2. shouldRefresh only triggers on TOKEN_EXPIRED, not NO_TOKEN.
 *     NO_TOKEN = guest or fully logged out — no point attempting refresh.
 *
 *  3. guestToken is never cleared on auth failure. It is only cleared in
 *     AuthContext after a successful login + cart merge.
 */

import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL:         API_BASE,
  withCredentials: true,
});

// ── Request interceptor ───────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const guestToken = localStorage.getItem('guestToken');

  // FIX: only send X-Guest-Token when the user has no active session.
  // We detect "logged in" by the presence of the accessToken cookie.
  // Since httpOnly cookies aren't readable in JS, we use a lightweight
  // flag in localStorage that AuthContext sets/clears on login/logout.
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

    // Refresh when the token expired, OR when no token arrived but this
    // browser had a session (isLoggedIn flag) — e.g. the access cookie was
    // cleared while the 7-day refresh cookie is still valid. Plain guests
    // (no flag) never trigger a refresh.
    //
    // NOTE: the parentheses are load-bearing. Without them, && binds tighter
    // than ||, letting TOKEN_EXPIRED bypass the _retry guard — refresh loops.
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
      // Do NOT touch guestToken here. Auth refresh failure has nothing to do
      // with the guest cart. Clearing it here would destroy active guest sessions.
      localStorage.removeItem('isLoggedIn');
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;