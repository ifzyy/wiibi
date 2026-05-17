/**
 * middleware/validateBlog.js
 *
 * Express middleware for validating blog create / update payloads.
 * Uses no external library — mirrors the validation pattern used throughout
 * the existing codebase.
 */

// ── Allowed values ─────────────────────────────────────────────────────────────
const ALLOWED_STATUSES = ['draft', 'published', 'archived'];
const SLUG_RE          = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID_RE          = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ── Helper ─────────────────────────────────────────────────────────────────────
const isValidUUID  = (v) => UUID_RE.test(v);
const isString     = (v) => typeof v === 'string';
const notEmpty     = (v) => isString(v) && v.trim().length > 0;
const maxLen       = (v, n) => isString(v) && v.length <= n;

// ── validateCreateBlog ─────────────────────────────────────────────────────────
/**
 * POST /api/admin/blog
 * Required: title
 * Optional: slug (auto-generated if absent), content, excerpt, status,
 *           author_name, tags (array of strings), meta_title, meta_description,
 *           featured_media_id, featured_image_url
 */
export const validateCreateBlog = (req, _res, next) => {
  const errors = [];
  const b      = req.body;

  // title
  if (!notEmpty(b.title))              errors.push('title is required and must be a non-empty string');
  else if (!maxLen(b.title, 500))      errors.push('title must be ≤ 500 characters');

  // slug (optional at create — controller auto-generates from title when absent)
  if (b.slug !== undefined && b.slug !== '') {
    if (!SLUG_RE.test(b.slug.trim())) errors.push('slug must be URL-safe (lowercase letters, numbers, hyphens only)');
    else if (!maxLen(b.slug, 600))    errors.push('slug must be ≤ 600 characters');
  }

  // status
  if (b.status !== undefined && !ALLOWED_STATUSES.includes(b.status)) {
    errors.push(`status must be one of: ${ALLOWED_STATUSES.join(', ')}`);
  }

  // content (optional but validated when present)
  if (b.content !== undefined && !isString(b.content)) {
    errors.push('content must be a string');
  }

  // excerpt
  if (b.excerpt !== undefined && !maxLen(b.excerpt, 1000)) {
    errors.push('excerpt must be ≤ 1000 characters');
  }

  // author_name
  if (b.author_name !== undefined && !maxLen(b.author_name, 255)) {
    errors.push('author_name must be ≤ 255 characters');
  }

  // tags
  if (b.tags !== undefined) {
    if (!Array.isArray(b.tags)) errors.push('tags must be an array of strings');
    else if (b.tags.some((t) => !isString(t) || !notEmpty(t))) {
      errors.push('each tag must be a non-empty string');
    } else if (b.tags.some((t) => t.length > 100)) {
      errors.push('each tag must be ≤ 100 characters');
    }
  }

  // featured_media_id
  if (b.featured_media_id && !isValidUUID(b.featured_media_id)) {
    errors.push('featured_media_id must be a valid UUID');
  }

  // meta fields
  if (b.meta_title       !== undefined && !maxLen(b.meta_title,       500))  errors.push('meta_title must be ≤ 500 characters');
  if (b.meta_description !== undefined && !maxLen(b.meta_description, 1000)) errors.push('meta_description must be ≤ 1000 characters');

  if (errors.length > 0) {
    return _res.status(422).json({ message: 'Validation failed', errors });
  }

  next();
};

// ── validateUpdateBlog ─────────────────────────────────────────────────────────
/**
 * PATCH /api/admin/blog/:id
 * All fields are optional — validates only what is present.
 */
export const validateUpdateBlog = (req, _res, next) => {
  const errors = [];
  const b      = req.body;

  if (b.title !== undefined) {
    if (!notEmpty(b.title))        errors.push('title must be a non-empty string');
    else if (!maxLen(b.title, 500)) errors.push('title must be ≤ 500 characters');
  }

  if (b.slug !== undefined && b.slug !== '') {
    if (!SLUG_RE.test(b.slug.trim())) errors.push('slug must be URL-safe');
    else if (!maxLen(b.slug, 600))    errors.push('slug must be ≤ 600 characters');
  }

  if (b.status !== undefined && !ALLOWED_STATUSES.includes(b.status)) {
    errors.push(`status must be one of: ${ALLOWED_STATUSES.join(', ')}`);
  }

  if (b.content !== undefined && !isString(b.content)) errors.push('content must be a string');

  if (b.excerpt !== undefined && !maxLen(b.excerpt, 1000)) errors.push('excerpt must be ≤ 1000 characters');

  if (b.author_name !== undefined && !maxLen(b.author_name, 255)) errors.push('author_name must be ≤ 255 characters');

  if (b.tags !== undefined) {
    if (!Array.isArray(b.tags)) errors.push('tags must be an array');
    else if (b.tags.some((t) => !isString(t) || !notEmpty(t))) errors.push('each tag must be a non-empty string');
    else if (b.tags.some((t) => t.length > 100)) errors.push('each tag must be ≤ 100 characters');
  }

  if (b.featured_media_id && !isValidUUID(b.featured_media_id)) {
    errors.push('featured_media_id must be a valid UUID');
  }

  if (b.meta_title       !== undefined && !maxLen(b.meta_title,       500))  errors.push('meta_title must be ≤ 500 characters');
  if (b.meta_description !== undefined && !maxLen(b.meta_description, 1000)) errors.push('meta_description must be ≤ 1000 characters');

  if (errors.length > 0) {
    return _res.status(422).json({ message: 'Validation failed', errors });
  }

  next();
};

// ── validateBlogId ─────────────────────────────────────────────────────────────
/**
 * Ensures :id route param is a valid UUID before reaching the controller.
 */
export const validateBlogId = (req, res, next) => {
  if (!isValidUUID(req.params.id)) {
    return res.status(400).json({ message: 'Invalid blog ID — must be a UUID' });
  }
  next();
};

// ── validateAttachMedia ────────────────────────────────────────────────────────
/**
 * POST /api/admin/blog/:id/media/attach
 * Body must contain at least one of: featured (object with id) or gallery (array).
 */
export const validateAttachMedia = (req, res, next) => {
  const errors  = [];
  const { featured, gallery = [] } = req.body;

  if (!featured && (!Array.isArray(gallery) || gallery.length === 0)) {
    return res.status(400).json({ message: 'Provide at least one media item to attach (featured or gallery)' });
  }

  if (featured) {
    if (!featured.id || !isValidUUID(featured.id)) errors.push('featured.id must be a valid UUID');
    if (!featured.url || !isString(featured.url))  errors.push('featured.url must be a string');
  }

  if (Array.isArray(gallery)) {
    gallery.forEach((item, i) => {
      if (!item?.id || !isValidUUID(item.id))    errors.push(`gallery[${i}].id must be a valid UUID`);
      if (!item?.url || !isString(item.url))     errors.push(`gallery[${i}].url must be a string`);
    });
  }

  if (errors.length > 0) return res.status(422).json({ message: 'Validation failed', errors });

  next();
};