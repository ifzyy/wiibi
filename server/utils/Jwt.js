import jwt from 'jsonwebtoken';
import { AuthError } from './AppError.js';

// ── Use your existing JWT_SECRET for the access token so the current
//    authenticate middleware keeps working without any changes.
//    The refresh token gets its own secret for extra security.
//
// SECURITY: never ship the hardcoded dev fallbacks to production. If the
// secrets are missing there, anyone could forge tokens (incl. admin) using the
// publicly-known default. Fail fast at boot instead.
const ACCESS_SECRET  = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (process.env.NODE_ENV === 'production') {
  if (!ACCESS_SECRET || !REFRESH_SECRET) {
    throw new Error('[Jwt] JWT_SECRET and JWT_REFRESH_SECRET must be set in production');
  }
  if (ACCESS_SECRET === REFRESH_SECRET) {
    throw new Error('[Jwt] JWT_SECRET and JWT_REFRESH_SECRET must be different values');
  }
}

// Dev-only fallbacks. In production the guard above guarantees the env vars exist.
const ACCESS  = ACCESS_SECRET  || 'dev_secret';
const REFRESH = REFRESH_SECRET || 'dev_refresh_secret';

export const signAccessToken = (payload) =>
  jwt.sign(payload, ACCESS, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });

export const signRefreshToken = (payload) =>
  jwt.sign(payload, REFRESH, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, ACCESS);
  } catch {
    throw new AuthError('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH);
  } catch {
    throw new AuthError('Invalid or expired refresh token');
  }
};
