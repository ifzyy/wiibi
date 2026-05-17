'use strict';

export default (sequelize, DataTypes) => {
  const SolarSetting = sequelize.define('SolarSetting', {
    id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    key:         { type: DataTypes.STRING(80),  allowNull: false, unique: true },
    label:       { type: DataTypes.STRING(150), allowNull: false },
    value:       { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    unit:        { type: DataTypes.STRING(30), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    createdAt:   { type: DataTypes.DATE, field: 'created_at' },
    updatedAt:   { type: DataTypes.DATE, field: 'updated_at' },
  }, {
    tableName:   'solar_settings',
    underscored: true,
    paranoid:    false,
  });

  SolarSetting.associate = () => {};
  return SolarSetting;
};