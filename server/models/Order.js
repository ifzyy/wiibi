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

      // 'return_requested'/'returned' for the return flow;
      // 'expired' is set by the abandoned-order expiry job.
      status: {
        type: DataTypes.ENUM(
          'pending',
          'processing',
          'shipped',
          'in_transit',
          'delivered',
          'cancelled',
          'return_requested',
          'returned',
          'expired'
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

      // 'online' → paid via gateway before fulfilment.
      // 'on_delivery' → confirmed immediately, payment collected on delivery.
      paymentMethod: {
        type:         DataTypes.ENUM('online', 'on_delivery'),
        allowNull:    false,
        defaultValue: 'online',
        field:        'payment_method',
      },

      totalAmount: {
        type:      DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field:     'total_amount',
      },

      // Snapshot of the admin-configured delivery fee at checkout time.
      // totalAmount already includes it: total = items subtotal + deliveryFee − discount.
      deliveryFee: {
        type:         DataTypes.DECIMAL(12, 2),
        allowNull:    false,
        defaultValue: 0,
        field:        'delivery_fee',
      },

      // Promo discount applied at checkout + the code used. Snapshotted so a
      // historical order keeps its real total if the promo later changes.
      discount: {
        type:         DataTypes.DECIMAL(12, 2),
        allowNull:    false,
        defaultValue: 0,
      },
      promoCode: {
        type:      DataTypes.STRING(40),
        allowNull: true,
        field:     'promo_code',
      },

      // Estimated delivery date shown to the customer ("Expected"). Defaulted
      // at checkout (7d normal / 30d for system packages), admin-editable from
      // the order management modal.
      expectedDelivery: {
        type:      DataTypes.DATEONLY,
        allowNull: true,
        field:     'expected_delivery',
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