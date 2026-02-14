export default (sequelize, DataTypes) => {
  const Page = sequelize.define('Page', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    slug: { type: DataTypes.STRING(250), allowNull: false, unique: true },
    contentType: { type: DataTypes.ENUM('static','blog_post','blog_index','collection'), defaultValue: 'static' },
    status: { type: DataTypes.ENUM('draft','published','scheduled','archived'), defaultValue: 'draft' },
    publishAt: { type: DataTypes.DATE, allowNull: true },
    excerpt: { type: DataTypes.TEXT, allowNull: true },
    featuredImageId: { type: DataTypes.UUID, allowNull: true },
    authorId: { type: DataTypes.UUID, allowNull: true },
    metaTitle: { type: DataTypes.STRING(200), allowNull: true },
    metaDescription: { type: DataTypes.STRING(320), allowNull: true },
    ogImageId: { type: DataTypes.UUID, allowNull: true },
    canonicalUrl: { type: DataTypes.STRING(500), allowNull: true },
    isIndexed: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, {
    tableName: 'pages',
    timestamps: false,
  });

  Page.associate = (models) => {
    Page.hasMany(models.PageSection, { foreignKey: 'pageId', onDelete: 'CASCADE' });
    Page.belongsTo(models.Media, { as: 'FeaturedImage', foreignKey: 'featuredImageId' });
    Page.belongsTo(models.Media, { as: 'OgImage', foreignKey: 'ogImageId' });
  };

  return Page;
};