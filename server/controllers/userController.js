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
import { recordAudit } from '../services/AuditService.js';

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
  // Cookie consent — `essential` is always on and not user-settable, so it's
  // intentionally not accepted here. updatedAt is stamped server-side.
  cookieConsent: Joi.object({
    analytics:       Joi.boolean().required(),
    marketing:       Joi.boolean().required(),
    personalization: Joi.boolean().required(),
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
  await recordAudit({
    actorId:    req.user.id,
    action:     'user.role_updated',
    entityType: 'user',
    entityId:   req.params.id,
    metadata:   { role: req.body.role },
    ip:         req.ip,
  });
  return sendSuccess(res, user, 'Role updated');
});

export const handleDeactivateUser = asyncHandler(async (req, res) => {
  await deactivateUser(req.params.id);
  await recordAudit({
    actorId:    req.user.id,
    action:     'user.deactivated',
    entityType: 'user',
    entityId:   req.params.id,
    ip:         req.ip,
  });
  return sendSuccess(res, null, 'User deactivated');
});