/**
 * controllers/oauthController.js
 *
 * POST /auth/oauth/google
 *
 * Body shapes:
 *   { credential: string }                          — id_token from One Tap / button
 *   { credential: string, redirectUri: string }     — auth-code from mobile redirect
 *
 * Detection: auth-codes always start with "4/" — everything else is an id_token.
 */

import asyncHandler    from '../utils/Asynchandler.js';
import { sendSuccess } from '../utils/response.js';
import {
  verifyGoogleIdToken,
  exchangeGoogleCode,
  oauthLogin,
} from '../services/OauthService.js';
import { handlePostAuthCleanup } from './authController.js';

const getIp = (req) =>
  (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

const IS_PROD    = process.env.NODE_ENV === 'production';
const cookieBase = { httpOnly: true, secure: IS_PROD, sameSite: 'strict', path: '/' };

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie('accessToken',  accessToken,  { ...cookieBase, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...cookieBase, maxAge: 7 * 24 * 60 * 60 * 1000 });
};

export const handleGoogleLogin = asyncHandler(async (req, res) => {
  const { credential, redirectUri } = req.body;

  // Auth-codes start with "4/" — everything else is an id_token
  const isAuthCode = credential.startsWith('4/');

  const profile = isAuthCode
    ? await exchangeGoogleCode(credential, redirectUri)  // mobile redirect
    : await verifyGoogleIdToken(credential);             // One Tap or button

  const result = await oauthLogin('google', profile, getIp(req), req.headers['user-agent']);

  setAuthCookies(res, result);
  await handlePostAuthCleanup(result.user.id, req.headers['x-guest-token'] ?? null);

  return sendSuccess(res, { accessToken: result.accessToken, user: result.user }, 'Login successful');
});