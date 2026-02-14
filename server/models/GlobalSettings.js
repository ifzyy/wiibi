export default (sequelize, DataTypes) => {
  const GlobalSetting = sequelize.define('GlobalSetting', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    key: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    value: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    type: { type: DataTypes.ENUM('text','number','boolean','rich_text','image','array','object','color','url'), defaultValue: 'text' },
    group: { type: DataTypes.STRING(60), allowNull: true },
    label: { type: DataTypes.STRING(120), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    isPublic: { type: DataTypes.BOOLEAN, defaultValue: true },
    isSystem: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, {
    tableName: 'global_settings',
    timestamps: false,   // ← disabled for now
  });

  return GlobalSetting;
};