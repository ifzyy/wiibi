'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_components', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      // ── Identity ──────────────────────────────────────────────────────────
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      qty: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },

      // ── Media ─────────────────────────────────────────────────────────────
      image: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      // ── Content ───────────────────────────────────────────────────────────
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      // ── Specifications ────────────────────────────────────────────────────
      specs: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
      },

      // ── Ordering ──────────────────────────────────────────────────────────
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex(
      'product_components',
      ['product_id'],
      { name: 'product_components_product_id_idx' }
    );

    await queryInterface.addIndex(
      'product_components',
      ['product_id', 'sort_order'],
      { name: 'product_components_product_id_sort_order_idx' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_components');
  },
};