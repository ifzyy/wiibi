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
      url:           { type: DataTypes.STRING(500), allowNull: false },
      optimized_url: { type: DataTypes.STRING(500), allowNull: true },
      thumbnail_url: { type: DataTypes.STRING(500), allowNull: true },
      filename:      { type: DataTypes.STRING(255), allowNull: true },
      mime_type:     { type: DataTypes.STRING(100), allowNull: false },
      type: {
        type: DataTypes.ENUM("image", "video", "document", "audio"),
        defaultValue: "image",
      },
      size_bytes:    { type: DataTypes.INTEGER,     allowNull: true },
      width:         { type: DataTypes.INTEGER,     allowNull: true },
      height:        { type: DataTypes.INTEGER,     allowNull: true },
      alt_text:      { type: DataTypes.STRING(255), allowNull: true },
      title:         { type: DataTypes.STRING(255), allowNull: true },
      caption:       { type: DataTypes.TEXT,        allowNull: true },
      uploaded_by:   { type: DataTypes.UUID,        allowNull: true },
      entity_type:   { type: DataTypes.STRING(50),  allowNull: true },

      // ── entity_id ────────────────────────────────────────────────────────
      // Changed from UUID → STRING(255) so this column can reference any
      // entity regardless of its PK type:
      //   • Products   → INTEGER  stored as "1", "2", "42"
      //   • Blogs, Testimonials, etc. → UUID stored as "3f2504e0-..."
      // The migration  XXXXXXXXXXXXXX-change-media-entity-id-to-string.js
      // applies the matching ALTER COLUMN on the DB side.
      entity_id:     { type: DataTypes.STRING(255), allowNull: true },

      is_featured:   { type: DataTypes.BOOLEAN, defaultValue: false },
      display_order: { type: DataTypes.INTEGER, defaultValue: 0 },
      is_external:   { type: DataTypes.BOOLEAN, defaultValue: false },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
      },
    },
    {
      tableName:  "media",
      underscored: true,
      paranoid:    false,
    },
  );

  Media.associate = (models) => {
    Media.belongsTo(models.User, { foreignKey: "uploaded_by", as: "uploader" });
  };

  return Media;
};