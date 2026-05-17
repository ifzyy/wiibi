'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('product_media', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onDelete: 'CASCADE',
      },
      media_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'media', key: 'id' },
        onDelete: 'CASCADE',
      },
      role: {
        type: Sequelize.STRING(50),
        allowNull: false, // 'main', 'gallery', 'thumbnail', 'supplier'
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      caption: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    });

    await queryInterface.addIndex('product_media', ['product_id', 'display_order']);
    await queryInterface.addIndex('product_media', ['product_id', 'role']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('product_media');
  },
};