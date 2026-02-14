'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('media', 'optimized_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
    await queryInterface.addColumn('media', 'thumbnail_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
    await queryInterface.addColumn('media', 'uploaded_by', {
      type: Sequelize.UUID,
      allowNull: true,
    });
    await queryInterface.addColumn('media', 'entity_type', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
    await queryInterface.addColumn('media', 'entity_id', {
      type: Sequelize.UUID,
      allowNull: true,
    });
    await queryInterface.addColumn('media', 'is_featured', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn('media', 'display_order', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    });

    // Add indexes
    await queryInterface.addIndex('media', ['uploaded_by']);
    await queryInterface.addIndex('media', ['entity_type', 'entity_id']);
    await queryInterface.addIndex('media', ['is_featured']);
  },

  async down(queryInterface) {
    // Remove columns if rolling back
    await queryInterface.removeColumn('media', 'optimized_url');
    // ... remove others
  },
};