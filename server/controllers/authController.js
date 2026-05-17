/**
 * controllers/authController.js
 *
 * FIXES APPLIED:
 *  1. handleVerifyOtp + handleLoginPassword: was referencing undefined `user.id`
 *     — now correctly uses `result.user.id`
 *  2. claimGuestOrders imported from OrderService (was missing entirely)
 *  3. Removed dead mergeCartIfGuest helper (replaced by handlePostAuthCleanup)
 *  4. handlePostAuthCleanup now exported and used consistently in both login paths
 */

import asyncHandler    from '../utils/Asynchandler.js';
import { sendSuccess } from '../utils/response.js';
import { ValidationError } from '../utils/AppError.js';
import {
  requestOtp,
  loginWithOtp,
  loginWithPassword,
  setPassword,
  removePassword,
  refreshAccessToken,
  logout,
  logoutAll,
} from '../services/AuthService.js';
import { mergeGuestCart }   from '../services/Cart.services.js';
import { claimGuestOrders } from '../services/OrderService.js';  // FIX #2: was missing

const getIp = (req) =>
  (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

// ── Cookie configs ────────────────────────────────────────────────────────────
const IS_PROD = process.env.NODE_ENV === 'production';

const REFRESH_COOKIE = {
  httpOnly: true,
  secure:   IS_PROD,
  sameSite: 'strict',
  maxAge:   7 * 24 * 60 * 60 * 1000,
  path:     '/',
};

const ACCESS_COOKIE = {
  httpOnly: true,
  secure:   IS_PROD,
  sameSite: 'strict',
  maxAge:   15 * 60 * 1000,
  path:     '/',
};

// ── Helper: set both auth cookies ────────────────────────────────────────────
const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie('accessToken',  accessToken,  ACCESS_COOKIE);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE);
};

// ── Post-auth cleanup: merge guest cart + claim guest orders ─────────────────
// Exported so it can be tested independently.
// Uses Promise.allSettled so one failure never blocks the other.
// Both are non-fatal — a failure here must not break login.
export const handlePostAuthCleanup = async (userId, guestToken) => {
  if (!guestToken || !userId) return;

  const results = await Promise.allSettled([
    claimGuestOrders(guestToken, userId),
    mergeGuestCart(guestToken, userId),
  ]);

  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      const label = i === 0 ? 'claimGuestOrders' : 'mergeGuestCart';
      console.error(`[PostAuthCleanup] ${label} failed (non-fatal):`, r.reason?.message);
    }
  });
};

// ── OTP ───────────────────────────────────────────────────────────────────────

export const handleRequestOtp = asyncHandler(async (req, res) => {
  const result = await requestOtp(
    { email: req.body.email, phoneNumber: req.body.phoneNumber },
    getIp(req), req.headers['user-agent']
  );
  return sendSuccess(res, { expiresAt: result.expiresAt }, 'OTP sent successfully');
});

export const handleVerifyOtp = asyncHandler(async (req, res) => {
  const result = await loginWithOtp(
    { email: req.body.email, phoneNumber: req.body.phoneNumber },
    req.body.otp, getIp(req), req.headers['user-agent']
  );

  setAuthCookies(res, result);

  // FIX #1: was `user.id` (undefined) — result.user is the correct reference
  const guestToken = req.headers['x-guest-token'] ?? null;
  await handlePostAuthCleanup(result.user.id, guestToken);

  return sendSuccess(
    res,
    { accessToken: result.accessToken, user: result.user },
    'Login successful'
  );
});

// ── Password login ────────────────────────────────────────────────────────────

export const handleLoginPassword = asyncHandler(async (req, res) => {
  const result = await loginWithPassword(
    req.body.phoneNumber, req.body.password, getIp(req), req.headers['user-agent']
  );

  setAuthCookies(res, result);

  // FIX #1: same fix — was `user.id` (undefined)
  const guestToken = req.headers['x-guest-token'] ?? null;
  await handlePostAuthCleanup(result.user.id, guestToken);

  return sendSuccess(
    res,
    { accessToken: result.accessToken, user: result.user },
    'Login successful'
  );
});

// ── Password management ───────────────────────────────────────────────────────

export const handleSetPassword = asyncHandler(async (req, res) => {
  const result = await setPassword(
    req.user.id, req.body.newPassword, req.body.currentPassword
  );
  return sendSuccess(res, null, result.message);
});

export const handleRemovePassword = asyncHandler(async (req, res) => {
  const result = await removePassword(req.user.id, req.body.currentPassword);
  return sendSuccess(res, null, result.message);
});

// ── Token refresh ─────────────────────────────────────────────────────────────

export const handleRefreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) throw new ValidationError('Refresh token is required');

  const result = await refreshAccessToken(token, getIp(req));

  setAuthCookies(res, result);

  return sendSuccess(res, { accessToken: result.accessToken }, 'Token refreshed');
});

// ── Logout ────────────────────────────────────────────────────────────────────

export const handleLogout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (token) await logout(token);

  res.clearCookie('accessToken',  { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });

  return sendSuccess(res, null, 'Logged out successfully');
});

export const handleLogoutAll = asyncHandler(async (req, res) => {
  await logoutAll(req.user.id);

  res.clearCookie('accessToken',  { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });

  return sendSuccess(res, null, 'Logged out from all devices');
});