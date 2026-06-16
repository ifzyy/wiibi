'use strict';

/** Append-only admin/privileged action log — see models/AuditLog.js. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
      id: {
        type:          Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey:    true,
        allowNull:     false,
      },
      actor_id:    { type: Sequelize.UUID,        allowNull: true },
      action:      { type: Sequelize.STRING(80),  allowNull: false },
      entity_type: { type: Sequelize.STRING(40),  allowNull: true },
      entity_id:   { type: Sequelize.STRING(64),  allowNull: true },
      metadata:    { type: Sequelize.JSON,        allowNull: true },
      ip_address:  { type: Sequelize.STRING(64),  allowNull: true },
      created_at: {
        type:         Sequelize.DATE,
        allowNull:    false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('audit_logs', ['actor_id']);
    await queryInterface.addIndex('audit_logs', ['entity_type', 'entity_id']);
    await queryInterface.addIndex('audit_logs', ['created_at']);
    await queryInterface.addIndex('audit_logs', ['action']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('audit_logs');
  },
};
