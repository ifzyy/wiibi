import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const BlogTag = sequelize.define('BlogTag', {
    blog_id: {
      type:       DataTypes.UUID,
      allowNull:  false,
      primaryKey: true,
    },
    tag_id: {
      type:       DataTypes.UUID,
      allowNull:  false,
      primaryKey: true,
    },
  }, {
    tableName:   'blog_tags',
    underscored: true,
    timestamps:  false,  // no deleted_at column
    paranoid:    false,
    indexes: [
      { fields: ['blog_id'] },
      { fields: ['tag_id'] },
    ],
  });

  BlogTag.associate = (models) => {
    BlogTag.belongsTo(models.Blog, { foreignKey: 'blog_id', as: 'blog', constraints: false });
    BlogTag.belongsTo(models.Tag,  { foreignKey: 'tag_id',  as: 'tag',  constraints: false });
  };

  return BlogTag;
};