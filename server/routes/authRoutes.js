import express from 'express';
import {
  handleRequestOtp,
  handleVerifyOtp,
  handleLoginPassword,
  handleSetPassword,
  handleRemovePassword,
  handleRefreshToken,
  handleLogout,
  handleLogoutAll,
} from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/auth.validation.js';
import { otpRateLimit, refreshRateLimit, passwordRateLimit } from '../middleware/RateLimit.js';

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.post('/request-otp',  otpRateLimit,      validate(schemas.requestOtp),    handleRequestOtp);
router.post('/verify-otp',   otpRateLimit,      validate(schemas.verifyOtp),     handleVerifyOtp);
router.post('/login',        passwordRateLimit, validate(schemas.loginPassword), handleLoginPassword);
router.post('/refresh',      refreshRateLimit,                                   handleRefreshToken);
router.post('/logout',                                                            handleLogout);

// ── Authenticated ─────────────────────────────────────────────────────────────
router.post('/logout-all',   authMiddleware,                                      handleLogoutAll);
router.post('/set-password', authMiddleware, validate(schemas.setPassword),       handleSetPassword);
router.delete('/password',   authMiddleware, validate(schemas.removePassword),    handleRemovePassword);

export default router;