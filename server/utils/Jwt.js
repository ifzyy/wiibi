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

// Algorithm is pinned everywhere we sign/verify. Passing an explicit allow-list
// to jwt.verify is what blocks `alg:none` and algorithm-confusion attacks — a
// token is only accepted if it was signed with exactly this symmetric algo.
export const JWT_ALG = 'HS256';

if (process.env.NODE_ENV === 'production') {
  if (!ACCESS_SECRET || !REFRESH_SECRET) {
    throw new Error('[Jwt] JWT_SECRET and JWT_REFRESH_SECRET must be set in production');
  }
  if (ACCESS_SECRET === REFRESH_SECRET) {
    throw new Error('[Jwt] JWT_SECRET and JWT_REFRESH_SECRET must be different values');
  }
  // A short secret is brute-forceable offline; require ≥32 chars (256 bits).
  if (ACCESS_SECRET.length < 32 || REFRESH_SECRET.length < 32) {
    throw new Error('[Jwt] JWT_SECRET and JWT_REFRESH_SECRET must each be at least 32 characters');
  }
}

// Dev-only fallbacks. In production the guard above guarantees the env vars exist.
const ACCESS  = ACCESS_SECRET  || 'dev_secret';
const REFRESH = REFRESH_SECRET || 'dev_refresh_secret';

export const signAccessToken = (payload) =>
  jwt.sign(payload, ACCESS, {
    algorithm: JWT_ALG,
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });

export const signRefreshToken = (payload) =>
  jwt.sign(payload, REFRESH, {
    algorithm: JWT_ALG,
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, ACCESS, { algorithms: [JWT_ALG] });
  } catch {
    throw new AuthError('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH, { algorithms: [JWT_ALG] });
  } catch {
    throw new AuthError('Invalid or expired refresh token');
  }
};
