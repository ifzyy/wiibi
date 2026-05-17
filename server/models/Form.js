import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class Form extends Model {
    static associate(models) {
      Form.hasMany(models.FormField, {
        foreignKey: 'form_id',
        as: 'fields',
        onDelete: 'CASCADE',
      });
      Form.hasMany(models.FormSubmission, {
        foreignKey: 'form_id',
        as: 'submissions',
        onDelete: 'CASCADE',
      });
    }
  }

  Form.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Admin user ID',
      },
    },
    {
      sequelize,
      modelName: 'Form',
      paranoid: false,
      tableName: 'forms',
      underscored: true,
      timestamps: true,
    }
  );

  return Form;
};