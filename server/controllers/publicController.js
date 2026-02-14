import db from "../models/index.js";
import { Op } from "sequelize";
import NodeCache from "node-cache";

// ---------------------------------------------------------------------------
// node-cache instance
//   stdTTL      — default expiry in seconds for page payloads
//   checkperiod — how often (seconds) the internal sweep removes stale keys
//   maxKeys     — safety cap so memory can't grow unbounded (500 pages max)
//   useClones   — false: skip deep-clone on get/set for better performance
// ---------------------------------------------------------------------------
const cache = new NodeCache({
  stdTTL: 60,
  checkperiod: 120,
  maxKeys: 500,
  useClones: false,
});

const GLOBALS_TTL = 5 * 60; // 5 minutes in seconds

function cacheGet(key)             { return cache.get(key) ?? null; }
function cacheSet(key, value, ttl) { cache.set(key, value, ttl ?? 60); }

// In-memory cache for public endpoints (very fast)
const publicCache = new NodeCache({
  stdTTL: 300,          // 5 minutes
  checkperiod: 600,     // check every 10 min
  maxKeys: 1000,        // safety cap
  useClones: false,     // faster
});

// Cache keys
const CACHE_KEY_LIST = 'public:products:list';
const CACHE_KEY_DETAIL = (slug) => `public:product:${slug}`;

// Call this from your CMS whenever a page or global setting is saved.
export function invalidatePageCache(slug) {
  cache.del(`page:${slug}`);
  cache.del("globals");
}

// ---------------------------------------------------------------------------
// Batch-resolve all media IDs in one query instead of N individual lookups
// ---------------------------------------------------------------------------
async function resolveMediaBatch(ids) {
  if (!ids.length) return {};

  const rows = await db.Media.findAll({
    where: { id: { [Op.in]: [...new Set(ids)] } }, // deduplicate
    attributes: ["id", "url"],                      // only fetch what we need
  });

  return Object.fromEntries(rows.map((m) => [m.id, m.url]));
}

// ---------------------------------------------------------------------------
// Collect every media ID referenced inside a section's content object
// ---------------------------------------------------------------------------
function collectMediaIds(content) {
  const ids = [];

  if (content.background_image_id) ids.push(content.background_image_id);
  if (content.hero_image_id)       ids.push(content.hero_image_id);

  for (const item of [
    ...(content.products     || []),
    ...(content.testimonials || []),
    ...(content.posts        || []),
  ]) {
    if (item.image_id) ids.push(item.image_id);
  }

  return ids;
}

// ---------------------------------------------------------------------------
// Attach resolved URLs back onto a content object using the media map
// ---------------------------------------------------------------------------
function attachMediaUrls(content, mediaMap) {
  if (content.background_image_id)
    content.background_image_url = mediaMap[content.background_image_id] ?? null;

  if (content.hero_image_id)
    content.hero_image_url = mediaMap[content.hero_image_id] ?? null;

  for (const list of ["products", "testimonials", "posts"]) {
    if (content[list]) {
      for (const item of content[list]) {
        if (item.image_id)
          item.image_url = mediaMap[item.image_id] ?? null;
      }
    }
  }

  return content;
}

// ---------------------------------------------------------------------------
// Fetch and cache global settings (these change far less than page views)
// ---------------------------------------------------------------------------
async function getGlobals() {
  const cached = cacheGet("globals");
  if (cached) return cached;

  const rows = await db.GlobalSetting.findAll({
    where: { is_public: true },
    attributes: ["key", "value"],
  });

  const globals = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  cacheSet("globals", globals, GLOBALS_TTL);
  return globals;
}

// ---------------------------------------------------------------------------
// Build the stats convenience array from globals (pure, no DB hit)
// ---------------------------------------------------------------------------
function buildStats(globals) {
  return Object.keys(globals)
    .filter((k) => k.startsWith("stats.") && k.endsWith(".value"))
    .map((key) => {
      const labelKey = key.replace(".value", ".label");
      return {
        label:
          globals[labelKey] ??
          key.replace("stats.", "").replace(".value", "").replace(/_/g, " "),
        value: globals[key],
      };
    });
}

// ---------------------------------------------------------------------------
// Main controller
// ---------------------------------------------------------------------------
export const getPageBySlug = async (req, res) => {
  try {
    const { slug = "home" } = req.params;
    const cacheKey = `page:${slug}`;

    // 1. Return cached response immediately if available
    const cached = cacheGet(cacheKey);
    if (cached) {
      res.set("X-Cache", "HIT");
      return res.json(cached);
    }

    // 2. Fetch page + sections in ONE query (Sequelize eager load)
    const page = await db.Page.findOne({
      where: { slug, status: "published" },
      attributes: ["id", "title", "slug", "meta_title", "meta_description"],
      include: [
        {
          model: db.PageSection,
          where: { is_visible: true },
          attributes: ["id", "section_type", "display_order", "content"],
          required: false, // LEFT JOIN — don't drop pages with no sections
          separate: false, // keep in same query
          order: [["display_order", "ASC"]],
        },
      ],
    });

    if (!page) {
      return res.status(404).json({
        message: "Page not found or not published",
        fallback: {
          title: "Page Not Found",
          content: "The requested page could not be loaded.",
        },
      });
    }

    // 3. Collect ALL media IDs across every section in one pass …
    const allMediaIds = (page.PageSections || []).flatMap((sec) =>
      collectMediaIds(sec.content || {})
    );

    // 4. … then resolve them all in ONE database query
    const mediaMap = await resolveMediaBatch(allMediaIds);

    // 5. Build section list (pure CPU work — no more async calls in loop)
    const sections = (page.PageSections || []).map((sec) => ({
      id:      sec.id,
      type:    sec.section_type,
      order:   sec.display_order,
      content: attachMediaUrls({ ...(sec.content || {}) }, mediaMap),
    }));

    // 6. Globals (independently cached, single query when cold)
    const globals = await getGlobals();

    // 7. Assemble final payload
    const payload = {
      page: {
        id:               page.id,
        title:            page.title,
        slug:             page.slug,
        meta_title:       page.meta_title || page.title,
        meta_description: page.meta_description || "",
      },
      sections,
      globals,
      stats: buildStats(globals),
    };

    // 8. Cache the assembled payload
    cacheSet(cacheKey, payload);

    res.set("X-Cache", "MISS");
    return res.json(payload);

  } catch (err) {
    console.error("Public page error:", err);
    return res.status(500).json({
      message: "Error fetching page content",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Convenience route for homepage
export const getHomepage = async (req, res) => {
  req.params.slug = "home";
  return getPageBySlug(req, res);
};


// PUBLIC ENDPOINTS (cached aggressively)
export const getPublicProducts = async (req, res) => {
  try {
    const cacheKey = CACHE_KEY_LIST;
    const cached = publicCache.get(cacheKey);

    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    const { category, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    const where = { is_visible: true };
    if (category) where.category = category;

    const { count, rows } = await db.Product.findAndCountAll({
      where,
      attributes: ['id', 'name', 'slug', 'price', 'sale_price', 'featured_image_url', 'short_description','stock', 'category'],
      order: [['is_featured', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    const payload = {
      products: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit),
      },
    };

    publicCache.set(cacheKey, payload);
    res.set('X-Cache', 'MISS');
    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const cacheKey = CACHE_KEY_DETAIL(slug);
    const cached = publicCache.get(cacheKey);

    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    const product = await db.Product.findOne({
      where: { slug, is_visible: true },
      attributes: [
        'id', 'name', 'slug', 'description', 'short_description',
        'price', 'sale_price', 'stock', 'category', 'brand',
        'featured_image_url',
      ],
    });

    if (!product) return res.status(404).json({ message: 'Product not found' });

    publicCache.set(cacheKey, product);
    res.set('X-Cache', 'MISS');
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};