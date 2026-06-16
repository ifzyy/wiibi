/**
 * services/AuditService.js
 *
 * One job: persist a privileged-action record. FIRE-AND-FORGET SAFE — it never
 * throws, so an audit-write failure can never break or roll back the action it
 * describes. Call it AFTER the action has succeeded.
 *
 *   recordAudit({ actorId: req.user.id, action: 'order.status_changed',
 *                 entityType: 'order', entityId: order.id,
 *                 metadata: { from, to }, ip: req.ip });
 */
import db from '../models/index.js';
import logger from '../utils/logger.js';

export const recordAudit = async ({
  actorId   = null,
  action,
  entityType = null,
  entityId   = null,
  metadata   = null,
  ip         = null,
} = {}) => {
  try {
    if (!action) return;
    await db.AuditLog.create({
      actorId,
      action,
      entityType,
      entityId:  entityId != null ? String(entityId) : null,
      metadata,
      ipAddress: ip ? String(ip).slice(0, 64) : null,
    });
  } catch (err) {
    logger.error(`[AuditService] failed to record "${action}": ${err.message}`);
  }
};

/**
 * Paginated, newest-first read for the admin audit view. Caps limit so the
 * table can't be bulk-scraped in one call.
 */
export const listAudit = async ({ page = 1, limit = 50, action = null, entityType = null, actorId = null } = {}) => {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
  const safePage  = Math.max(parseInt(page, 10) || 1, 1);
  const where = {};
  if (action)     where.action     = action;
  if (entityType) where.entityType = entityType;
  if (actorId)    where.actorId    = actorId;

  const { rows, count } = await db.AuditLog.findAndCountAll({
    where,
    offset: (safePage - 1) * safeLimit,
    limit:  safeLimit,
    order:  [['createdAt', 'DESC']],
    include: [{
      model:      db.User,
      as:         'actor',
      attributes: ['id', 'firstName', 'lastName', 'email'],
      required:   false,
    }],
  });

  return {
    logs:       rows,
    pagination: { page: safePage, limit: safeLimit, total: count, pages: Math.ceil(count / safeLimit) },
  };
};

export default { recordAudit, listAudit };
