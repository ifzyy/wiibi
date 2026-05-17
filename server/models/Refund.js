import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Refund = sequelize.define(
    'Refund',
    {
      id: {
        type:         DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey:   true,
      },

      // No `field:` needed — underscored: true maps orderId → order_id automatically
      orderId: {
        type:      DataTypes.UUID,
        allowNull: false,
      },

      amount: {
        type:      DataTypes.DECIMAL(12, 2),
        allowNull: false,
        get() {
          const raw = this.getDataValue('amount');
          return raw == null ? null : parseFloat(raw);
        },
      },

      currency: {
        type:         DataTypes.STRING(3),
        defaultValue: 'NGN',
        allowNull:    false,
      },

      reason: {
        type:      DataTypes.STRING(500),
        allowNull: true,
      },

      method: {
        type: DataTypes.ENUM(
          'Paystack',
          'Bank Transfer',
          'Cash',
          'Flutterwave',
          'Credit Note',
        ),
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM(
          'pending',
          'processing',
          'completed',
          'failed',
          'manual_required',
        ),
        defaultValue: 'pending',
        allowNull:    false,
      },

      // No `field:` — underscored: true maps gatewayReference → gateway_reference
      gatewayReference: {
        type:      DataTypes.STRING(200),
        allowNull: true,
      },

      // No `field:` — maps paymentReference → payment_reference
      paymentReference: {
        type:      DataTypes.STRING(200),
        allowNull: true,
      },

      // No `field:` — maps processedBy → processed_by
      processedBy: {
        type:      DataTypes.UUID,
        allowNull: true,
      },

      // No `field:` — maps processedAt → processed_at
      processedAt: {
        type:      DataTypes.DATE,
        allowNull: true,
      },

      // No `field:` — maps failureReason → failure_reason
      failureReason: {
        type:      DataTypes.STRING(500),
        allowNull: true,
      },
    },
    {
      tableName:   'refunds',
      underscored: true,   // ← THE MISSING LINE: maps ALL camelCase attrs → snake_case columns
      paranoid:    false,
      timestamps:  true,   // createdAt → created_at, updatedAt → updated_at (also via underscored)
      indexes: [
        { fields: ['order_id'] },
        { fields: ['status'] },
        { fields: ['gateway_reference'] },
        { fields: ['processed_by'] },
      ],
    },
  );

  Refund.associate = (models) => {
    Refund.belongsTo(models.Order, {
      foreignKey: 'orderId',  // camelCase attr name — Sequelize resolves to order_id in SQL
      as:         'order',
    });

    Refund.belongsTo(models.User, {
      foreignKey: 'processedBy',  // → processed_by
      as:         'processor',
    });
  };

  return Refund;
};