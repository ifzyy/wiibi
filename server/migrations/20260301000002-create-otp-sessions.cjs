'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('otp_sessions', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.literal('(UUID())'),
        primaryKey:   true,
        allowNull:    false,
      },
      user_id: {
        type:       Sequelize.UUID,
        allowNull:  false,
        references: { model: 'users', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'CASCADE',
      },
      otp_hash: {
        type:      Sequelize.STRING(255),
        allowNull: false,
      },
      expires_at: {
        type:      Sequelize.DATE,
        allowNull: false,
      },
      attempts: {
        type:         Sequelize.INTEGER,
        defaultValue: 0,
        allowNull:    false,
      },
      is_used: {
        type:         Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull:    false,
      },
      ip_address: {
        type:      Sequelize.STRING(45),
        allowNull: true,
      },
      user_agent: {
        type:      Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type:      Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type:      Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('otp_sessions', ['user_id']);
    await queryInterface.addIndex('otp_sessions', ['expires_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('otp_sessions');
  },
};
