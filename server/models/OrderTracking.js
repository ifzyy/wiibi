'use strict';

export default (sequelize, DataTypes) => {
  const OrderTracking = sequelize.define(
    'OrderTracking',
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
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      updatedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'updated_by',
      },
      trackingNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'tracking_number',
      },
    },
    {
      tableName: 'order_tracking',
      underscored: true,
      paranoid: false,
      indexes: [
        { fields: ['order_id'] },
      ],
    }
  );

  OrderTracking.associate = (models) => {
    OrderTracking.belongsTo(models.Order, { foreignKey: 'orderId', as: 'order' });
  };

  return OrderTracking;
};