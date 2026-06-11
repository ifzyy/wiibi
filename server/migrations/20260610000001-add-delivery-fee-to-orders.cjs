'use strict';

/**
 * Adds delivery_fee to orders.
 *
 * The fee is snapshotted onto the order at checkout time from the
 * admin-configurable `delivery_fee` global setting, so historical orders
 * keep the fee they were actually charged when the admin later changes it.
 * total_amount = items subtotal + delivery_fee.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('orders', 'delivery_fee', {
      type:         Sequelize.DECIMAL(12, 2),
      allowNull:    false,
      defaultValue: 0,
      after:        'total_amount',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('orders', 'delivery_fee');
  },
};
