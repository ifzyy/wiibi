/**
 * middleware/optionalAuth.js
 *
 * Use on public routes where you WANT req.user if a valid token is present,
 * but should never block unauthenticated requests.
 *
 * Pattern: try to verify the token, silently ignore errors.
 * If valid → req.user is set. If missing/invalid → req.user stays null.
 *
 * Add this export to your existing middleware/auth.js instead of a separate file
 * if you prefer. The implementation is the same either way.
 *
 * USAGE:
 *   import { optionalAuthenticate } from '../middleware/auth.js';
 *   router.post('/support/tickets', optionalAuthenticate, handler);
 */

import jwt from 'jsonwebtoken';
import db  from '../models/index.js';

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
