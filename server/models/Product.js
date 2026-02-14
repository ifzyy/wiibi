import { DataTypes } from 'sequelize';
export default (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    shortDescription: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'short_description',
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    salePrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'sale_price',
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    brand: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    featuredImageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'featured_image_url',
    },
    galleryImages: {
      type: DataTypes.JSON,
      defaultValue: [],
      field: 'gallery_images',
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_visible',
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_featured',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      field: 'created_at',
    },
  }, {
    tableName: 'products',
    paranoid: false,
    underscored: true,
    indexes: [
      { fields: ['slug'], unique: true },
      { fields: ['sku'], unique: true },
      { fields: ['category'] },
      { fields: ['is_visible'] },
      { fields: ['is_featured'] },
    ],
  });
Product.associate = (models) => {
    Product.hasMany(models.Media, {
      foreignKey: 'entity_id',
      constraints: false,                // no FK constraint (polymorphic)
      scope: {
        entity_type: 'product',          // filter to only media linked to products
      },
      as: 'images',                      // alias for eager loading
    });
  };

  return Product;
};