'use strict';

export default (sequelize, DataTypes) => {
  const SolarAppliance = sequelize.define('SolarAppliance', {
    id:       { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name:     { type: DataTypes.STRING(150), allowNull: false },
    category: { type: DataTypes.STRING(80),  allowNull: false },
    icon:     { type: DataTypes.STRING(10),  allowNull: true  },

    wattsMin: {
      type:      DataTypes.FLOAT,
      allowNull: false,
      field:     'watts_min',
    },
    wattsMax: {
      type:      DataTypes.FLOAT,
      allowNull: false,
      field:     'watts_max',
      comment:   'Used in calculations',
    },
    defaultHours: {
      type:         DataTypes.FLOAT,
      allowNull:    false,
      defaultValue: 4,
      field:        'default_hours',
    },
    surgeMultiplier: {
      type:         DataTypes.FLOAT,
      allowNull:    false,
      defaultValue: 1.0,
      field:        'surge_multiplier',
    },
    isCritical: {
      type:         DataTypes.BOOLEAN,
      allowNull:    false,
      defaultValue: false,
      field:        'is_critical',
    },
    isActive: {
      type:         DataTypes.BOOLEAN,
      allowNull:    false,
      defaultValue: true,
      field:        'is_active',
    },
    sortOrder: {
      type:         DataTypes.INTEGER,
      allowNull:    false,
      defaultValue: 0,
      field:        'sort_order',
    },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  }, {
    tableName:  'solar_appliances',
    timestamps: true,
    paranoid:   false,
    // No underscored:true — all fields have explicit `field` mappings above
  });

  SolarAppliance.associate = () => {};
  return SolarAppliance;
};