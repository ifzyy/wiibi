'use strict';

export default (sequelize, DataTypes) => {
  const OrderItem = sequelize.define(
    'OrderItem',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      orderId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'order_id',
        references: { model: 'orders', key: 'id' },
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'product_id',
        references: { model: 'products', key: 'id' },
      },
      productName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'product_name',
        comment: 'Snapshot of product name at checkout — immutable',
      },
      productSlug: {
        type: DataTypes.STRING(280),
        allowNull: true,
        field: 'product_slug',
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 },
      },
      unitPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: 'unit_price',
        comment: 'Price locked at checkout — immutable',
      },
      totalPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: 'total_price',
      },
    },
    {
      tableName: 'order_items',
      underscored: true,
      paranoid: false,
      indexes: [
        { fields: ['order_id'] },
        { fields: ['product_id'] },
      ],
    }
  );

  OrderItem.associate = (models) => {
    OrderItem.belongsTo(models.Order,   { foreignKey: 'orderId',   as: 'order' });
    OrderItem.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
  };

  return OrderItem;
};