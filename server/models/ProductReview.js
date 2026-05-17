'use strict';

export default (sequelize, DataTypes) => {
  const ProductReview = sequelize.define(
    'ProductReview',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'product_id',
        references: { model: 'products', key: 'id' },
      },
      userId: {
        // Null for guest reviews.
        type: DataTypes.UUID,
        allowNull: true,
        field: 'user_id',
        references: { model: 'users', key: 'id' },
      },

      // ── Rating ────────────────────────────────────────────────────────────
      rating: {
        // 1–5. Drives star display, breakdown bars, and average computation.
        type: DataTypes.SMALLINT,
        allowNull: false,
        validate: { min: 1, max: 5 },
      },

      // ── Content ───────────────────────────────────────────────────────────
      title: {
        // Review headline shown in bold on the card.
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      body: {
        // Full review text shown in smaller gray type.
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // ── Author ────────────────────────────────────────────────────────────
      author: {
        // Snapshot of display name at review time (decoupled from user record).
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: { notEmpty: true },
      },
      verified: {
        // True when the reviewer has a confirmed order for this product.
        // Shown as a green dot beside the author name.
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'product_reviews',
      underscored: true,
      paranoid: false,
      indexes: [
        { fields: ['product_id'] },
        { fields: ['user_id'] },
        { fields: ['rating'] },
        // One review per user per product (optional — remove if guests can re-review)
        {
          unique: true,
          fields: ['product_id', 'user_id'],
          where: { user_id: { [Symbol.for('ne')]: null } },
          name: 'unique_user_product_review',
        },
      ],
    }
  );

  ProductReview.associate = (models) => {
    ProductReview.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product',
    });
    ProductReview.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  };

  return ProductReview;
};