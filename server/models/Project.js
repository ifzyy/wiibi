'use strict';

export default (sequelize, DataTypes) => {
  const Project = sequelize.define('Project', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.ENUM('project', 'case_study'),
      allowNull: false,
      defaultValue: 'project',
    },
    year: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    overview: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    problem: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    solution: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    results: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    conclusion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    featuredImageId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'featured_image_id',
    },
    galleryImageIds: {
      type: DataTypes.JSON,
      defaultValue: [],
      field: 'gallery_image_ids',
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_featured',
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'display_order',
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_visible',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      field: 'updated_at',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'projects',
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['slug'], unique: true },
      { fields: ['type'] },
      { fields: ['is_featured'] },
      { fields: ['display_order'] },
      { fields: ['is_visible'] },
    ],
  });

Project.associate = (models) => {
    // Featured image (single)
    Project.belongsTo(models.Media, {
      foreignKey: 'featured_image_id',
      as: 'featuredImage',
    });

    // Gallery images (multiple) – using polymorphic relation in Media
    Project.hasMany(models.Media, {
      foreignKey: 'entity_id',
      constraints: false,
      scope: {
        entity_type: 'project',
        is_featured: false, // optional filter if you want to separate featured
      },
      as: 'galleryImages',
    });
  };

  return Project;
};