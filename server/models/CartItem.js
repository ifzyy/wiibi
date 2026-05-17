'use strict';

export default (sequelize, DataTypes) => {
  const CartItem = sequelize.define(
    'CartItem',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      cartId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'cart_id',
        references: { model: 'carts', key: 'id' },
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'product_id',
        references: { model: 'products', key: 'id' },
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: { min: 1 },
      },
      unitPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: 'unit_price',
        comment: 'Price captured at the time the item was added to cart',
      },
    },
    {
      tableName: 'cart_items',
      underscored: true,
      paranoid: false,
      indexes: [
        { fields: ['cart_id'] },
        { fields: ['product_id'] },
        { unique: true, fields: ['cart_id', 'product_id'] },
      ],
    }
  );

  CartItem.associate = (models) => {
    CartItem.belongsTo(models.Cart,    { foreignKey: 'cartId',    as: 'cart' });
    CartItem.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
  };

  return CartItem;
};