import Joi from 'joi';
import asyncHandler from '../utils/Asynchandler.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import { ValidationError } from '../utils/AppError.js';
import {
  getUserById,
  getAllUsers,
  updateProfile,
  updateUserRole,
  deactivateUser,
} from '../services/User.service.js';

const profileSchema = Joi.object({
  email:           Joi.string().email().max(255).allow('', null),
  firstName:       Joi.string().max(100).allow('', null),
  phone:           Joi.string().max(20).allow('', null),
  lastName:        Joi.string().max(100).allow('', null),
  avatarUrl:       Joi.string().uri().allow('', null),
  shippingAddress: Joi.object({
    addressLine1: Joi.string().required(),
    addressLine2: Joi.string().allow('', null),
    city:         Joi.string().required(),
    state:        Joi.string().required(),
    postalCode:   Joi.string().required(),
    country:      Joi.string().length(2).uppercase().required(),
    phone:        Joi.string().allow('', null),
  }).allow(null),
}).min(1);

export const handleGetMe = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user.id);
  return sendSuccess(res, user.toSafeJSON());
});

export const handleUpdateMe = asyncHandler(async (req, res) => {
  const { error, value } = profileSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message);
  const user = await updateProfile(req.user.id, value);
  return sendSuccess(res, user, 'Profile updated');
});

export const handleGetAllUsers = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page  || '1');
  const limit = Math.min(parseInt(req.query.limit || '20'), 100);
  const { users, pagination } = await getAllUsers({ page, limit });
  return sendPaginated(res, users, pagination);
});


export const handleGetUser = asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);
  return sendSuccess(res, user.toSafeJSON());
});

export const handleUpdateRole = asyncHandler(async (req, res) => {
  const user = await updateUserRole(req.params.id, req.body.role);
  return sendSuccess(res, user, 'Role updated');
});

export const handleDeactivateUser = asyncHandler(async (req, res) => {
  await deactivateUser(req.params.id);
  return sendSuccess(res, null, 'User deactivated');
});