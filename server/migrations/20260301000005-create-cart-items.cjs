'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cart_items', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.literal('(UUID())'),
        primaryKey:   true,
        allowNull:    false,
      },
      cart_id: {
        type:       Sequelize.UUID,
        allowNull:  false,
        references: { model: 'carts', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'CASCADE',
      },
      product_id: {
        type:       Sequelize.INTEGER,
        allowNull:  false,
        references: { model: 'products', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'CASCADE',
      },
      quantity: {
        type:         Sequelize.INTEGER,
        allowNull:    false,
        defaultValue: 1,
      },
      unit_price: {
        type:      Sequelize.DECIMAL(12, 2),
        allowNull: false,
        comment:   'Price captured at the time item was added — not live price',
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

    await queryInterface.addIndex('cart_items', ['cart_id']);
    await queryInterface.addIndex('cart_items', ['product_id']);
    // Prevent duplicate product rows in the same cart
    await queryInterface.addIndex('cart_items', ['cart_id', 'product_id'], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('cart_items');
  },
};
