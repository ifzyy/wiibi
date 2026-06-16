import db from '../models/index.js';
import { NotFoundError, ValidationError } from '../utils/AppError.js';

export const getUserById = async (id) => {
  const user = await db.User.findByPk(id);
  if (!user) throw new NotFoundError('User not found');
  return user;
};

export const getAllUsers = async ({ page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const { rows, count } = await db.User.findAndCountAll({
    limit, offset,
    order: [['createdAt', 'DESC']],
  });
  return {
    users:      rows.map((u) => u.toSafeJSON()),
    pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
  };
};


export const updateProfile = async (id, data) => {
  const user    = await getUserById(id);
  const allowed = ['firstName', 'lastName', 'email', 'avatarUrl', 'shippingAddress', 'cookieConsent'];
  const updates = {};
  for (const key of allowed) {
    if (data[key] !== undefined) updates[key] = data[key];
  }
  // Stamp when the consent decision was recorded (server-authoritative).
  if (updates.cookieConsent && typeof updates.cookieConsent === 'object') {
    updates.cookieConsent = { ...updates.cookieConsent, updatedAt: new Date().toISOString() };
  }
  // The model attribute is `phoneNumber` (column phone_number); the API field is
  // `phone`. Map it explicitly — otherwise Sequelize drops the unknown `phone`
  // key and phone updates silently no-op. `role` is intentionally NOT settable here.
  if (data.phone !== undefined) updates.phoneNumber = data.phone;

  await user.update(updates);
  return user.toSafeJSON();
};

export const updateUserRole = async (id, role) => {
  if (!['user', 'staff', 'admin'].includes(role)) throw new ValidationError('Role must be user, staff or admin');
  const user = await getUserById(id);
  await user.update({ role });
  return user.toSafeJSON();
};

export const deactivateUser = async (id) => {
  const user = await getUserById(id);
  await user.update({ isActive: false });
};