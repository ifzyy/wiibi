'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('page_views', {
      id: {
        type:          Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey:    true,
      },
      user_id: {
        type:       Sequelize.UUID,
        allowNull:  true,
        references: { model: 'users', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'SET NULL',
      },
      session_id: {
        type:      Sequelize.STRING(128),
        allowNull: true,
      },
      path: {
        type:      Sequelize.STRING(500),
        allowNull: false,
      },
      referrer: {
        type:      Sequelize.STRING(500),
        allowNull: true,
      },
      user_agent: {
        type:      Sequelize.STRING(500),
        allowNull: true,
      },
      ip_hash: {
        type:      Sequelize.STRING(64),
        allowNull: true,
      },
      response_ms: {
        type:      Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      created_at: {
        type:         Sequelize.DATE,
        allowNull:    false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('page_views', ['created_at']);
    await queryInterface.addIndex('page_views', ['path']);
    await queryInterface.addIndex('page_views', ['user_id']);
    await queryInterface.addIndex('page_views', ['session_id']);
    await queryInterface.addIndex('page_views', ['ip_hash']);
    await queryInterface.addIndex('page_views', ['path', 'created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('page_views');
  }
};