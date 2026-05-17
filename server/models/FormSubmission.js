import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class FormSubmission extends Model {
    static associate(models) {
      FormSubmission.belongsTo(models.Form, {
        foreignKey: 'form_id',
        as: 'form',
      });
    }
  }

  FormSubmission.init(
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
      // Stores the full key-value answers as JSON, e.g.:
      // { "service_type": "Installation service", "property_type": "Commercial", ... }
      data: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      submitted_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'User ID if authenticated, null if guest',
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'reviewed', 'resolved'),
        defaultValue: 'pending',
      },
    },
    {
      sequelize,
      modelName: 'FormSubmission',
      tableName: 'form_submissions',
      underscored: true,
      timestamps: true,
    }
  );

  return FormSubmission;
};