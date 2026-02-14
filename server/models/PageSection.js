export default (sequelize, DataTypes) => {
  const PageSection = sequelize.define('PageSection', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    pageId: { type: DataTypes.UUID, allowNull: false },
    section_type: { type: DataTypes.STRING(60), allowNull: false },
    display_order: { type: DataTypes.INTEGER, defaultValue: 0 },
    is_visible: { type: DataTypes.BOOLEAN, defaultValue: true },
    content: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    layout: { type: DataTypes.JSONB, defaultValue: {} },
    background_image_id: { type: DataTypes.UUID, allowNull: true },
    featured_media_ids: { type: DataTypes.ARRAY(DataTypes.UUID), defaultValue: [] },
    visibility_rules: { type: DataTypes.JSONB, defaultValue: {} },
  }, {
    tableName: 'page_sections',
    timestamps: false,
  });

  PageSection.associate = (models) => {
    PageSection.belongsTo(models.Page, { foreignKey: 'pageId', onDelete: 'CASCADE' });
    PageSection.belongsTo(models.Media, { as: 'BackgroundImage', foreignKey: 'backgroundImageId' });
  };

  return PageSection;
};