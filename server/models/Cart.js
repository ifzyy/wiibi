'use strict';

export default (sequelize, DataTypes) => {
  const Cart = sequelize.define(
    'Cart',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'user_id',
        references: { model: 'users', key: 'id' },
      },
      guestToken: {
        type: DataTypes.STRING(128),
        allowNull: true,
        unique: true,
        field: 'guest_token',
      },
      status: {
        type: DataTypes.ENUM('active', 'checked_out', 'abandoned', 'saved'),
        defaultValue: 'active',
      },
    },
    {
      tableName: 'carts',
      underscored: true,
      paranoid: false,
      indexes: [
        { fields: ['user_id'] },
        { fields: ['guest_token'] },
        { fields: ['status'] },
      ],
    }
  );

  Cart.associate = (models) => {
    Cart.belongsTo(models.User,     { foreignKey: 'userId', as: 'user' });
    Cart.hasMany(models.CartItem,   { foreignKey: 'cartId', as: 'items', onDelete: 'CASCADE' });
  };

  return Cart;
};