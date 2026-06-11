'use strict';

/**
 * Admin-editable estimated delivery date, shown to the customer on the
 * order page ("Expected") and order cards.
 *
 * Defaulted at checkout: ~7 days for normal items, ~30 days when the order
 * contains a full system package (engineer survey + installation). Admins
 * adjust it from the order management modal as the real schedule firms up.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('orders', 'expected_delivery', {
      type:      Sequelize.DATEONLY,
      allowNull: true,
      after:     'delivery_fee',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('orders', 'expected_delivery');
  },
};
