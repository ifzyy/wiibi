import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import db from '../models/index.js';
import { generateOTP } from '../utils/generateOtp.js';
import { AuthError, AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';

const OTP_EXPIRES_MINUTES = parseInt(process.env.OTP_EXPIRES_MINUTES || '5',  10);
const OTP_MAX_ATTEMPTS    = parseInt(process.env.OTP_MAX_ATTEMPTS    || '5',  10);

/**
 * Creates a fresh OTP for a user, invalidates all previous active ones,
 * and console.logs it (swap console.log for real SMS provider here).
 */
export const createOtp = async (userId, ipAddress, userAgent) => {
  // Invalidate all existing active OTPs for this user
  await db.OtpSession.update(
    { isUsed: true },
    { where: { userId, isUsed: false } }
  );

  const otp       = generateOTP();
  const otpHash   = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

  await db.OtpSession.create({
    userId,
    otpHash,
    expiresAt,
    attempts: 0,
    isUsed:   false,
    ipAddress,
    userAgent: userAgent ? userAgent.substring(0, 500) : null,
  });

  // ─── MOCK SMS — replace with Twilio / Vonage / Termii ────────────────────
  console.log('[OTP MOCK] ─────────────────────────────────────');
  console.log('[OTP MOCK]  userId  :', userId);
  console.log('[OTP MOCK]  OTP     :', otp);
  console.log('[OTP MOCK]  Expires :', expiresAt.toISOString());
  console.log('[OTP MOCK] ─────────────────────────────────────');
  // ─────────────────────────────────────────────────────────────────────────

  return { expiresAt };
};

/**
 * Verifies a plain OTP against the stored hash.
 * Increments attempts and locks out after max attempts.
 */
export const verifyOtp = async (userId, plainOtp) => {
  const session = await db.OtpSession.findOne({
    where: {
      userId,
      isUsed:    false,
      expiresAt: { [Op.gt]: new Date() },
    },
    order: [['createdAt', 'DESC']],
  });

  if (!session) {
    throw new AuthError('OTP expired or not found. Please request a new one.');
  }

  if (session.attempts >= OTP_MAX_ATTEMPTS) {
    await session.update({ isUsed: true });
    throw new AppError('Maximum OTP attempts exceeded. Please request a new OTP.', 429, 'OTP_MAX_ATTEMPTS');
  }

  const isValid = await bcrypt.compare(plainOtp, session.otpHash);

  if (!isValid) {
    await session.increment('attempts');
    const remaining = OTP_MAX_ATTEMPTS - (session.attempts + 1);
    throw new AuthError(
      'Invalid OTP. ' + (remaining > 0 ? remaining + ' attempt(s) remaining.' : 'No attempts left.')
    );
  }

  await session.update({ isUsed: true });
  return true;
};

export const cleanExpiredOtps = async () => {
  const deleted = await db.OtpSession.destroy({
    where: { expiresAt: { [Op.lt]: new Date() } },
  });
  if (deleted > 0) logger.info('Cleaned ' + deleted + ' expired OTP session(s)');
};