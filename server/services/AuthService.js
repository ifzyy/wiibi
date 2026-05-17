import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '../models/index.js';
import { createOtp, verifyOtp } from './OtpService.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/Jwt.js';
import { AuthError, NotFoundError } from '../utils/AppError.js';
import logger from '../utils/logger.js';

const SALT_ROUNDS = 12;
const REFRESH_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

const normalizeIdentifier = ({ phoneNumber, email }) => {
  if (email) return { email: email.trim().toLowerCase() };
  if (phoneNumber) return { phoneNumber };
  throw new AuthError('Email or phone number is required');
};

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const issueTokenPair = async (user, ipAddress, userAgent) => {
  // Use { id, role } to match the existing authenticate middleware (decoded.id)
  const payload      = { id: user.id, role: user.role };
  const accessToken  = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await db.RefreshToken.create({
    userId:     user.id,
    tokenHash:  hashToken(refreshToken),
    expiresAt:  new Date(Date.now() + REFRESH_TTL),
    deviceInfo: userAgent ? userAgent.substring(0, 255) : null,
    ipAddress,
  });

  return { accessToken, refreshToken };
};

// ── OTP flow ──────────────────────────────────────────────────────────────────

export const requestOtp = async (identifier, ipAddress, userAgent) => {
  const query = normalizeIdentifier(identifier);
  const [user] = await db.User.findOrCreate({
    where:    query,
    defaults: query,
  });

  const { expiresAt } = await createOtp(user.id, ipAddress, userAgent);
  logger.info('OTP requested for user ' + user.id);
  return { userId: user.id, expiresAt };
};

export const loginWithOtp = async (identifier, otp, ipAddress, userAgent) => {
  const query = normalizeIdentifier(identifier);
  const user = await db.User.findOne({ where: query });
  if (!user) throw new AuthError('No account found. Please request an OTP first.');

  await verifyOtp(user.id, otp);

  await user.update({ isVerified: true, lastLoginAt: new Date() });

  const tokens = await issueTokenPair(user, ipAddress, userAgent);
  logger.info('OTP login success for user ' + user.id);
  return { ...tokens, user: user.toSafeJSON() };
};

// ── Password flow ─────────────────────────────────────────────────────────────

export const loginWithPassword = async (phoneNumber, password, ipAddress, userAgent) => {
  const user = await db.User.findOne({ where: { phoneNumber } });
  const GENERIC = 'Invalid phone number or password';

  if (!user)          throw new AuthError(GENERIC);
  if (!user.isActive) throw new AuthError('Account is deactivated');
  if (!user.password) throw new AuthError('No password set on this account. Please use OTP login.');

  const matches = await bcrypt.compare(password, user.password);
  if (!matches) throw new AuthError(GENERIC);

  if (!user.isVerified) await user.update({ isVerified: true });
  await user.update({ lastLoginAt: new Date() });

  const tokens = await issueTokenPair(user, ipAddress, userAgent);
  logger.info('Password login success for user ' + user.id);
  return { ...tokens, user: user.toSafeJSON() };
};

export const setPassword = async (userId, newPassword, currentPassword = null) => {
  const user = await db.User.findByPk(userId);
  if (!user) throw new NotFoundError('User not found');

  if (user.password) {
    if (!currentPassword) throw new AuthError('Current password is required to set a new one');
    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) throw new AuthError('Current password is incorrect');
  }

  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.update({ password: hash, passwordSetAt: new Date() });
  return { message: 'Password set successfully. You can now log in with phone + password.' };
};

export const removePassword = async (userId, currentPassword) => {
  const user = await db.User.findByPk(userId);
  if (!user || !user.password) throw new AuthError('No password is set on this account');

  const matches = await bcrypt.compare(currentPassword, user.password);
  if (!matches) throw new AuthError('Current password is incorrect');

  await user.update({ password: null, passwordSetAt: null });
  return { message: 'Password removed. OTP login is now required.' };
};

// ── Token rotation ────────────────────────────────────────────────────────────

export const refreshAccessToken = async (refreshToken, ipAddress) => {
  const payload   = verifyRefreshToken(refreshToken);
  const tokenHash = hashToken(refreshToken);

  const stored = await db.RefreshToken.findOne({ where: { tokenHash, isRevoked: false } });

  if (!stored || stored.expiresAt < new Date()) {
    throw new AuthError('Invalid or expired refresh token');
  }

  if (stored.userId !== payload.id) {
    await db.RefreshToken.update({ isRevoked: true }, { where: { userId: stored.userId } });
    logger.warn('Refresh token reuse detected — all sessions revoked for user ' + payload.id);
    throw new AuthError('Security violation detected. Please log in again.');
  }

  await stored.update({ isRevoked: true });

  const user = await db.User.findByPk(payload.id);
  if (!user || !user.isActive) throw new AuthError('Account not found or deactivated');

  return issueTokenPair(user, ipAddress, null);
};

export const logout = async (refreshToken) => {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);
  await db.RefreshToken.update({ isRevoked: true }, { where: { tokenHash } });
};

export const logoutAll = async (userId) => {
  await db.RefreshToken.update({ isRevoked: true }, { where: { userId } });
};