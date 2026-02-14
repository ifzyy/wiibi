'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pages', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(250),
        allowNull: false,
        unique: true,
      },
      content_type: {
        type: Sequelize.ENUM('static', 'blog_post', 'blog_index', 'collection'),
        allowNull: false,
        defaultValue: 'static',
      },
      status: {
        type: Sequelize.ENUM('draft', 'published', 'scheduled', 'archived'),
        defaultValue: 'draft',
      },
      publish_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      excerpt: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      featured_image_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      author_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      meta_title: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      meta_description: {
        type: Sequelize.STRING(320),
        allowNull: true,
      },
      og_image_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      canonical_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      is_indexed: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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

    await queryInterface.addIndex('pages', ['slug'], { unique: true });
    await queryInterface.addIndex('pages', ['content_type']);
    await queryInterface.addIndex('pages', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('pages');
  },
};