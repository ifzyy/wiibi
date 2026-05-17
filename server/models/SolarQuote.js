'use strict';

export default (sequelize, DataTypes) => {
  const SolarQuote = sequelize.define('SolarQuote', {
    id: {
      type:         DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey:   true,
    },

    // ── User linkage ───────────────────────────────────────────────────────
    userId: {
      type:      DataTypes.INTEGER,
      allowNull: true,
      field:     'user_id',
    },

    // ── Contact info ───────────────────────────────────────────────────────
    contactName: {
      type:      DataTypes.STRING(150),
      allowNull: true,
      field:     'contact_name',
    },
    contactEmail: {
      type:      DataTypes.STRING(255),
      allowNull: true,
      field:     'contact_email',
    },
    contactPhone: {
      type:      DataTypes.STRING(30),
      allowNull: true,
      field:     'contact_phone',
    },

    // ── Calculator inputs ──────────────────────────────────────────────────
    location: {
      type:      DataTypes.STRING(80),
      allowNull: false,
    },
    autonomyDays: {
      type:      DataTypes.FLOAT,
      allowNull: false,
      field:     'autonomy_days',
    },
    systemVoltage: {
      type:         DataTypes.INTEGER,
      allowNull:    false,
      defaultValue: 48,
      field:        'system_voltage',
    },
    appliancesSnapshot: {
      type:      DataTypes.JSON,
      allowNull: false,
      field:     'appliances_snapshot',
    },

    // ── Calculated metrics ─────────────────────────────────────────────────
    dailyWh: {
      type:      DataTypes.FLOAT,
      allowNull: false,
      field:     'daily_wh',
    },
    adjustedWh: {
      type:      DataTypes.FLOAT,
      allowNull: false,
      field:     'adjusted_wh',
    },
    peakWatts: {
      type:      DataTypes.FLOAT,
      allowNull: false,
      field:     'peak_watts',
    },
    grossWp: {
      type:      DataTypes.FLOAT,
      allowNull: false,
      field:     'gross_wp',
    },
    capacityAh: {
      type:      DataTypes.FLOAT,
      allowNull: false,
      field:     'capacity_ah',
    },
    inverterKva: {
      type:      DataTypes.FLOAT,
      allowNull: false,
      field:     'inverter_kva',
    },
    chargeCtrlAmpere: {
      type:      DataTypes.INTEGER,
      allowNull: false,
      field:     'charge_ctrl_ampere',
    },

    // ── Packages ───────────────────────────────────────────────────────────
    packages: {
      type:      DataTypes.JSON,
      allowNull: false,
    },
    selectedTier: {
      type:         DataTypes.ENUM('basic', 'standard', 'premium'),
      allowNull:    false,
      defaultValue: 'standard',
      field:        'selected_tier',
    },
    selectedTotal: {
      type:      DataTypes.DECIMAL(14, 2),
      allowNull: false,
      field:     'selected_total',
    },

    // ── ROI inputs ─────────────────────────────────────────────────────────
    genCostPerHour: {
      type:         DataTypes.DECIMAL(10, 2),
      allowNull:    false,
      defaultValue: 2000.00,
      field:        'gen_cost_per_hour',
    },
    genHoursPerDay: {
      type:         DataTypes.INTEGER,
      allowNull:    false,
      defaultValue: 8,
      field:        'gen_hours_per_day',
    },

    // ── Admin ──────────────────────────────────────────────────────────────
    status: {
      type:         DataTypes.ENUM('draft', 'sent', 'accepted', 'expired'),
      allowNull:    false,
      defaultValue: 'draft',
    },
    expiresAt: {
      type:      DataTypes.DATE,
      allowNull: true,
      field:     'expires_at',
    },
    adminNotes: {
      type:      DataTypes.TEXT,
      allowNull: true,
      field:     'admin_notes',
    },

    createdAt: {
      type:  DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type:  DataTypes.DATE,
      field: 'updated_at',
    },
    deletedAt: {
      type:      DataTypes.DATE,
      allowNull: true,
      field:     'deleted_at',
    },
  }, {
    tableName:   'solar_quotes',
    underscored: true,
    paranoid:    true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['contact_email'] },
      { fields: ['created_at'] },
    ],
  });

  SolarQuote.associate = (models) => {
    SolarQuote.belongsTo(models.User, {
      foreignKey: 'user_id',
      as:         'user',
    });
  };

  return SolarQuote;
};