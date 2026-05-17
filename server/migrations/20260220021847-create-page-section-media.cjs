'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('page_section_media', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      page_section_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'page_sections', key: 'id' },
        onDelete: 'CASCADE',
      },
      media_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'media', key: 'id' },
        onDelete: 'CASCADE',
      },
      role: { type: Sequelize.STRING(50), allowNull: false }, // hero, background, gallery, cta, etc.
      display_order: { type: Sequelize.INTEGER, defaultValue: 0 },
      caption: { type: Sequelize.TEXT, allowNull: true },
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    });

    await queryInterface.addIndex('page_section_media', ['page_section_id', 'role', 'display_order']);
  },
  down: async (queryInterface) => await queryInterface.dropTable('page_section_media'),
};