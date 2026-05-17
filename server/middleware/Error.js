import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';

const isProd = process.env.NODE_ENV === 'production';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  // Log with clean structured fields — Logger.js formats these nicely in dev
  logger.error({
    message:    err.message,
    code:       err.code       || null,
    statusCode,
    method:     req.method,
    path:       req.path,
    ip:         req.ip,
    stack:      err.stack,
  });

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    return res.status(422).json({
      success: false,
      message: 'Validation error',
      errors:  err.errors.map((e) => ({ field: e.path, message: e.message })),
    });
  }

  // Sequelize unique constraint
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists',
      field:   err.errors?.[0]?.path,
    });
  }

  // Known operational errors (AppError subclasses)
  if (err instanceof AppError && err.isOperational) {
    return res.status(statusCode).json({
      success: false,
      message: err.message,
      ...(err.code ? { code: err.code } : {}),
    });
  }

  // Unknown / unexpected errors — never leak internals in production
  return res.status(500).json({
    success: false,
    message: isProd ? 'Internal server error' : err.message,
  });
};

export const notFound = (req, res) =>
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.path}`,
  });