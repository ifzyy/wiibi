'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.literal('(UUID())'),
        primaryKey:   true,
        allowNull:    false,
      },
      email:{
        type:      Sequelize.STRING(255),
        allowNull: true,
        unique:    true,
      },
      phone_number: {
        type:      Sequelize.STRING(20),
        allowNull: true,
        unique:    true,
      },
      is_verified: {
        type:         Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull:    false,
      },
      password: {
        type:      Sequelize.STRING(255),
        allowNull: true,
      },
      password_set_at: {
        type:      Sequelize.DATE,
        allowNull: true,
      },
      password_reset_token: {
        type:      Sequelize.STRING(255),
        allowNull: true,
      },
      password_reset_expires: {
        type:      Sequelize.DATE,
        allowNull: true,
      },
      first_name: {
        type:      Sequelize.STRING(100),
        allowNull: true,
      },
      last_name: {
        type:      Sequelize.STRING(100),
        allowNull: true,
      },
      avatar_url: {
        type:      Sequelize.STRING(500),
        allowNull: true,
      },
      role: {
        type:         Sequelize.ENUM('user', 'admin'),
        allowNull:    false,
        defaultValue: 'user',
      },
      is_active: {
        type:         Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull:    false,
      },
      last_login_at: {
        type:      Sequelize.DATE,
        allowNull: true,
      },
      shipping_address: {
        type:      Sequelize.JSON,
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

    await queryInterface.addIndex('users', ['phone_number'], { unique: true });
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['is_active']);
    await queryInterface.addIndex('users', ['password_reset_token']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
