export default (sequelize, DataTypes) => {
  const Tag = sequelize.define(
    'Tag',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, // ✅ better than raw UUID()
        primaryKey: true,
        allowNull: false,
      },

      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },

      slug: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true,
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },

      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'tags',

      // ✅ Let Sequelize handle timestamps instead of SQL hacks
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',

      // Optional but clean
      underscored: true,
    }
  );

  return Tag;
};