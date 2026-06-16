/**
 * routes/auditRoutes.js
 *
 * Admin-only, read-only view of the privileged-action log.
 * Mounted at /api/admin/audit-logs.
 */
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import asyncHandler from '../utils/Asynchandler.js';
import { sendPaginated } from '../utils/response.js';
import { listAudit } from '../services/AuditService.js';

const router = express.Router();

router.use(authenticate);
router.use(requireRole('admin'));

router.get('/', asyncHandler(async (req, res) => {
  const { logs, pagination } = await listAudit({
    page:       req.query.page,
    limit:      req.query.limit,
    action:     req.query.action     || null,
    entityType: req.query.entityType || null,
    actorId:    req.query.actorId    || null,
  });
  return sendPaginated(res, logs, pagination);
}));

export default router;
