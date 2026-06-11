export default (sequelize, DataTypes) => {
  const GlobalSetting = sequelize.define('GlobalSetting', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    key: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    // JSON, not JSONB — this is MySQL. JSONB is Postgres-only and breaks creates.
    value: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
    type: { type: DataTypes.ENUM('text','number','boolean','rich_text','image','array','object','color','url'), defaultValue: 'text' },
    group: { type: DataTypes.STRING(60), allowNull: true },
    label: { type: DataTypes.STRING(120), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    // field mappings are required — the table columns are snake_case; without
    // them every INSERT through this model failed with "unknown column isPublic"
    isPublic: { type: DataTypes.BOOLEAN, defaultValue: true,  field: 'is_public' },
    isSystem: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_system' },
  }, {
    tableName: 'global_settings',
    timestamps: false,   // created_at / updated_at have DB-level defaults
  });

  return GlobalSetting;
};
