'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      short_description: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      sale_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      stock: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      sku: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      brand: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      featured_image_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      gallery_images: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
      is_visible: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      is_featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('products', ['slug'], { unique: true });
    await queryInterface.addIndex('products', ['sku'], { unique: true });
    await queryInterface.addIndex('products', ['category']);
    await queryInterface.addIndex('products', ['is_visible']);
    await queryInterface.addIndex('products', ['is_featured']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('products');
  },
};