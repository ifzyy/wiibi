import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class PageSectionMedia extends Model {
    static associate(models) {
      // Relations
      PageSectionMedia.belongsTo(models.PageSection, {
        foreignKey: 'page_section_id',
        as: 'section',
        onDelete: 'CASCADE',
      });

      PageSectionMedia.belongsTo(models.Media, {
        foreignKey: 'media_id',
        as: 'media',
        onDelete: 'CASCADE',
      });
    }
  }

  PageSectionMedia.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      page_section_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'page_sections',
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
        comment: 'Role of this media in the section (hero, background, gallery, cta, stats-icon, etc.)',
       
      },

      display_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Order for rendering (drag & drop support)',
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
      modelName: 'PageSectionMedia',
      tableName: 'page_section_media',
      underscored: true,
      timestamps: true,
      paranoid: false, // no soft delete on junction table
      indexes: [
        // For fast lookup by section + order
        {
          fields: ['page_section_id', 'display_order'],
        },
        // For fast lookup by section + role
        {
          fields: ['page_section_id', 'role'],
        },
        // For fast lookup by media (reverse query)
        {
          fields: ['media_id'],
        },
      ],
    }
    
  );
  PageSectionMedia.associate = (models) => {
    PageSectionMedia.belongsTo(models.PageSection, {
      foreignKey: 'page_section_id',
      as: 'section',
      onDelete: 'CASCADE',
    });

    PageSectionMedia.belongsTo(models.Media, {
      foreignKey: 'media_id',
      as: 'media',
      onDelete: 'CASCADE',
    });}

  return PageSectionMedia;
};