'use strict';

/**
 * Migration: re-add 'expired' to orders.status
 *
 * Migration ...252-add-expired-to-orders added 'expired', but ...253-add-return-statuses
 * (which runs after it) redefined the whole ENUM for the return flow and dropped
 * 'expired' in the process. In MySQL, changeColumn on an ENUM replaces the full
 * value set, so the net result is an enum WITHOUT 'expired'.
 *
 * The abandoned-order expiry job (jobs/expireAbondonedOrders.js) sets
 * status='expired'. Without this value the UPDATE fails on a DB constraint, the
 * job's per-order transaction rolls back, and reserved stock is never released.
 *
 * This restores the full, correct set of statuses. Additive-only — safe on a
 * live DB.
 */

const FULL_ENUM = [
  'pending',
  'processing',
  'shipped',
  'in_transit',
  'delivered',
  'cancelled',
  'return_requested',
  'returned',
  'expired',
];

const WITHOUT_EXPIRED = FULL_ENUM.filter((s) => s !== 'expired');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('orders', 'status', {
      type:         Sequelize.ENUM(...FULL_ENUM),
      allowNull:    false,
      defaultValue: 'pending',
    });
  },

  async down(queryInterface, Sequelize) {
    // WARNING: any rows already set to 'expired' will block this rollback.
    await queryInterface.changeColumn('orders', 'status', {
      type:         Sequelize.ENUM(...WITHOUT_EXPIRED),
      allowNull:    false,
      defaultValue: 'pending',
    });
  },
};
