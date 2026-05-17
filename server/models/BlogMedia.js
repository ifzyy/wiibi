import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const BlogMedia = sequelize.define('BlogMedia', {
    id: {
      type:         DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey:   true,
      allowNull:    false,
    },
    blog_id: {
      type:      DataTypes.UUID,
      allowNull: false,
    },
    media_id: {
      type:      DataTypes.UUID,
      allowNull: false,
    },
    role: {
      type:         DataTypes.ENUM('main', 'gallery'),
      defaultValue: 'gallery',
      allowNull:    false,
    },
    display_order: {
      type:         DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
      allowNull:    false,
    },
    caption: {
      type:      DataTypes.STRING(500),
      allowNull: true,
    },
  }, {
    tableName:   'blog_media',
    underscored: true,
    timestamps:  false,  // no deleted_at column
    paranoid:    false,
    indexes: [
      { fields: ['blog_id'] },
      { fields: ['media_id'] },
      { fields: ['blog_id', 'media_id'], unique: true },
      { fields: ['role'] },
      { fields: ['display_order'] },
    ],
  });

  BlogMedia.associate = (models) => {
    BlogMedia.belongsTo(models.Blog,  { foreignKey: 'blog_id',  as: 'blog',  constraints: false });
    BlogMedia.belongsTo(models.Media, { foreignKey: 'media_id', as: 'media', constraints: false });
  };

  return BlogMedia;
};