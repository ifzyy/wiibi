'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('refresh_tokens', {
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
      token_hash: {
        type:      Sequelize.STRING(255),
        allowNull: false,
        unique:    true,
      },
      expires_at: {
        type:      Sequelize.DATE,
        allowNull: false,
      },
      is_revoked: {
        type:         Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull:    false,
      },
      device_info: {
        type:      Sequelize.STRING(255),
        allowNull: true,
      },
      ip_address: {
        type:      Sequelize.STRING(45),
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

    await queryInterface.addIndex('refresh_tokens', ['user_id']);
    await queryInterface.addIndex('refresh_tokens', ['token_hash'], { unique: true });
    await queryInterface.addIndex('refresh_tokens', ['expires_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('refresh_tokens');
  },
};
