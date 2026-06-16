'use strict';

/**
 * models/AuditLog.js
 *
 * Append-only record of privileged actions — who did what, to which entity,
 * when, and from where. Written by AuditService.recordAudit() from admin
 * mutation paths (role changes, order status, refunds, deactivations…).
 *
 * Never updated or deleted in normal operation (updatedAt disabled). The actor
 * FK is unconstrained so removing a user never erases their history.
 */
export default (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    'AuditLog',
    {
      id: {
        type:          DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey:    true,
      },
      actorId: {
        type:      DataTypes.UUID,
        allowNull: true,
        comment:   'User who performed the action; null = system/cron',
      },
      action: {
        type:      DataTypes.STRING(80),
        allowNull: false,
        comment:   'Dotted verb, e.g. user.role_updated, order.status_changed, payment.refunded',
      },
      entityType: {
        type:      DataTypes.STRING(40),
        allowNull: true,
        comment:   'Resource kind acted on, e.g. user, order, refund',
      },
      entityId: {
        type:      DataTypes.STRING(64),
        allowNull: true,
        comment:   'Id of the acted-on resource (string to fit UUID or numeric ids)',
      },
      metadata: {
        type:      DataTypes.JSON,
        allowNull: true,
        comment:   'Action-specific detail, e.g. { from, to, amount, reason }',
      },
      ipAddress: {
        type:      DataTypes.STRING(64),
        allowNull: true,
      },
    },
    {
      tableName:   'audit_logs',
      underscored: true,
      paranoid:    false,
      updatedAt:   false,   // append-only
      indexes: [
        { fields: ['actor_id'] },
        { fields: ['entity_type', 'entity_id'] },
        { fields: ['created_at'] },
        { fields: ['action'] },
      ],
    }
  );

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, {
      foreignKey:  'actorId',
      as:          'actor',
      constraints: false,   // keep history even if the user row is removed
    });
  };

  return AuditLog;
};
