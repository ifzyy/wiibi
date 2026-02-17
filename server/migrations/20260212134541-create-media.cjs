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
      optimized_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'URL of resized/optimized version (for CDN or local processing)',
      },
      thumbnail_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Small preview version for admin library',
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
      // ── Critical for admin control & traceability ──
      uploaded_by: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Admin/user who uploaded this file (audit trail)',
      },
      entity_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Polymorphic: product, project, page_section, blog_post, testimonial, etc.',
      },
      entity_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'ID of the parent entity this media belongs to',
      },
      is_featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Is this the primary/featured image for its entity?',
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Order for gallery images',
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

    // ── Indexes for performance & queries ──
    await queryInterface.addIndex('media', ['type']);
    await queryInterface.addIndex('media', ['entity_type', 'entity_id']);
    await queryInterface.addIndex('media', ['uploaded_by']);
    await queryInterface.addIndex('media', ['is_featured']);
    await queryInterface.addIndex('media', ['display_order']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('media');
  },
};