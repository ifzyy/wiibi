import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  const Blog = sequelize.define('Blog', {
    id: {
      type:         DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey:   true,
      allowNull:    false,
    },

    // ── Core content ──────────────────────────────────────────────────────
    title: {
      type:      DataTypes.STRING(500),
      allowNull: false,
      validate:  { notEmpty: { msg: 'Title cannot be empty' } },
    },
    slug: {
      type:      DataTypes.STRING(600),
      allowNull: false,
      unique:    true,
      validate:  {
        is:       { args: /^[a-z0-9]+(?:-[a-z0-9]+)*$/i, msg: 'Slug must be URL-safe' },
        notEmpty: { msg: 'Slug cannot be empty' },
      },
    },
    excerpt: {
      type:      DataTypes.STRING(1000),
      allowNull: true,
    },
    content: {
      type:      DataTypes.TEXT('long'), // LONGTEXT — handles large Tiptap HTML safely
      allowNull: true,
    },

    // ── Status & publishing ───────────────────────────────────────────────
    status: {
      type:         DataTypes.ENUM('draft', 'published', 'archived'),
      defaultValue: 'draft',
      allowNull:    false,
    },

    // ── Category ──────────────────────────────────────────────────────────
    // Must match one of the category values defined in the CMS blog_grid section.
    // Drives the category filter on the public BlogPage.
    category: {
      type:      DataTypes.STRING(100),
      allowNull: true,
    },

    published_at: {
      type:      DataTypes.DATE,
      allowNull: true,
      comment:   'Set automatically on first transition to published',
    },

    // ── Featured image ────────────────────────────────────────────────────
    // Mirrors Product.featured_image_url — synced by upload controller
    featured_image_url: {
      type:      DataTypes.STRING(1000),
      allowNull: true,
    },
    // FK to Media table — set by attachMediaToBlog (mirrors attachMediaToProduct)
    featured_media_id: {
      type:       DataTypes.UUID,
      allowNull:  true,
      references: { model: 'media', key: 'id' },
      onUpdate:   'CASCADE',
      onDelete:   'SET NULL',
    },

    // ── Authorship ────────────────────────────────────────────────────────
    author_name: {
      type:      DataTypes.STRING(255),
      allowNull: true,
    },
    author_id: {
      type:      DataTypes.UUID,
      allowNull: true,
      comment:   'FK to users table — optional, for when auth is wired up',
    },

    // ── SEO ───────────────────────────────────────────────────────────────
    meta_title: {
      type:      DataTypes.STRING(500),
      allowNull: true,
    },
    meta_description: {
      type:      DataTypes.STRING(1000),
      allowNull: true,
    },

    // ── Computed / stats ──────────────────────────────────────────────────
    read_time_minutes: {
      type:      DataTypes.SMALLINT.UNSIGNED,
      allowNull: true,
      comment:   'Computed from content word count at ~200 wpm',
    },
    view_count: {
      type:         DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
      allowNull:    false,
    },
    is_featured: {
      type:         DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull:    false,
    },
  }, {
    tableName:   'blogs',
    underscored: true,
    timestamps:  true,
    paranoid:    true,          // soft-delete via deleted_at
    createdAt:   'created_at',
    updatedAt:   'updated_at',
    deletedAt:   'deleted_at',

    indexes: [
      { fields: ['slug'],        unique: true },
      { fields: ['status'] },
      { fields: ['is_featured'] },
      { fields: ['published_at'] },
      { fields: ['author_id'] },
      { fields: ['deleted_at'] },
    ],
  });

  // ── Lifecycle hooks ──────────────────────────────────────────────────────
  Blog.addHook('beforeSave', (blog) => {
    // Set published_at the first time post transitions to "published"
    if (blog.changed('status') && blog.status === 'published' && !blog.published_at) {
      blog.published_at = new Date();
    }

    // Compute reading time: strip HTML tags, count words, ~200 wpm
    if (blog.changed('content') && blog.content) {
      const plainText = blog.content.replace(/<[^>]+>/g, ' ');
      const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
      blog.read_time_minutes = Math.max(1, Math.round(wordCount / 200));
    }
  });

  // ── Associations ──────────────────────────────────────────────────────────
  Blog.associate = (models) => {
    Blog.belongsToMany(models.Media, {
      through:     models.BlogMedia,
      foreignKey:  'blog_id',
      otherKey:    'media_id',
      as:          'images',
      constraints: false,
    });

    // scope:{} is CRITICAL — without it Sequelize inherits Blog's paranoid
    // scope onto the JOIN clause and injects deleted_at IS NULL on blog_media,
    // which has no deleted_at column:
    //   "Unknown column 'mediaRelations.deleted_at' in 'on clause'"
    Blog.hasMany(models.BlogMedia, {
      foreignKey:           'blog_id',
      as:                   'mediaRelations',
      onDelete:             'CASCADE',
      scope:                {},
      foreignKeyConstraint: false,
    });

    Blog.belongsToMany(models.Tag, {
      through:     models.BlogTag,
      foreignKey:  'blog_id',
      otherKey:    'tag_id',
      as:          'tags',
      constraints: false,
    });
  };

  return Blog;
};