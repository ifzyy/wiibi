import { ForbiddenError } from '../utils/AppError.js';

/**
 * Usage: requireRole('admin')  or  requireRole('admin', 'manager')
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user)                    return next(new ForbiddenError('Authentication required'));
  if (!roles.includes(req.user.role)) return next(new ForbiddenError('Insufficient permissions'));
  next();
};

export default requireRole;