'use strict';

/**
 * Migration: add-expired-status-to-orders
 *
 * Adds 'expired' to the orders.status ENUM so the expiry job can
 * mark abandoned orders without hitting a DB constraint error.
 *
 * MySQL requires you to redefine the full ENUM when adding a value.
 * Adjust the list below if your current ENUM has different values.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('orders', 'status', {
      type: Sequelize.ENUM(
        'pending',
        'processing',
        'shipped',
        'in_transit',
        'delivered',
        'cancelled',
        'expired',     // ← new
      ),
      allowNull: false,
      defaultValue: 'pending',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('orders', 'status', {
      type: Sequelize.ENUM(
        'pending',
        'processing',
        'shipped',
        'in_transit',
        'delivered',
        'cancelled',
      ),
      allowNull: false,
      defaultValue: 'pending',
    });
  },
};