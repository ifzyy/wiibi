'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      google_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true,
      },
      avatar_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      role: {
        type: Sequelize.ENUM('user', 'admin'),
        allowNull: false,
        defaultValue: 'user',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      shipping_address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      billing_address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      password_reset_token: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      password_reset_expires: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      preferred_contact_method: {
        type: Sequelize.ENUM('email', 'phone', 'whatsapp'),
        allowNull: true,
        defaultValue: 'phone',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('users', ['email'], { unique: true });
    await queryInterface.addIndex('users', ['phone'], { unique: true });
    await queryInterface.addIndex('users', ['google_id'], { unique: true });
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['password_reset_token']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};