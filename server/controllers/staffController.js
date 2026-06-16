/**
 * controllers/staffController.js — admin-only staff account management.
 * Every mutation is recorded to the audit log with the acting admin's id.
 */
import Joi from 'joi';
import asyncHandler from '../utils/Asynchandler.js';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response.js';
import { ValidationError } from '../utils/AppError.js';
import {
  listStaff,
  createStaff,
  resetStaffPassword,
  setStaffActive,
} from '../services/StaffService.js';
import { recordAudit } from '../services/AuditService.js';

const createSchema = Joi.object({
  firstName:   Joi.string().max(100).required(),
  lastName:    Joi.string().max(100).allow('', null),
  email:       Joi.string().email().max(255).allow('', null),
  phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{7,14}$/).required()
    .messages({ 'string.pattern.base': 'Phone must be international format e.g. +2348012345678' }),
});

export const handleListStaff = asyncHandler(async (req, res) => {
  const { staff, pagination } = await listStaff({
    page:  req.query.page,
    limit: req.query.limit,
  });
  return sendPaginated(res, staff, pagination);
});

export const handleCreateStaff = asyncHandler(async (req, res) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message);

  const { user, tempPassword } = await createStaff(value);
  await recordAudit({
    actorId:    req.user.id,
    action:     'staff.created',
    entityType: 'user',
    entityId:   user.id,
    metadata:   { phoneNumber: user.phoneNumber, email: user.email },
    ip:         req.ip,
  });

  // tempPassword is returned ONCE for the admin to hand off — never stored plain.
  return sendCreated(res, { staff: user, tempPassword }, 'Staff login created');
});

export const handleResetStaffPassword = asyncHandler(async (req, res) => {
  const { user, tempPassword } = await resetStaffPassword(req.params.id);
  await recordAudit({
    actorId:    req.user.id,
    action:     'staff.password_reset',
    entityType: 'user',
    entityId:   req.params.id,
    ip:         req.ip,
  });
  return sendSuccess(res, { staff: user, tempPassword }, 'Password reset');
});

export const handleRevokeStaff = asyncHandler(async (req, res) => {
  const user = await setStaffActive(req.params.id, false);
  await recordAudit({
    actorId:    req.user.id,
    action:     'staff.revoked',
    entityType: 'user',
    entityId:   req.params.id,
    ip:         req.ip,
  });
  return sendSuccess(res, user, 'Staff login revoked');
});

export const handleRestoreStaff = asyncHandler(async (req, res) => {
  const user = await setStaffActive(req.params.id, true);
  await recordAudit({
    actorId:    req.user.id,
    action:     'staff.restored',
    entityType: 'user',
    entityId:   req.params.id,
    ip:         req.ip,
  });
  return sendSuccess(res, user, 'Staff login restored');
});
