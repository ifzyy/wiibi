'use strict';

/**
 * Migration: add return statuses to orders + manual_required to refunds
 *
 * Run BEFORE deploying ReturnService.js or the refund edge-case guards.
 * Safe to run on a live DB — MODIFY COLUMN on an ENUM is non-destructive
 * as long as you only add values, never remove existing ones.
 *
 * Sequelize CLI: npx sequelize-cli db:migrate
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add 'return_requested' and 'returned' to orders.status
    await queryInterface.changeColumn('orders', 'status', {
      type: Sequelize.ENUM(
        'pending',
        'processing',
        'shipped',
        'in_transit',
        'delivered',
        'cancelled',
        'return_requested',
        'returned'
      ),
      defaultValue: 'pending',
      allowNull: false,
    });

    // 2. Add 'manual_required' to refunds.status
    await queryInterface.changeColumn('refunds', 'status', {
      type: Sequelize.ENUM(
        'pending',
        'processing',
        'completed',
        'failed',
        'manual_required'
      ),
      defaultValue: 'pending',
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert — remove the new values
    // WARNING: any rows with the new status values will fail this rollback.

    await queryInterface.changeColumn('orders', 'status', {
      type: Sequelize.ENUM(
        'pending',
        'processing',
        'shipped',
        'in_transit',
        'delivered',
        'cancelled'
      ),
      defaultValue: 'pending',
      allowNull: false,
    });

    await queryInterface.changeColumn('refunds', 'status', {
      type: Sequelize.ENUM(
        'pending',
        'processing',
        'completed',
        'failed'
      ),
      defaultValue: 'pending',
      allowNull: false,
    });
  },
};