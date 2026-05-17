'use strict';

export default (sequelize, DataTypes) => {
  const Order = sequelize.define(
    'Order',
    {
      id: {
        type:         DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey:   true,
      },

      userId: {
        type:       DataTypes.UUID,
        allowNull:  true,
        field:      'user_id',
        references: { model: 'users', key: 'id' },
      },

      guestEmail: {
        type:      DataTypes.STRING(255),
        allowNull: true,
        field:     'guest_email',
        validate:  { isEmail: true },
      },

      guestToken: {
        type:      DataTypes.STRING(100),
        allowNull: true,
        field:     'guest_token',
      },

      orderNumber: {
        type:      DataTypes.STRING(50),
        allowNull: false,
        unique:    true,
        field:     'order_number',
      },

      // FIXED: added 'return_requested' and 'returned' for the return flow
      status: {
        type: DataTypes.ENUM(
          'pending',
          'processing',
          'shipped',
          'in_transit',
          'delivered',
          'cancelled',
          'return_requested',
          'returned'
        ),
        defaultValue: 'pending',
      },

      paymentStatus: {
        type: DataTypes.ENUM(
          'unpaid',
          'paid',
          'partially_refunded',
          'refunded',
          'failed'
        ),
        defaultValue: 'unpaid',
        field:        'payment_status',
      },

      totalAmount: {
        type:      DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field:     'total_amount',
      },

      currency: {
        type:         DataTypes.STRING(3),
        defaultValue: 'NGN',
      },

      shippingAddress: {
        type:      DataTypes.JSON,
        allowNull: true,
        field:     'shipping_address',
      },

      trackingNumber: {
        type:      DataTypes.STRING(100),
        allowNull: true,
        field:     'tracking_number',
      },

      paymentReference: {
        type:      DataTypes.STRING(200),
        allowNull: true,
        field:     'payment_reference',
      },

      idempotencyKey: {
        type:      DataTypes.STRING(128),
        allowNull: true,
        unique:    true,
        field:     'idempotency_key',
      },

      notes: {
        type:      DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName:   'orders',
      underscored: true,
      paranoid:    false,
      indexes: [
        { fields: ['user_id'] },
        { unique: true, fields: ['order_number'] },
        { fields: ['status'] },
        { fields: ['payment_status'] },
        { fields: ['payment_reference'] },
        { fields: ['guest_token'] },
        { fields: ['guest_email'] },
        { unique: true, fields: ['idempotency_key'] },
      ],
    }
  );

  Order.associate = (models) => {
    Order.belongsTo(models.User,        { foreignKey: 'userId',  as: 'user'     });
    Order.hasMany(models.OrderItem,     { foreignKey: 'orderId', as: 'items',    onDelete: 'CASCADE' });
    Order.hasMany(models.OrderTracking, { foreignKey: 'orderId', as: 'timeline', onDelete: 'CASCADE' });
    Order.hasMany(models.Refund,        { foreignKey: 'orderId', as: 'refunds'  });
  };

  return Order;
};