'use strict';

/**
 * Adds payment_method to orders.
 *
 *  'online'      → paid via gateway (Paystack/mock) before fulfilment.
 *  'on_delivery' → Pay on Delivery; order is confirmed immediately, payment
 *                  collected by the delivery agent. Not allowed with a promo.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('orders', 'payment_method', {
      type:         Sequelize.ENUM('online', 'on_delivery'),
      allowNull:    false,
      defaultValue: 'online',
      after:        'payment_status',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('orders', 'payment_method');
  },
};
