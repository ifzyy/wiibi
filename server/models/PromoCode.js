'use strict';

/**
 * PromoCode — discount codes customers enter at checkout.
 *
 * Discount is applied to the cart SUBTOTAL (not delivery). Validation +
 * discount math live in PromoService and run server-side at checkout — the
 * client never sends a trusted discount amount.
 */
export default (sequelize, DataTypes) => {
  const PromoCode = sequelize.define('PromoCode', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },

    // Stored uppercase; matched case-insensitively at checkout.
    code: {
      type:      DataTypes.STRING(40),
      allowNull: false,
      unique:    true,
    },
    description: { type: DataTypes.STRING(200), allowNull: true },

    discountType: {
      type:         DataTypes.ENUM('percentage', 'fixed'),
      allowNull:    false,
      defaultValue: 'percentage',
      field:        'discount_type',
    },
    // percentage → 0–100 ; fixed → naira amount
    discountValue: {
      type:      DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field:     'discount_value',
      validate:  { min: 0 },
    },
    // Optional cap on a percentage discount (₦). NULL = uncapped.
    maxDiscount: {
      type:      DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field:     'max_discount',
    },
    // Minimum cart subtotal required to use the code (₦).
    minOrderAmount: {
      type:         DataTypes.DECIMAL(12, 2),
      allowNull:    false,
      defaultValue: 0,
      field:        'min_order_amount',
    },

    // Total redemptions allowed across all customers. NULL = unlimited.
    usageLimit: {
      type:      DataTypes.INTEGER,
      allowNull: true,
      field:     'usage_limit',
    },
    usedCount: {
      type:         DataTypes.INTEGER,
      allowNull:    false,
      defaultValue: 0,
      field:        'used_count',
    },

    startsAt:  { type: DataTypes.DATE, allowNull: true, field: 'starts_at'  },
    expiresAt: { type: DataTypes.DATE, allowNull: true, field: 'expires_at' },

    isActive: {
      type:         DataTypes.BOOLEAN,
      allowNull:    false,
      defaultValue: true,
      field:        'is_active',
    },

    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  }, {
    tableName:  'promo_codes',
    timestamps: true,
    paranoid:   false,   // global default is paranoid:true; promo codes hard-delete
  });

  return PromoCode;
};
