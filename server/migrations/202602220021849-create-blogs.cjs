/**
 * migrations/001_create_blogs.js
 *
 * Run with: npx sequelize-cli db:migrate
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('blogs', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.literal('(UUID())'),
        primaryKey:   true,
        allowNull:    false,
      },

      // ── Content ────────────────────────────────────────────────────────────
      title: {
        type:      Sequelize.STRING(500),
        allowNull: false,
      },
      slug: {
        type:      Sequelize.STRING(600),
        allowNull: false,
        unique:    true,
      },
      excerpt: {
        type:      Sequelize.STRING(1000),
        allowNull: true,
      },
      content: {
        type:      Sequelize.TEXT('long'),
        allowNull: true,
      },

      // ── Status ─────────────────────────────────────────────────────────────
      status: {
        type:         Sequelize.ENUM('draft', 'published', 'archived'),
        defaultValue: 'draft',
        allowNull:    false,
      },
      published_at: {
        type:      Sequelize.DATE,
        allowNull: true,
      },

      // ── Media ──────────────────────────────────────────────────────────────
      featured_image_url: {
        type:      Sequelize.STRING(1000),
        allowNull: true,
      },
      featured_media_id: {
        type:       Sequelize.UUID,
        allowNull:  true,
        references: { model: 'media', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'SET NULL',
      },

      // ── Authorship ─────────────────────────────────────────────────────────
      author_name: {
        type:      Sequelize.STRING(255),
        allowNull: true,
      },
      author_id: {
        type:      Sequelize.UUID,
        allowNull: true,
      },

      // ── SEO ────────────────────────────────────────────────────────────────
      meta_title: {
        type:      Sequelize.STRING(500),
        allowNull: true,
      },
      meta_description: {
        type:      Sequelize.STRING(1000),
        allowNull: true,
      },

      // ── Stats ──────────────────────────────────────────────────────────────
      read_time_minutes: {
        type:      Sequelize.SMALLINT.UNSIGNED,
        allowNull: true,
      },
      view_count: {
        type:         Sequelize.INTEGER.UNSIGNED,
        defaultValue: 0,
        allowNull:    false,
      },
      is_featured: {
        type:         Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull:    false,
      },

      // ── Timestamps (Sequelize paranoid) ────────────────────────────────────
      created_at: {
        type:      Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type:      Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type:      Sequelize.DATE,
        allowNull: true,
      },
    });

    // ── Indexes ────────────────────────────────────────────────────────────────
    await queryInterface.addIndex('blogs', ['slug'], { unique: true, name: 'blogs_slug_unique' });
    await queryInterface.addIndex('blogs', ['status'], { name: 'blogs_status' });
    await queryInterface.addIndex('blogs', ['is_featured'], { name: 'blogs_is_featured' });
    await queryInterface.addIndex('blogs', ['published_at'], { name: 'blogs_published_at' });
    await queryInterface.addIndex('blogs', ['author_id'], { name: 'blogs_author_id' });
    await queryInterface.addIndex('blogs', ['deleted_at'], { name: 'blogs_deleted_at' });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('blogs');
  },
};