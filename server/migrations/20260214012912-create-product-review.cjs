'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_reviews', {
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

      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },

      // ── Rating ────────────────────────────────────────────────────────────
      // MySQL ignores CHECK constraints before 8.0.16.
      // Use TINYINT UNSIGNED (0-255) + model-level validate: { min:1, max:5 }
      // as the enforcement layer instead.
      rating: {
        type: Sequelize.TINYINT.UNSIGNED,
        allowNull: false,
      },

      // ── Content ───────────────────────────────────────────────────────────
      title: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      body: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      // ── Author ────────────────────────────────────────────────────────────
      author: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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

    // ── Standard indexes ──────────────────────────────────────────────────────
    await queryInterface.addIndex('product_reviews', ['product_id'], { name: 'product_reviews_product_id_idx' });
    await queryInterface.addIndex('product_reviews', ['user_id'],    { name: 'product_reviews_user_id_idx' });
    await queryInterface.addIndex('product_reviews', ['rating'],     { name: 'product_reviews_rating_idx' });

    // ── One review per authenticated user per product ─────────────────────────
    // MySQL does NOT support partial indexes (WHERE clause) like PostgreSQL.
    //
    // A plain UNIQUE on (product_id, user_id) works correctly here because
    // MySQL treats NULL values as distinct in unique indexes — so two guest rows
    // with the same product_id and user_id = NULL are both allowed, while two
    // logged-in rows with the same product_id + user_id are correctly rejected.
    await queryInterface.addIndex(
      'product_reviews',
      ['product_id', 'user_id'],
      { name: 'unique_user_product_review', unique: true }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_reviews');
  },
};