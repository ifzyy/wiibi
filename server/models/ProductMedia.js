import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class ProductMedia extends Model {
    static associate(models) {
      // Relations
      ProductMedia.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product',
        onDelete: 'CASCADE',
      });

      ProductMedia.belongsTo(models.Media, {
        foreignKey: 'media_id',
        as: 'media',
        onDelete: 'CASCADE',
      });
    }
  }

  ProductMedia.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
      },

      media_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'media',
          key: 'id',
        },
      },

      role: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Role of this media in the product (main, gallery, thumbnail, supplier, etc.)',
        validate: {
          notEmpty: true,
        },
      },

      display_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Order for rendering gallery items (drag & drop support)',
      },

      caption: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Optional override caption/alt text for this specific usage',
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
      sequelize,
      modelName: 'ProductMedia',
      tableName: 'product_media',
      underscored: true,
      timestamps: true,
      paranoid: false, // no soft delete on junction table
      indexes: [
        // Fast lookup by product + order
        {
          fields: ['product_id', 'display_order'],
        },
        // Fast lookup by product + role
        {
          fields: ['product_id', 'role'],
        },
        // Fast reverse lookup (which products use this media)
        {
          fields: ['media_id'],
        },
      ],
    }
  );

  return ProductMedia;
};