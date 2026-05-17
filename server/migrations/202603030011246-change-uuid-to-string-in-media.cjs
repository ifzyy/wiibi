'use strict';

/**
 * Migration: change Media.entity_id from UUID to STRING(255)
 *
 * Why: Media.entity_id needs to store references to multiple entity types.
 * Some entities (blogs, testimonials) use UUID primary keys, others
 * (products) use INTEGER primary keys. STRING(255) stores both without
 * type conflicts, with zero data loss on existing rows.
 *
 * Safe to run on a live DB — ALTER COLUMN on a nullable column with no
 * foreign key constraint is non-destructive in MySQL/PostgreSQL/SQLite.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('media', 'entity_id', {
      type:      Sequelize.STRING(255),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert to UUID — note: any rows storing integer strings will be lost
    await queryInterface.changeColumn('media', 'entity_id', {
      type:      Sequelize.UUID,
      allowNull: true,
      defaultValue: null,
    });
  },
};