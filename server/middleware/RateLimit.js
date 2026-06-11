import { rateLimit } from 'express-rate-limit';

const jsonHandler = (message) => (req, res) =>
  res.status(429).json({ success: false, message });

export const globalRateLimit = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  handler:         jsonHandler('Too many requests, please try again later'),
  standardHeaders: true,
  legacyHeaders:   false,
});

export const otpRateLimit = rateLimit({
  windowMs:        10 * 60 * 1000,
  max:             5,
  keyGenerator:    (req) => req.ip + ':' + (req.body?.phoneNumber || 'unknown'),
  handler:         jsonHandler('Too many OTP requests. Please wait before trying again.'),
  standardHeaders: true,
  legacyHeaders:   false,
});

export const refreshRateLimit = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             20,
  handler:         jsonHandler('Too many token refresh attempts'),
  standardHeaders: true,
  legacyHeaders:   false,
});

export const passwordRateLimit = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  handler:         jsonHandler('Too many password attempts. Please try again later.'),
  standardHeaders: true,
  legacyHeaders:   false,
});

// Stricter limiter for money-moving endpoints (initialize / verify). Prevents
// brute-forcing references or hammering the gateway. NOT applied to /webhook —
// that is provider-driven and signature-verified.
export const paymentRateLimit = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             parseInt(process.env.PAYMENT_RATE_LIMIT_MAX || '30', 10),
  handler:         jsonHandler('Too many payment attempts. Please wait and try again.'),
  standardHeaders: true,
  legacyHeaders:   false,
});