/**
 * services/OAuthService.js
 *
 * Handles two Google credential shapes on ONE endpoint:
 *
 *  id_token  — from One Tap (useGoogleOneTapLogin) and the GoogleLogin button.
 *              A long JWT string. Verified directly with google-auth-library.
 *
 *  auth-code — from the mobile redirect flow (useGoogleLogin ux_mode:'redirect').
 *              Starts with "4/". Exchanged for tokens first, then id_token verified.
 *
 * The controller detects which shape arrived and calls the right function.
 *
 * npm install google-auth-library
 */

import { OAuth2Client } from 'google-auth-library';
import db               from '../models/index.js';
import { signAccessToken, signRefreshToken } from '../utils/Jwt.js';
import { AuthError }    from '../utils/AppError.js';
import logger           from '../utils/logger.js';
import crypto           from 'crypto';

const REFRESH_TTL  = 7 * 24 * 60 * 60 * 1000;

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
);

const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

// ── Issue our own JWT pair ────────────────────────────────────────────────────
const issueTokenPair = async (user, ipAddress, userAgent) => {
  const payload      = { id: user.id, role: user.role };
  const accessToken  = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await db.RefreshToken.create({
    userId:     user.id,
    tokenHash:  hashToken(refreshToken),
    expiresAt:  new Date(Date.now() + REFRESH_TTL),
    deviceInfo: userAgent?.substring(0, 255) ?? null,
    ipAddress,
  });

  return { accessToken, refreshToken };
};

// ── Path A: verify id_token directly (One Tap + GoogleLogin button) ───────────
export const verifyGoogleIdToken = async (idToken) => {
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    throw new AuthError('Google authentication failed: ' + err.message);
  }

  if (!payload?.sub) throw new AuthError('Google token missing subject');

  return {
    providerId:    payload.sub,
    email:         payload.email   ?? null,
    // Google sets email_verified; we only trust the email for cross-account
    // LINKING when it is verified (see oauthLogin). An unverified email must
    // never be used to attach this provider to an existing account, or an
    // attacker could create a Google account with a victim's email and take over.
    emailVerified: payload.email_verified === true,
    name:          payload.name    ?? null,
    avatar:        payload.picture ?? null,
  };
};

// ── Path B: exchange auth-code → then verify id_token (mobile redirect) ───────
export const exchangeGoogleCode = async (code, redirectUri) => {
  let idToken;
  try {
    const { tokens } = await googleClient.getToken({ code, redirect_uri: redirectUri });
    idToken = tokens.id_token;
  } catch (err) {
    throw new AuthError('Google code exchange failed: ' + err.message);
  }

  // Reuse Path A to verify the id_token from the exchange
  return verifyGoogleIdToken(idToken);
};

// ── Find or create user, issue our JWT pair ───────────────────────────────────
export const oauthLogin = async (provider, profile, ipAddress, userAgent) => {
  const { providerId, email, emailVerified, name, avatar } = profile;

  const user = await db.sequelize.transaction(async (t) => {
    // A. Returning OAuth user
    const existing = await db.OAuthAccount.findOne({
      where:   { provider, providerId },
      include: [{ model: db.User, as: 'user' }],
      transaction: t,
    });

    if (existing) {
      await existing.update({ email: email ?? existing.email }, { transaction: t });
      await existing.user.update({ lastLoginAt: new Date() }, { transaction: t });
      return existing.user;
    }

    // B. Email matches existing account — link provider.
    // Only link by email when the provider VERIFIED that email. An unverified
    // email is never trusted to attach to a pre-existing account (takeover risk).
    let foundUser = (email && emailVerified)
      ? await db.User.findOne({ where: { email }, transaction: t })
      : null;

    // C. Brand new user
    if (!foundUser) {
      foundUser = await db.User.create({
        email,
        name:        name ?? email?.split('@')[0] ?? 'User',
        avatarUrl:   avatar,
        isVerified:  true,
        isActive:    true,
        lastLoginAt: new Date(),
      }, { transaction: t });
    } else {
      await foundUser.update({ isVerified: true, lastLoginAt: new Date() }, { transaction: t });
    }

    await db.OAuthAccount.create(
      { userId: foundUser.id, provider, providerId, email },
      { transaction: t }
    );

    return foundUser;
  });

  const tokens = await issueTokenPair(user, ipAddress, userAgent);
  logger.info(`OAuth login (${provider}) success for user ${user.id}`);
  return { ...tokens, user: user.toSafeJSON() };
};