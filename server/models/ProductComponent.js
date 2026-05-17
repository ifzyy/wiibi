'use strict';

export default (sequelize, DataTypes) => {
  const ProductComponent = sequelize.define(
    'ProductComponent',
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

      // ── Identity ─────────────────────────────────────────────────────────
      name: {
        // e.g. "SRNE RIC 1KW Uni-directional Inverter"
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: { notEmpty: true },
      },
      qty: {
        // Shown as "1 Unit" / "6 Units" badge in Description tab.
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: { min: 1 },
      },

      // ── Media ─────────────────────────────────────────────────────────────
      image: {
        // Component image shown in the Description tab component list.
        // Null renders a placeholder ImageOff icon.
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // ── Content ───────────────────────────────────────────────────────────
      description: {
        // Plain-text description rendered inside a shaded card.
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // ── Specifications ────────────────────────────────────────────────────
      specs: {
        // [{ label: "Rated Battery Voltage", value: "12 VDC" }, ...]
        // Rendered as a named spec table in the System Specification tab.
        // Each component gets its own section headed by component.name.
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
      },

      // ── Ordering ──────────────────────────────────────────────────────────
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'sort_order',
      },
    },
    {
      tableName: 'product_components',
      underscored: true,
      paranoid: false,
      indexes: [
        { fields: ['product_id'] },
        { fields: ['product_id', 'sort_order'] },
      ],
    }
  );

  ProductComponent.associate = (models) => {
    ProductComponent.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product',
    });
  };

  return ProductComponent;
};