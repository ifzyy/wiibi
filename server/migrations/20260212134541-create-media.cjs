'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('media', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      url: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      filename: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: 'image-1',
      },
      mime_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('image', 'video', 'document', 'audio'),
        allowNull: false,
        defaultValue: 'image',
      },
      size_bytes: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      width: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      height: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      alt_text: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      caption: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('media', ['type']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('media');
  },
};