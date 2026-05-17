import Joi from 'joi';
import { ValidationError } from '../utils/AppError.js';

const phoneSchema = Joi.string()
  .pattern(/^\+?[1-9]\d{7,14}$/)
  .messages({ 'string.pattern.base': 'Phone must be international format e.g. +2348012345678' });

const emailSchema = Joi.string()
  .email({ tlds: { allow: false } })
  .max(255)
  .messages({
    'string.email': 'Email must be valid',
    'string.max':   'Email is too long',
  });

const passwordSchema = Joi.string()
  .min(8).max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .messages({
    'string.min':          'Password must be at least 8 characters',
    'string.pattern.base': 'Password needs uppercase, lowercase, and a number',
  });

const identifierSchema = Joi.object({
  phoneNumber: phoneSchema,
  email:       emailSchema,
}).or('phoneNumber', 'email').messages({
  'object.missing': 'Phone number or email is required',
});

export const schemas = {
  requestOtp:     identifierSchema,
  verifyOtp:      identifierSchema.keys({
    otp: Joi.string().length(6).pattern(/^\d+$/).required()
      .messages({ 'string.length': 'OTP must be 6 digits', 'string.pattern.base': 'OTP must be digits only' }),
  }),
  loginPassword:  Joi.object({ phoneNumber: phoneSchema.required(), password: Joi.string().required() }),
  setPassword:    Joi.object({
    newPassword:     passwordSchema.required(),
    currentPassword: Joi.string().allow('', null),
  }),
  removePassword: Joi.object({ currentPassword: Joi.string().required() }),
};

/**
 * Middleware factory: validate(schemas.requestOtp)
 */
export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body);
  if (error) return next(new ValidationError(error.details[0].message));
  req.body = value;
  next();
};