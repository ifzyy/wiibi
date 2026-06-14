'use strict';

/**
 * Creates promo_codes and adds discount / promo_code to orders.
 *
 * Orders snapshot the discount applied and the code used, so historical
 * orders keep their real totals even if the promo later changes or is deleted.
 * total_amount = items subtotal + delivery_fee − discount.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('promo_codes', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.literal('(UUID())'),
        primaryKey:   true,
      },
      code:        { type: Sequelize.STRING(40),  allowNull: false, unique: true },
      description: { type: Sequelize.STRING(200), allowNull: true },

      discount_type:  { type: Sequelize.ENUM('percentage', 'fixed'), allowNull: false, defaultValue: 'percentage' },
      discount_value: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      max_discount:   { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      min_order_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },

      usage_limit: { type: Sequelize.INTEGER, allowNull: true },
      used_count:  { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },

      starts_at:  { type: Sequelize.DATE, allowNull: true },
      expires_at: { type: Sequelize.DATE, allowNull: true },
      is_active:  { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },

      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addColumn('orders', 'discount', {
      type:         Sequelize.DECIMAL(12, 2),
      allowNull:    false,
      defaultValue: 0,
      after:        'delivery_fee',
    });
    await queryInterface.addColumn('orders', 'promo_code', {
      type:      Sequelize.STRING(40),
      allowNull: true,
      after:     'discount',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('orders', 'promo_code');
    await queryInterface.removeColumn('orders', 'discount');
    await queryInterface.dropTable('promo_codes');
  },
};
