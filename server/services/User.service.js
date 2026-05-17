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

export const getAllUsersNoPagination = async () => {
  const users = await db.User.findAll({ order: [['createdAt', 'DESC']] });
  return users.map((u) => u.toSafeJSON());
};

export const updateProfile = async (id, data) => {
  const user    = await getUserById(id);
  const allowed = ['firstName', 'lastName','email', 'phone', 'avatarUrl', 'shippingAddress'];
  const updates = {};
  for (const key of allowed) {
    if (data[key] !== undefined) updates[key] = data[key];
  }
  await user.update(updates);
  return user.toSafeJSON();
};

export const updateUserRole = async (id, role) => {
  if (!['user', 'admin'].includes(role)) throw new ValidationError('Role must be user or admin');
  const user = await getUserById(id);
  await user.update({ role });
  return user.toSafeJSON();
};

export const deactivateUser = async (id) => {
  const user = await getUserById(id);
  await user.update({ isActive: false });
};