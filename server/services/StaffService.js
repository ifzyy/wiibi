/**
 * services/StaffService.js
 *
 * Admin-managed staff accounts. Staff are limited back-office operators
 * (role='staff') who sign in with the SAME phone + password flow as anyone
 * else — the admin just provisions the login and shares the generated
 * password once. Admins can reset that password or revoke (deactivate) the
 * account; deactivation immediately kills the auth middleware's access AND
 * revokes any live refresh tokens so existing sessions can't continue.
 */
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '../models/index.js';
import { NotFoundError, ValidationError } from '../utils/AppError.js';

const SALT_ROUNDS = 12;

// Readable, unambiguous alphabet (no 0/O/1/l/I) for a password the admin will
// copy/paste to the staff member once.
const PW_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
const generatePassword = (len = 12) => {
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += PW_ALPHABET[bytes[i] % PW_ALPHABET.length];
  return out;
};

/** Only staff accounts are returned here — admins are managed elsewhere. */
export const listStaff = async ({ page = 1, limit = 50 } = {}) => {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
  const safePage  = Math.max(parseInt(page, 10) || 1, 1);

  const { rows, count } = await db.User.findAndCountAll({
    where:  { role: 'staff' },
    limit:  safeLimit,
    offset: (safePage - 1) * safeLimit,
    order:  [['createdAt', 'DESC']],
  });

  return {
    staff:      rows.map((u) => u.toSafeJSON()),
    pagination: { page: safePage, limit: safeLimit, total: count, pages: Math.ceil(count / safeLimit) },
  };
};

/**
 * Provision a staff login. Returns the created user + the one-time plaintext
 * password (never stored in plaintext, never retrievable again — show once).
 */
export const createStaff = async ({ firstName, lastName, email, phoneNumber }) => {
  if (!phoneNumber) throw new ValidationError('Phone number is required for a staff login');

  // Reuse a person who already has an account (e.g. they shopped as a customer)
  // by promoting them, rather than colliding on the unique phone/email.
  const existing = await db.User.findOne({ where: { phoneNumber } });
  if (existing && existing.role === 'admin') {
    throw new ValidationError('That phone number belongs to an admin account');
  }

  const tempPassword = generatePassword();
  const hash         = await bcrypt.hash(tempPassword, SALT_ROUNDS);

  let user;
  if (existing) {
    await existing.update({
      firstName: firstName ?? existing.firstName,
      lastName:  lastName  ?? existing.lastName,
      email:     email     ?? existing.email,
      role:      'staff',
      isActive:  true,
      isVerified: true,
      password:  hash,
      passwordSetAt: new Date(),
    });
    user = existing;
  } else {
    user = await db.User.create({
      firstName,
      lastName,
      email:        email || null,
      phoneNumber,
      role:         'staff',
      isActive:     true,
      isVerified:   true,
      password:     hash,
      passwordSetAt: new Date(),
    });
  }

  return { user: user.toSafeJSON(), tempPassword };
};

const getStaff = async (id) => {
  const user = await db.User.findByPk(id);
  if (!user || user.role !== 'staff') throw new NotFoundError('Staff member not found');
  return user;
};

/** Regenerate a staff member's password and end their current sessions. */
export const resetStaffPassword = async (id) => {
  const user         = await getStaff(id);
  const tempPassword = generatePassword();
  const hash         = await bcrypt.hash(tempPassword, SALT_ROUNDS);

  await user.update({ password: hash, passwordSetAt: new Date() });
  // Old sessions shouldn't survive a credential reset.
  await db.RefreshToken.update({ isRevoked: true }, { where: { userId: user.id } });

  return { user: user.toSafeJSON(), tempPassword };
};

/**
 * Revoke (deactivate) or restore a staff login. Deactivating also revokes live
 * refresh tokens — combined with the auth middleware's isActive check, this
 * locks them out immediately, not just at token expiry.
 */
export const setStaffActive = async (id, active) => {
  const user = await getStaff(id);
  await user.update({ isActive: !!active });
  if (!active) {
    await db.RefreshToken.update({ isRevoked: true }, { where: { userId: user.id } });
  }
  return user.toSafeJSON();
};
