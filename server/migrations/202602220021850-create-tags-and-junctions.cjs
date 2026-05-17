/**
 * migrations/002_create_tags_and_junctions.js
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ── tags ──────────────────────────────────────────────────────────────────
    await queryInterface.createTable('tags', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.literal('(UUID())'),
        primaryKey:   true,
        allowNull:    false,
      },
      name: {
        type:      Sequelize.STRING(100),
        allowNull: false,
        unique:    true,
      },
      slug: {
        type:      Sequelize.STRING(120),
        allowNull: false,
        unique:    true,
      },
      created_at: {
        type:         Sequelize.DATE,
        allowNull:    false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type:         Sequelize.DATE,
        allowNull:    false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('tags', ['name'], { unique: true, name: 'tags_name_unique' });
    await queryInterface.addIndex('tags', ['slug'], { unique: true, name: 'tags_slug_unique' });

    // ── blog_tags (many-to-many junction) ─────────────────────────────────────
    await queryInterface.createTable('blog_tags', {
      blog_id: {
        type:       Sequelize.UUID,
        allowNull:  false,
        primaryKey: true,
        references: { model: 'blogs', key: 'id' },
        onDelete:   'CASCADE',
        onUpdate:   'CASCADE',
      },
      tag_id: {
        type:       Sequelize.UUID,
        allowNull:  false,
        primaryKey: true,
        references: { model: 'tags', key: 'id' },
        onDelete:   'CASCADE',
        onUpdate:   'CASCADE',
      },
    });

    await queryInterface.addIndex('blog_tags', ['blog_id'], { name: 'blog_tags_blog_id' });
    await queryInterface.addIndex('blog_tags', ['tag_id'], { name: 'blog_tags_tag_id' });

    // ── blog_media (many-to-many junction) ────────────────────────────────────
    await queryInterface.createTable('blog_media', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.literal('(UUID())'),
        primaryKey:   true,
        allowNull:    false,
      },
      blog_id: {
        type:       Sequelize.UUID,
        allowNull:  false,
        references: { model: 'blogs', key: 'id' },
        onDelete:   'CASCADE',
        onUpdate:   'CASCADE',
      },
      media_id: {
        type:       Sequelize.UUID,
        allowNull:  false,
        references: { model: 'media', key: 'id' },
        onDelete:   'CASCADE',
        onUpdate:   'CASCADE',
      },
      role: {
        type:         Sequelize.ENUM('main', 'gallery'),
        defaultValue: 'gallery',
        allowNull:    false,
      },
      display_order: {
        type:         Sequelize.INTEGER.UNSIGNED,
        defaultValue: 0,
        allowNull:    false,
      },
      caption: {
        type:      Sequelize.STRING(500),
        allowNull: true,
      },
      created_at: {
        type:         Sequelize.DATE,
        allowNull:    false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type:         Sequelize.DATE,
        allowNull:    false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('blog_media', ['blog_id'], { name: 'blog_media_blog_id' });
    await queryInterface.addIndex('blog_media', ['media_id'], { name: 'blog_media_media_id' });
    await queryInterface.addIndex('blog_media', ['blog_id', 'media_id'], { unique: true, name: 'blog_media_unique' });
    await queryInterface.addIndex('blog_media', ['role'], { name: 'blog_media_role' });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('blog_media');
    await queryInterface.dropTable('blog_tags');
    await queryInterface.dropTable('tags');
  },
};