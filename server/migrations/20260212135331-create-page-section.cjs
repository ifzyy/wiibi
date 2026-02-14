'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('page_sections', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      page_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      section_type: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      is_visible: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      content: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      layout: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
      background_image_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      featured_media_ids: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
      visibility_rules: {
        type: Sequelize.JSON,
        defaultValue: {},
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

    await queryInterface.addIndex('page_sections', ['page_id', 'display_order']);
    await queryInterface.addIndex('page_sections', ['section_type']);
    await queryInterface.addIndex('page_sections', ['is_visible']);

    await queryInterface.addConstraint('page_sections', {
      fields: ['page_id'],
      type: 'foreign key',
      name: 'fk_page_sections_page_id',
      references: { table: 'pages', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('page_sections', {
      fields: ['background_image_id'],
      type: 'foreign key',
      name: 'fk_page_sections_background_image_id',
      references: { table: 'media', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('page_sections');
  },
};