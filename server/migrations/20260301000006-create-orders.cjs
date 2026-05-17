'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.literal('(UUID())'),
        primaryKey:   true,
        allowNull:    false,
      },
      user_id: {
        type:       Sequelize.UUID,
        allowNull:  true,             // null for guest orders
        references: { model: 'users', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'RESTRICT',
      },

      // Guest checkout fields
      guest_email: {
        type:      Sequelize.STRING(255),
        allowNull: true,
      },
      guest_token: {
        type:      Sequelize.STRING(100),
        allowNull: true,
      },

      order_number: {
        type:      Sequelize.STRING(50),
        allowNull: false,
        unique:    true,
      },
      status: {
        type:         Sequelize.ENUM('pending', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled'),
        defaultValue: 'pending',
        allowNull:    false,
      },
      payment_status: {
        type:         Sequelize.ENUM('unpaid', 'paid', 'partially_refunded', 'refunded', 'failed'),
        defaultValue: 'unpaid',
        allowNull:    false,
      },
      total_amount: {
        type:      Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      currency: {
        type:         Sequelize.STRING(3),
        defaultValue: 'NGN',
        allowNull:    false,
      },
      shipping_address: {
        type:      Sequelize.JSON,
        allowNull: true,
      },
      tracking_number: {
        type:      Sequelize.STRING(100),
        allowNull: true,
      },
      payment_reference: {
        type:      Sequelize.STRING(200),
        allowNull: true,
      },
      idempotency_key: {
        type:      Sequelize.STRING(128),
        allowNull: true,
        unique:    true,
      },
      notes: {
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

    await queryInterface.addIndex('orders', ['user_id']);
    await queryInterface.addIndex('orders', ['order_number'],     { unique: true });
    await queryInterface.addIndex('orders', ['status']);
    await queryInterface.addIndex('orders', ['payment_status']);
    await queryInterface.addIndex('orders', ['payment_reference']);
    await queryInterface.addIndex('orders', ['guest_token']);
    await queryInterface.addIndex('orders', ['guest_email']);
    await queryInterface.addIndex('orders', ['idempotency_key'],  { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('orders');
  },
};