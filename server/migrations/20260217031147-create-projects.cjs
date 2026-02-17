'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.showAllTables().then(tables => tables.includes('projects'));

    if (!tableExists) {
      await queryInterface.createTable('projects', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        title: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        slug: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true,
        },
        type: {
          type: Sequelize.ENUM('project', 'case_study'),
          allowNull: false,
          defaultValue: 'project',
        },
        year: {
          type: Sequelize.STRING(4),
          allowNull: true,
        },
        location: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        overview: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        problem: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        solution: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        results: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        conclusion: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        featured_image_id: {
          type: Sequelize.UUID,
          allowNull: true,
        },
        gallery_image_ids: {
          type: Sequelize.JSON,
          defaultValue: [],
        },
        is_featured: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        display_order: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
        is_visible: {
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
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
      });

      // Indexes
      await queryInterface.addIndex('projects', ['slug'], { unique: true });
      await queryInterface.addIndex('projects', ['type']);
      await queryInterface.addIndex('projects', ['is_featured']);
      await queryInterface.addIndex('projects', ['display_order']);
      await queryInterface.addIndex('projects', ['is_visible']);
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('projects');
  },
};