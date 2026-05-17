/**
 * migrations/003_add_category_to_blogs.js
 *
 * Adds a `category` column to the blogs table.
 * This matches the categories array defined in the CMS blog_grid section,
 * so the public BlogPage filter works correctly.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('blogs', 'category', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'status', // MySQL-specific
    });

    await queryInterface.addIndex('blogs', ['category'], { name: 'blogs_category' });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('blogs', 'blogs_category');
    await queryInterface.removeColumn('blogs', 'category');
  },
};