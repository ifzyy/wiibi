'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_items', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.literal('(UUID())'),
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
      product_id: {
        type:       Sequelize.INTEGER,
        allowNull:  true,              // nullable — product may be deleted later
        references: { model: 'products', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'SET NULL',
      },
      product_name: {
        type:      Sequelize.STRING(255),
        allowNull: false,
        comment:   'Snapshot at checkout — never changes even if product is renamed',
      },
      product_slug: {
        type:      Sequelize.STRING(280),
        allowNull: true,
      },
      quantity: {
        type:      Sequelize.INTEGER,
        allowNull: false,
      },
      unit_price: {
        type:      Sequelize.DECIMAL(12, 2),
        allowNull: false,
        comment:   'Price locked at checkout — immutable',
      },
      total_price: {
        type:      Sequelize.DECIMAL(12, 2),
        allowNull: false,
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

    await queryInterface.addIndex('order_items', ['order_id']);
    await queryInterface.addIndex('order_items', ['product_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('order_items');
  },
};
