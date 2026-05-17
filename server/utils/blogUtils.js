/**
 * utils/blogUtils.js
 * Pure utility helpers for the blog domain.
 */

// ── Slug ──────────────────────────────────────────────────────────────────────
/**
 * Convert any string into a URL-safe slug.
 * "How Solar Panels Work: A Guide!" → "how-solar-panels-work-a-guide"
 */
export const slugify = (text) =>
  text
    .toString()
    .normalize('NFKD')           // decompose accented chars
    .replace(/[\u0300-\u036f]/g, '') // strip combining diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')   // strip non-alphanumeric (keep spaces + hyphens)
    .replace(/\s+/g, '-')           // spaces → hyphens
    .replace(/-{2,}/g, '-')         // collapse multiple hyphens
    .replace(/^-+|-+$/g, '');       // trim leading / trailing hyphens

// ── HTML sanitisation ─────────────────────────────────────────────────────────
/**
 * Strip all HTML tags to plain text.
 * Used for read-time calculation and search snippet generation.
 */
export const stripHtml = (html = '') =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, ' ')
    .trim();

// ── Read time ─────────────────────────────────────────────────────────────────
const WORDS_PER_MINUTE = 200;

/**
 * Calculate estimated reading time from HTML content.
 * Returns the number of minutes, minimum 1.
 */
export const calcReadTime = (html = '') => {
  const wordCount = stripHtml(html)
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
};

// ── Pagination ────────────────────────────────────────────────────────────────
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Parse and clamp pagination params from a request query.
 * Returns { page, limit, offset }.
 */
export const parsePagination = (query) => {
  const page  = Math.max(1, parseInt(query.page,  10) || 1);
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(query.limit, 10) || DEFAULT_PAGE_SIZE),
  );
  return { page, limit, offset: (page - 1) * limit };
};

/**
 * Build a pagination meta object for API responses.
 */
export const buildPaginationMeta = (count, page, limit) => ({
  total:        count,
  per_page:     limit,
  current_page: page,
  total_pages:  Math.ceil(count / limit),
  has_next:     page < Math.ceil(count / limit),
  has_prev:     page > 1,
});

// ── Sorting ───────────────────────────────────────────────────────────────────
const SORTABLE_FIELDS = ['created_at', 'updated_at', 'published_at', 'title', 'view_count'];
const SORT_DIRECTIONS = ['ASC', 'DESC'];

/**
 * Parse ?sort=published_at&order=DESC into a safe Sequelize order array.
 */
export const parseSortOrder = (query) => {
  const field = SORTABLE_FIELDS.includes(query.sort) ? query.sort : 'created_at';
  const dir   = SORT_DIRECTIONS.includes(query.order?.toUpperCase()) ? query.order.toUpperCase() : 'DESC';
  return [[field, dir]];
};