import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class ProjectMedia extends Model {
    static associate(models) {
      // Relations
      ProjectMedia.belongsTo(models.Project, {
        foreignKey: 'project_id',
        as: 'project',
        onDelete: 'CASCADE',
      });

      ProjectMedia.belongsTo(models.Media, {
        foreignKey: 'media_id',
        as: 'media',
        onDelete: 'CASCADE',
      });
    }
  }

  ProjectMedia.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      project_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id',
        },
      },

      media_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'media',
          key: 'id',
        },
      },

      role: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Role of this media in the project (gallery, featured, before, after, etc.)',
        validate: {
          notEmpty: true,
        },
      },

      display_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Order for rendering gallery items (drag & drop support)',
      },

      caption: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Optional override caption/alt text for this specific usage',
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },

      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'ProjectMedia',
      tableName: 'project_media',
      underscored: true,
      timestamps: true,
      paranoid: false, // no soft delete on junction table
      indexes: [
        // Fast lookup by project + order
        {
          fields: ['project_id', 'display_order'],
        },
        // Fast lookup by project + role
        {
          fields: ['project_id', 'role'],
        },
        // Fast reverse lookup (which projects use this media)
        {
          fields: ['media_id'],
        },
      ],
    }
  );

  return ProjectMedia;
};