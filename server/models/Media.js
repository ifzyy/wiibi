export default (sequelize, DataTypes) => {
  const Media = sequelize.define('Media', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    url: { type: DataTypes.STRING(500), allowNull: false },
    filename: { type: DataTypes.STRING(255), allowNull: false },
    mimeType: { type: DataTypes.STRING(100), allowNull: false },
    type: { type: DataTypes.ENUM('image','video','document','audio'), defaultValue: 'image' },
    sizeBytes: { type: DataTypes.INTEGER, allowNull: false },
    width: { type: DataTypes.INTEGER, allowNull: true },
    height: { type: DataTypes.INTEGER, allowNull: true },
    altText: { type: DataTypes.STRING(255), allowNull: true },
    title: { type: DataTypes.STRING(255), allowNull: true },
    caption: { type: DataTypes.TEXT, allowNull: true },
  }, {
    tableName: 'media',
    timestamps: false,
  });

  return Media;
};