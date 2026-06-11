/**
 * middleware/authMiddleware.js
 *
 * FIXES IN THIS VERSION:
 *  1. Critical bug: `authHeader` referenced before assignment — was causing
 *     ReferenceError on every request. Fixed by using extractToken() helper.
 *  2. Token read order: httpOnly cookie first, Authorization header fallback.
 *     Cookie = XSS-safe (JS can never read it). Header = kept for admin
 *     dashboard, Postman, and any API integrations without breaking them.
 *  3. optionalAuth fixed to use the same extractToken() — it was still
 *     reading Bearer header only, so cart routes were broken for cookie users.
 *  4. Consistent error codes on every 401/403 so the frontend can act on them
 *     (TOKEN_EXPIRED triggers silent refresh, vs TOKEN_INVALID triggers logout).
 */

import jwt from 'jsonwebtoken';
import db  from '../models/index.js';

const User = db.User;

/**
 * extractToken
 * Cookie-first, then Authorization header.
 * This dual-read is the key to zero breaking changes: old clients sending
 * Bearer tokens keep working; new browser clients use the secure cookie.
 */
const extractToken = (req) => {
  if (req.cookies?.accessToken) return req.cookies.accessToken;
  const h = req.headers.authorization;
  if (h?.startsWith('Bearer ')) return h.slice(7);
  return null;
};

// ── authenticate ─────────────────────────────────────────────────────────────
export const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false, message: 'No token provided', code: 'NO_TOKEN',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(401).json({
        success: false, message: 'User not found', code: 'USER_NOT_FOUND',
      });
    }
    if (!user.isActive) {
      return res.status(403).json({
        success: false, message: 'Account is deactivated', code: 'ACCOUNT_DEACTIVATED',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false, message: 'Token expired', code: 'TOKEN_EXPIRED',
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false, message: 'Invalid token', code: 'TOKEN_INVALID',
      });
    }
    return res.status(401).json({
      success: false, message: 'Unauthorized', code: 'UNAUTHORIZED',
    });
  }
};

export const authMiddleware = authenticate;   // alias — keeps existing imports

// ── optionalAuth ─────────────────────────────────────────────────────────────
export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] },
      });
      if (user?.isActive) req.user = user;
    }
  } catch { /* guest continues */ }
  next();
};

// ── requireAdmin ─────────────────────────────────────────────────────────────
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false, message: 'Admin privileges required', code: 'ADMIN_REQUIRED',
    });
  }
  next();
};

export const optionalAuthenticate = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return next();

    const token   = header.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await db.User.findByPk(payload.id, {
      attributes: ['id', 'role', 'isActive', 'email'],
    });

    if (user?.isActive) req.user = user;
  } catch {
    // Silently ignore — expired or invalid token doesn't block the request
  }
  next();
};
