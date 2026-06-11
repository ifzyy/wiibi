'use strict';

/**
 * Optional per-product delivery fee override.
 *
 * NULL  → product uses the global `delivery_fee` setting.
 * value → bulky/special items (e.g. inverters) can charge their own rate.
 *
 * Order rule (see OrderService.getDeliveryFee): if any cart item has a
 * product-specific fee, the order is charged the HIGHEST product fee in the
 * cart (one delivery, priced by the bulkiest item); otherwise the global
 * default applies.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('products', 'delivery_fee', {
      type:      Sequelize.DECIMAL(12, 2),
      allowNull: true,
      after:     'stock',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('products', 'delivery_fee');
  },
};
