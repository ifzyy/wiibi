'use strict';

export default (sequelize, DataTypes) => {
  const SolarLead = sequelize.define('SolarLead', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },

    // Identity
    guestToken: { type: DataTypes.STRING(64),  allowNull: true, field: 'guest_token' },
    userId:     { type: DataTypes.INTEGER,      allowNull: true, field: 'user_id'    },

    // Contact
    name:  { type: DataTypes.STRING(150), allowNull: false },
    phone: { type: DataTypes.STRING(30),  allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: true  },

    // Calculator inputs
    location: { type: DataTypes.STRING(80), allowNull: false },
    autonomyHours: {
      type:      DataTypes.INTEGER,
      allowNull: false,
      field:     'autonomy_hours',
    },
    batteryType: {
      type:      DataTypes.ENUM('lithium', 'tubular', 'dry-cell'),
      allowNull: false,
      field:     'battery_type',
    },
    homeType: {
      type:      DataTypes.ENUM('apartment', 'duplex', 'bungalow', 'office', 'other'),
      allowNull: true,
      field:     'home_type',
    },
    criticalLoadsOnly: {
      type:         DataTypes.BOOLEAN,
      allowNull:    false,
      defaultValue: false,
      field:        'critical_loads_only',
    },
    appliancesSnapshot: {
      type:      DataTypes.JSON,
      allowNull: false,
      field:     'appliances_snapshot',
    },

    // Sizing output + full recommendation — snapshotted at submission
    sizingSnapshot: {
      type:      DataTypes.JSON,
      allowNull: false,
      field:     'sizing_snapshot',
    },
    recommendationSnapshot: {
      type:      DataTypes.JSON,
      allowNull: false,
      field:     'recommendation_snapshot',
    },

    // Chosen tier
    chosenTier: {
      type:         DataTypes.ENUM('sufficient', 'recommended', 'overkill'),
      allowNull:    false,
      defaultValue: 'recommended',
      field:        'chosen_tier',
    },
    chosenTotal: {
      type:      DataTypes.DECIMAL(14, 2),
      allowNull: false,
      field:     'chosen_total',
    },

    // Lead origin
    origin: {
      type:         DataTypes.ENUM('add_to_cart', 'request_quote'),
      allowNull:    false,
      defaultValue: 'request_quote',
    },

    // CRM
    status: {
      type:         DataTypes.ENUM('new', 'contacted', 'converted'),
      allowNull:    false,
      defaultValue: 'new',
    },
    adminNotes: {
      type:      DataTypes.TEXT,
      allowNull: true,
      field:     'admin_notes',
    },

    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
  }, {
    tableName:  'solar_leads',
    timestamps: true,
    paranoid:   true,
  });

  SolarLead.associate = (models) => {
    SolarLead.belongsTo(models.User, {
      foreignKey: 'user_id',
      as:         'user',
    });
  };

  return SolarLead;
};