'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('refunds', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey:   true,
        allowNull:    false,
      },

      order_id: {
        type:       Sequelize.UUID,
        allowNull:  false,
        references: { model: 'orders', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'CASCADE',
      },

      amount: {
        type:      Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },

      currency: {
        type:         Sequelize.STRING(3),
        defaultValue: 'NGN',
        allowNull:    false,
      },

      reason: {
        type:      Sequelize.STRING(500),
        allowNull: true,
      },

      method: {
        type:      Sequelize.ENUM(
          'Paystack',
          'Bank Transfer',
          'Cash',
          'Flutterwave',
          'Credit Note',
        ),
        allowNull: false,
      },

      status: {
        type:         Sequelize.ENUM('pending', 'processing', 'completed', 'failed', 'manual_required'),
        defaultValue: 'pending',
        allowNull:    false,
      },

      gateway_reference: {
        type:      Sequelize.STRING(200),
        allowNull: true,
      },

      payment_reference: {
        type:      Sequelize.STRING(200),
        allowNull: true,
      },

      processed_by: {
        type:       Sequelize.UUID,
        allowNull:  true,
        references: { model: 'users', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'SET NULL',
      },

      processed_at: {
        type:      Sequelize.DATE,
        allowNull: true,
      },

      failure_reason: {
        type:      Sequelize.STRING(500),
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

    await queryInterface.addIndex('refunds', ['order_id'],          { name: 'refunds_order_id' });
    await queryInterface.addIndex('refunds', ['status'],            { name: 'refunds_status' });
    await queryInterface.addIndex('refunds', ['gateway_reference'], { name: 'refunds_gateway_reference' });
    await queryInterface.addIndex('refunds', ['processed_by'],      { name: 'refunds_processed_by' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('refunds');
  },
};