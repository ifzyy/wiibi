import jwt from 'jsonwebtoken';
import { AuthError } from './AppError.js';

// ── Use your existing JWT_SECRET for the access token so the current
//    authenticate middleware keeps working without any changes.
//    The refresh token gets its own secret for extra security.
const ACCESS_SECRET  = process.env.JWT_SECRET         || 'dev_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret';

export const signAccessToken = (payload) =>
  jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });

export const signRefreshToken = (payload) =>
  jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch {
    throw new AuthError('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch {
    throw new AuthError('Invalid or expired refresh token');
  }
};