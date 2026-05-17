import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class FormField extends Model {
    static associate(models) {
      FormField.belongsTo(models.Form, {
        foreignKey: 'form_id',
        as: 'form',
      });
      FormField.hasMany(models.FieldOption, {
        foreignKey: 'field_id',
        as: 'options',
        onDelete: 'CASCADE',
      });
    }
  }

  FormField.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      form_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'forms', key: 'id' },
      },
      label: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      field_type: {
        type: DataTypes.ENUM('input', 'dropdown', 'textarea', 'email', 'phone'),
        allowNull: false,
        defaultValue: 'input',
      },
      placeholder: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      is_required: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Controls display order',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      paranoid: false,
      modelName: 'FormField',
      tableName: 'form_fields',
      underscored: true,
      timestamps: true,
    }
  );

  return FormField;
};