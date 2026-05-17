/**
 * controllers/blogController.js
 */

import { Op } from 'sequelize';
import { validate as isUUID } from 'uuid';
import db from '../models/index.js';
import {
  slugify,
  parsePagination,
  buildPaginationMeta,
  parseSortOrder,
} from '../utils/blogUtils.js';

// ─────────────────────────────────────────────────────────────────────────────
// The paranoid:true on Blog causes Sequelize to inject `deleted_at IS NULL`
// into JOIN ON clauses for ALL associations — including BlogMedia which has
// no deleted_at column. Every attempted fix via paranoid:false on includes,
// scope:{} on hasMany, or foreignKeyConstraint:false still fails because
// Sequelize resolves it at the association level before query-time options.
//
// The definitive fix: NEVER include BlogMedia/Media through the Blog
// association chain. Instead, fetch them in a separate explicit query and
// merge the results manually. This is also more performant.
// ─────────────────────────────────────────────────────────────────────────────

// ── Fetch media rows for a set of blog IDs (separate query, no JOIN issues) ──
const fetchMediaForBlogs = async (blogIds) => {
  if (!blogIds.length) return {};

  const rows = await db.BlogMedia.findAll({
    where:      { blog_id: { [Op.in]: blogIds } },
    attributes: ['id', 'blog_id', 'media_id', 'role', 'display_order', 'caption'],
    include: [{
      model:      db.Media,
      as:         'media',
      attributes: ['id', 'url', 'alt_text', 'mime_type', 'is_external'],
    }],
    order: [['display_order', 'ASC']],
  });

  // Group by blog_id
  const map = {};
  for (const row of rows) {
    if (!map[row.blog_id]) map[row.blog_id] = [];
    map[row.blog_id].push(row);
  }
  return map;
};

// ── Fetch tags for a set of blog IDs — raw query, zero ORM join risk ────────
const fetchTagsForBlogs = async (blogIds) => {
  if (!blogIds.length) return {};

  // Use raw SQL to bypass all Sequelize scope/paranoid injection entirely.
  // Any ORM-level include of Tag through BlogTag risks deleted_at injection
  // because Sequelize walks the association chain and bleeds paranoid scopes.
  const rows = await db.sequelize.query(
    `SELECT bt.blog_id, t.id, t.name, t.slug
       FROM blog_tags bt
       INNER JOIN tags t ON t.id = bt.tag_id
       WHERE bt.blog_id IN (:blogIds)`,
    { replacements: { blogIds }, type: db.sequelize.QueryTypes.SELECT }
  );

  const map = {};
  for (const row of rows) {
    if (!map[row.blog_id]) map[row.blog_id] = [];
    map[row.blog_id].push({ id: row.id, name: row.name, slug: row.slug });
  }
  return map;
};

// ── Serialise one blog plain object + pre-fetched media + tags ────────────────
const toClientBlog = (plain, mediaRows = [], tagRows = []) => ({
  id:            plain.id,
  title:         plain.title,
  slug:          plain.slug,
  excerpt:       plain.excerpt            ?? null,
  content:       plain.content            ?? '',
  status:        plain.status,
  author:        plain.author_name        ?? null,
  category:      plain.category            ?? null,
  featuredImage: plain.featured_image_url ?? null,
  tags:          tagRows.map((t) => t.name ?? t),
  is_featured:   plain.is_featured,
  published_at:  plain.published_at       ?? null,
  read_time:     plain.read_time_minutes  ?? null,
  view_count:    plain.view_count,
  meta: {
    title:       plain.meta_title        ?? null,
    description: plain.meta_description  ?? null,
  },
  images: mediaRows.map((rel) => ({
    id:            rel.media_id,
    url:           rel.media?.url      ?? null,
    role:          rel.role,
    caption:       rel.caption         ?? null,
    display_order: rel.display_order,
    alt_text:      rel.media?.alt_text ?? null,
  })),
  createdAt: plain.created_at,
  updatedAt: plain.updated_at,
});

// ─────────────────────────────────────────────────────────────────────────────
// Tag helpers
// ─────────────────────────────────────────────────────────────────────────────
const resolveTagInstances = async (tagNames = [], transaction) => {
  if (!tagNames.length) return [];
  const normalised = [...new Set(tagNames.map((t) => t.trim().toLowerCase()))];
  return Promise.all(
    normalised.map((name) =>
      db.Tag.findOrCreate({
        where:    { name },
        defaults: { name, slug: slugify(name) },
        transaction,
      }).then(([inst]) => inst)
    )
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// getBlogs / getPublishedBlogs
// ─────────────────────────────────────────────────────────────────────────────
const listBlogs = async (req, res, isPublic = false) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const order                   = parseSortOrder(req.query);
    const where                   = {};

    if (isPublic) {
      where.status = 'published';
    } else if (req.query.status && ['draft','published','archived'].includes(req.query.status)) {
      where.status = req.query.status;
    }

    if (req.query.is_featured !== undefined) {
      where.is_featured = req.query.is_featured === 'true';
    }

    // Category filter — exact match against the category column
    if (req.query.category) {
      where.category = req.query.category.trim();
    }

    if (req.query.search) {
      const q = `%${req.query.search.trim()}%`;
      where[Op.or] = [
        { title:       { [Op.like]: q } },
        { excerpt:     { [Op.like]: q } },
        { author_name: { [Op.like]: q } },
      ];
    }

    // Tag filter — resolved via BlogTag subquery to avoid the paranoid JOIN issue
    if (req.query.tag) {
      const tag = await db.Tag.findOne({ where: { slug: req.query.tag.trim().toLowerCase() } });
      if (tag) {
        const blogTagRows = await db.BlogTag.findAll({ where: { tag_id: tag.id }, attributes: ['blog_id'] });
        where.id = { [Op.in]: blogTagRows.map((r) => r.blog_id) };
      } else {
        // Tag doesn't exist — return empty
        return res.status(200).json({ blogs: [], pagination: buildPaginationMeta(0, page, limit) });
      }
    }

    // Fetch blogs — NO media/tag includes (avoids paranoid JOIN bug entirely)
    const { count, rows } = await db.Blog.findAndCountAll({
      where,
      order,
      limit,
      offset,
      attributes: { exclude: isPublic ? [] : ['content'] },
    });

    const ids       = rows.map((r) => r.id);
    const mediaMap  = await fetchMediaForBlogs(ids);
    const tagMap    = await fetchTagsForBlogs(ids);

    const blogs = rows.map((r) => {
      const plain = r.toJSON();
      return toClientBlog(plain, mediaMap[plain.id] ?? [], tagMap[plain.id] ?? []);
    });

    return res.status(200).json({ blogs, pagination: buildPaginationMeta(count, page, limit) });

  } catch (err) {
    console.error('[listBlogs]', err);
    return res.status(500).json({ message: 'Failed to fetch blogs', error: err.message });
  }
};

export const getBlogs          = (req, res) => listBlogs(req, res, false);
export const getPublishedBlogs = (req, res) => listBlogs(req, res, true);

// ─────────────────────────────────────────────────────────────────────────────
// getBlogById
// ─────────────────────────────────────────────────────────────────────────────
export const getBlogById = async (req, res) => {
  try {
    const blog = await db.Blog.findByPk(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog post not found' });

    const id       = blog.id;
    const mediaMap = await fetchMediaForBlogs([id]);
    const tagMap   = await fetchTagsForBlogs([id]);

    return res.status(200).json({
      blog: toClientBlog(blog.toJSON(), mediaMap[id] ?? [], tagMap[id] ?? []),
    });

  } catch (err) {
    console.error('[getBlogById]', err);
    return res.status(500).json({ message: 'Failed to fetch blog post', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// getPublishedBlogBySlug
// ─────────────────────────────────────────────────────────────────────────────
export const getPublishedBlogBySlug = async (req, res) => {
  try {
    const blog = await db.Blog.findOne({
      where: { slug: req.params.slug, status: 'published' },
    });
    if (!blog) return res.status(404).json({ message: 'Blog post not found' });

    const id       = blog.id;
    const mediaMap = await fetchMediaForBlogs([id]);
    const tagMap   = await fetchTagsForBlogs([id]);

    // Increment view count asynchronously — don't block response
    blog.increment('view_count').catch(() => {});

    return res.status(200).json({
      blog: toClientBlog(blog.toJSON(), mediaMap[id] ?? [], tagMap[id] ?? []),
    });

  } catch (err) {
    console.error('[getPublishedBlogBySlug]', err);
    return res.status(500).json({ message: 'Failed to fetch blog post', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// createBlog
// ─────────────────────────────────────────────────────────────────────────────
export const createBlog = async (req, res) => {
  console.log(req)
  const transaction = await db.sequelize.transaction();
  try {
    const {
      title,
      content           = '',
      excerpt           = null,
      status            = 'draft',
      author            = null,
      tags              = [],
      featuredImage     = null,
      featured_media_id = null,
      meta_title        = null,
      meta_description  = null,
      is_featured       = false,
      category          = null,
    } = req.body;

    let slug = req.body.slug?.trim();
    if (!slug) slug = slugify(title);

    const existing = await db.Blog.findOne({ where: { slug }, paranoid: false });
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;

    const tagInstances = await resolveTagInstances(tags, transaction);

    const blog = await db.Blog.create({
      title,
      slug,
      content,
      excerpt,
      status,
      author_name:        author,
      category,
      featured_image_url: featuredImage,
      featured_media_id,
      meta_title,
      meta_description,
      is_featured,
    }, { transaction });

    if (tagInstances.length) {
      await blog.setTags(tagInstances, { transaction });
    }

    if (featured_media_id) {
      await db.BlogMedia.create({
        blog_id:       blog.id,
        media_id:      featured_media_id,
        role:          'main',
        display_order: 0,
        caption:       null,
      }, { transaction });

      await db.Media.update(
        { entity_type: 'blog', entity_id: blog.id },
        { where: { id: featured_media_id }, transaction }
      );
    }

    await transaction.commit();

    const id       = blog.id;
    const mediaMap = await fetchMediaForBlogs([id]);
    const tagMap   = await fetchTagsForBlogs([id]);

    return res.status(201).json({
      message: 'Blog post created successfully',
      blog:    toClientBlog(blog.toJSON(), mediaMap[id] ?? [], tagMap[id] ?? []),
    });

  } catch (err) {
    await transaction.rollback();
    console.error('[createBlog]', err);
    if (err.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ message: 'A post with this slug already exists' });
    if (err.name === 'SequelizeValidationError')       return res.status(422).json({ message: 'Validation error', errors: err.errors.map((e) => e.message) });
    return res.status(500).json({ message: 'Failed to create blog post', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// updateBlog
// ─────────────────────────────────────────────────────────────────────────────
export const updateBlog = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const blog = await db.Blog.findByPk(req.params.id, { transaction });
    if (!blog) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Blog post not found' });
    }

    const {
      title, slug, content, excerpt, status, author,
      tags, featuredImage, featured_media_id,
      meta_title, meta_description, is_featured, category,
    } = req.body;

    const updates = {};
    if (title             !== undefined) updates.title              = title;
    if (content           !== undefined) updates.content            = content;
    if (excerpt           !== undefined) updates.excerpt            = excerpt;
    if (status            !== undefined) updates.status             = status;
    if (author            !== undefined) updates.author_name        = author;
    if (featuredImage     !== undefined) updates.featured_image_url = featuredImage;
    if (featured_media_id !== undefined) updates.featured_media_id  = featured_media_id;
    if (meta_title        !== undefined) updates.meta_title         = meta_title;
    if (meta_description  !== undefined) updates.meta_description   = meta_description;
    if (is_featured       !== undefined) updates.is_featured        = is_featured;
    if (category          !== undefined) updates.category           = category;

    if (slug !== undefined && slug.trim() !== blog.slug) {
      const collision = await db.Blog.findOne({
        where: { slug: slug.trim(), id: { [Op.ne]: blog.id } },
        paranoid: false,
      });
      if (collision) {
        await transaction.rollback();
        return res.status(409).json({ message: 'A post with this slug already exists' });
      }
      updates.slug = slug.trim();
    }

    if (Object.keys(updates).length) await blog.update(updates, { transaction });

    if (tags !== undefined) {
      const tagInstances = await resolveTagInstances(tags, transaction);
      await blog.setTags(tagInstances, { transaction });
    }

    if (featured_media_id !== undefined && featured_media_id !== null) {
      await db.BlogMedia.destroy({ where: { blog_id: blog.id, role: 'main' }, transaction });
      await db.BlogMedia.create({
        blog_id: blog.id, media_id: featured_media_id,
        role: 'main', display_order: 0, caption: null,
      }, { transaction });
      await db.Media.update(
        { entity_type: 'blog', entity_id: blog.id },
        { where: { id: featured_media_id }, transaction }
      );
    }

    await transaction.commit();

    const id       = blog.id;
    const fresh    = await db.Blog.findByPk(id);
    const mediaMap = await fetchMediaForBlogs([id]);
    const tagMap   = await fetchTagsForBlogs([id]);

    return res.status(200).json({
      message: 'Blog post updated successfully',
      blog:    toClientBlog(fresh.toJSON(), mediaMap[id] ?? [], tagMap[id] ?? []),
    });

  } catch (err) {
    await transaction.rollback();
    console.error('[updateBlog]', err);
    if (err.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ message: 'A post with this slug already exists' });
    if (err.name === 'SequelizeValidationError')       return res.status(422).json({ message: 'Validation error', errors: err.errors.map((e) => e.message) });
    return res.status(500).json({ message: 'Failed to update blog post', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// deleteBlog (soft)
// ─────────────────────────────────────────────────────────────────────────────
export const deleteBlog = async (req, res) => {
  try {
    const blog = await db.Blog.findByPk(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog post not found' });
    await blog.destroy();
    return res.status(200).json({ message: 'Blog post deleted successfully', deleted_id: req.params.id });
  } catch (err) {
    console.error('[deleteBlog]', err);
    return res.status(500).json({ message: 'Failed to delete blog post', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// restoreBlog
// ─────────────────────────────────────────────────────────────────────────────
export const restoreBlog = async (req, res) => {
  try {
    const blog = await db.Blog.findByPk(req.params.id, { paranoid: false });
    if (!blog)            return res.status(404).json({ message: 'Blog post not found' });
    if (!blog.deleted_at) return res.status(400).json({ message: 'Blog post is not deleted' });
    await blog.restore();
    return res.status(200).json({ message: 'Blog post restored', blog: toClientBlog(blog.toJSON()) });
  } catch (err) {
    console.error('[restoreBlog]', err);
    return res.status(500).json({ message: 'Failed to restore blog post', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// hardDeleteBlog
// ─────────────────────────────────────────────────────────────────────────────
export const hardDeleteBlog = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const blog = await db.Blog.findByPk(req.params.id, { paranoid: false, transaction });
    if (!blog) { await transaction.rollback(); return res.status(404).json({ message: 'Blog post not found' }); }

    await db.BlogMedia.destroy({ where: { blog_id: blog.id }, transaction });
    await db.BlogTag.destroy(  { where: { blog_id: blog.id }, transaction });
    await blog.destroy({ force: true, transaction });

    await transaction.commit();
    return res.status(200).json({ message: 'Blog post permanently deleted', deleted_id: req.params.id });
  } catch (err) {
    await transaction.rollback();
    console.error('[hardDeleteBlog]', err);
    return res.status(500).json({ message: 'Failed to permanently delete blog post', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// attachMediaToBlog
// ─────────────────────────────────────────────────────────────────────────────
export const attachMediaToBlog = async (req, res) => {
  const { id: blogId } = req.params;
  const blog = await db.Blog.findByPk(blogId);
  if (!blog) return res.status(404).json({ message: 'Blog post not found' });

  const { featured, gallery = [] } = req.body;
  const transaction = await db.sequelize.transaction();

  try {
    const blogMediaRows  = [];
    let featuredImageUrl = blog.featured_image_url;

    if (featured?.id) {
      await db.Media.update(
        { entity_type: 'blog', entity_id: blogId },
        { where: { id: featured.id }, transaction }
      );
      blogMediaRows.push({ blog_id: blogId, media_id: featured.id, role: 'main', display_order: 0, caption: null });
      featuredImageUrl = featured.url;
    }

    for (const [i, img] of gallery.entries()) {
      if (!img?.id) continue;
      await db.Media.update(
        { entity_type: 'blog', entity_id: blogId },
        { where: { id: img.id }, transaction }
      );
      blogMediaRows.push({ blog_id: blogId, media_id: img.id, role: 'gallery', display_order: i + 1, caption: img.caption ?? null });
    }

    if (blogMediaRows.length) {
      await db.BlogMedia.bulkCreate(blogMediaRows, { updateOnDuplicate: ['role', 'display_order', 'caption'], transaction });
    }

    if (featuredImageUrl !== blog.featured_image_url) {
      await db.Blog.update(
        { featured_image_url: featuredImageUrl, featured_media_id: featured?.id ?? null },
        { where: { id: blogId }, transaction }
      );
    }

    await transaction.commit();
    return res.status(200).json({
      message: 'Media attached successfully',
      blog_id: blogId,
      featured_image_url: featuredImageUrl,
      attached: blogMediaRows.length,
    });

  } catch (err) {
    await transaction.rollback();
    console.error('[attachMediaToBlog]', err);
    return res.status(500).json({ message: 'Failed to attach media', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// removeMediaFromBlog
// ─────────────────────────────────────────────────────────────────────────────
export const removeMediaFromBlog = async (req, res) => {
  const { id: blogId, mediaId } = req.params;
  if (!isUUID(mediaId)) return res.status(400).json({ message: 'Invalid media ID' });

  const transaction = await db.sequelize.transaction();
  try {
    const row = await db.BlogMedia.findOne({ where: { blog_id: blogId, media_id: mediaId }, transaction });
    if (!row) { await transaction.rollback(); return res.status(404).json({ message: 'Media not found on this blog post' }); }

    const wasMain = row.role === 'main';
    await row.destroy({ transaction });

    if (wasMain) {
      await db.Blog.update(
        { featured_image_url: null, featured_media_id: null },
        { where: { id: blogId }, transaction }
      );
    }

    await db.Media.update(
      { entity_type: 'general', entity_id: null },
      { where: { id: mediaId, entity_id: blogId }, transaction }
    );

    await transaction.commit();
    return res.status(200).json({ message: 'Media removed from blog post', media_id: mediaId, blog_id: blogId });

  } catch (err) {
    await transaction.rollback();
    console.error('[removeMediaFromBlog]', err);
    return res.status(500).json({ message: 'Failed to remove media', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// getTags
// ─────────────────────────────────────────────────────────────────────────────
export const getTags = async (_req, res) => {
  try {
    // Raw SQL for everything tag-related — zero risk of paranoid scope bleed
    const rows = await db.sequelize.query(
      `SELECT t.id, t.name, t.slug,
              COUNT(DISTINCT b.id) AS post_count
         FROM tags t
         LEFT JOIN blog_tags bt ON bt.tag_id = t.id
         LEFT JOIN blogs b
                ON b.id = bt.blog_id
               AND b.status = 'published'
               AND b.deleted_at IS NULL
         GROUP BY t.id, t.name, t.slug
         ORDER BY t.name ASC`,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    const tags = rows.map((r) => ({
      id:    r.id,
      name:  r.name,
      slug:  r.slug,
      count: Number(r.post_count),
    }));

    return res.status(200).json({ tags });
  } catch (err) {
    console.error('[getTags]', err);
    return res.status(500).json({ message: 'Failed to fetch tags', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// bulkStatusUpdate
// ─────────────────────────────────────────────────────────────────────────────
export const bulkStatusUpdate = async (req, res) => {
  const { ids, status } = req.body;

  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: 'ids must be a non-empty array' });
  if (!['draft','published','archived'].includes(status)) return res.status(400).json({ message: 'Invalid status value' });
  if (ids.some((id) => !isUUID(id))) return res.status(400).json({ message: 'All ids must be valid UUIDs' });

  try {
    const updates = { status };
    if (status === 'published') {
      updates.published_at = db.sequelize.literal('CASE WHEN published_at IS NULL THEN NOW() ELSE published_at END');
    }

    const [affected] = await db.Blog.update(updates, { where: { id: { [Op.in]: ids } } });
    return res.status(200).json({ message: `${affected} post(s) updated to "${status}"`, affected_rows: affected });

  } catch (err) {
    console.error('[bulkStatusUpdate]', err);
    return res.status(500).json({ message: 'Bulk update failed', error: err.message });
  }
};