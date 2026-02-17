"use strict";

export default (sequelize, DataTypes) => {
  const Media = sequelize.define(
    "Media",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      url: { type: DataTypes.STRING(500), allowNull: false },
      optimized_url: { type: DataTypes.STRING(500), allowNull: true },
      thumbnail_url: { type: DataTypes.STRING(500), allowNull: true },
      filename: { type: DataTypes.STRING(255), allowNull: false },
      mime_type: { type: DataTypes.STRING(100), allowNull: false },
      type: {
        type: DataTypes.ENUM("image", "video", "document", "audio"),
        defaultValue: "image",
      },
      size_bytes: { type: DataTypes.INTEGER, allowNull: false },
      width: { type: DataTypes.INTEGER, allowNull: true },
      height: { type: DataTypes.INTEGER, allowNull: true },
      alt_text: { type: DataTypes.STRING(255), allowNull: true },
      title: { type: DataTypes.STRING(255), allowNull: true },
      caption: { type: DataTypes.TEXT, allowNull: true },
      uploaded_by: { type: DataTypes.UUID, allowNull: true },
      entity_type: { type: DataTypes.STRING(50), allowNull: true },
      entity_id: { type: DataTypes.UUID, allowNull: true },
      is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },
      display_order: { type: DataTypes.INTEGER, defaultValue: 0 },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ),
      },
    },
    {
      tableName: "media",
      underscored: true,
      paranoid: false,
    },
  );

  Media.associate = (models) => {
    Media.belongsTo(models.User, { foreignKey: "uploaded_by", as: "uploader" });
  };

  return Media;
};
