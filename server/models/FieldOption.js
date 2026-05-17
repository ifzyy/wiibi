import { Model, DataTypes } from 'sequelize';

// No top-level init: model definition occurs when imported by models/index.js
export default (sequelize) => {
  class FieldOption extends Model {
    static associate(models) {
      FieldOption.belongsTo(models.FormField, {
        foreignKey: 'field_id',
        as: 'field',
      });
    }
  }

  FieldOption.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      field_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'form_fields', key: 'id' },
      },
      label: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      value: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      paranoid: false,
      modelName: 'FieldOption',
      tableName: 'field_options',
      underscored: true,
      timestamps: true,
    }
  );

  return FieldOption;
};