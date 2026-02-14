import jwt from 'jsonwebtoken';
import db from '../models/index.js';

const User = db.User
/**
 * Authenticate middleware
 * Verifies JWT from Authorization header and attaches user to req.user
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const authenticate = async (req, res, next) => {
  try {
    // 1. Extract token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Fetch user (exclude password)
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    // 4. Attach user to request
    req.user = user;

    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }

    return res.status(401).json({ message: 'Unauthorized' });
  }
};

/**
 * Admin guard middleware
 * Must be used AFTER authenticate
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Access denied – admin privileges required',
    });
  }

  next();
};