import db from '../models/index.js';
import { Op } from 'sequelize';

// ============================================================================
// GLOBALS SERVICE
// ============================================================================

const globalsService = {
  async getAll() {
    const rows = await db.GlobalSetting.findAll({
      where:      { is_public: true },
      attributes: ['key', 'value'],
    });
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  },

  buildStats(globals) {
    return Object.keys(globals)
      .filter(k => k.startsWith('stats.') && k.endsWith('.value'))
      .map(key => {
        const labelKey = key.replace('.value', '.label');
        return {
          label: globals[labelKey] ?? key
            .replace('stats.', '')
            .replace('.value', '')
            .replace(/_/g, ' '),
          value: globals[key],
        };
      });
  },
};

// ============================================================================
// PAGE SERVICE
// ============================================================================

const pageService = {
  async getBySlug(slug) {
    return db.Page.findOne({
      where:      { slug, status: 'published' },
      attributes: ['id', 'title', 'slug', 'meta_title', 'meta_description'],
      include: [{
        model:      db.PageSection,
        where:      { is_visible: true },
        attributes: ['id', 'section_type', 'display_order', 'content'],
        required:   false,
        order:      [['display_order', 'ASC']],
        include: [{
          model:    db.PageSectionMedia,
          as:       'mediaRelations',
          required: false,
          order:    [['display_order', 'ASC']],
          include: [{
            model:      db.Media,
            as:         'media',
            attributes: ['id', 'url', 'alt_text', 'mime_type', 'is_external'],
          }],
        }],
      }],
    });
  },

  formatSections(page) {
    return page.PageSections.map(section => ({
      id:      section.id,
      type:    section.section_type,
      order:   section.display_order,
      content: section.content || {},
      media:   (section.mediaRelations || [])
        .map(rel => ({
          id:            rel.media?.id,
          url:           rel.media?.url,
          alt_text:      rel.media?.alt_text || rel.caption || `Image for ${section.section_type}`,
          role:          rel.role,
          display_order: rel.display_order,
          caption:       rel.caption,
          is_external:   rel.media?.is_external || false,
        }))
        .filter(m => m.url),
    }));
  },

  buildPayload(page, sections, globals, stats) {
    return {
      page: {
        id:               page.id,
        title:            page.title,
        slug:             page.slug,
        meta_title:       page.meta_title || page.title,
        meta_description: page.meta_description || '',
      },
      sections,
      globals,
      stats,
      timestamp: new Date().toISOString(),
    };
  },
};

// ============================================================================
// PRODUCT SERVICE
// ============================================================================

const PRODUCT_ATTRIBUTES = {
  LIST: [
    'id', 'name', 'slug', 'price', 'sale_price', 'stock', 'sku',
    'category', 'listing_type', 'short_description', 'caption',
    'brand', 'is_visible', 'is_featured', 'featured_image_url',
    'tags', 'warranty_duration', 'trust_badges', 'powered_devices','createdAt',
  ],
  DETAIL: [
    'id', 'name', 'slug', 'price', 'sale_price', 'stock', 'sku',
    'category', 'listing_type', 'short_description', 'caption',
    'brand', 'is_visible', 'is_featured', 'featured_image_url',
    'tags', 'warranty_duration', 'trust_badges', 'powered_devices',
    'description', 'specifications', 'system_specification','createdAt',
    'warranty_details',
  ],
};

const normalizeProductResponse = (data = {}) => {
  const normalized = { ...data };

  if (normalized.salePrice !== undefined) {
    normalized.sale_price = normalized.sale_price ?? normalized.salePrice;
    delete normalized.salePrice;
  }
  if (normalized.shortDescription !== undefined) {
    normalized.short_description = normalized.short_description ?? normalized.shortDescription;
    delete normalized.shortDescription;
  }
  if (normalized.warrantyDuration !== undefined) {
    normalized.warranty_duration = normalized.warranty_duration ?? normalized.warrantyDuration;
    delete normalized.warrantyDuration;
  }
  if (normalized.trustBadges !== undefined) {
    normalized.trust_badges = normalized.trust_badges ?? normalized.trustBadges;
    delete normalized.trustBadges;
  }
  if (normalized.systemSpecification !== undefined) {
    normalized.system_specification = normalized.system_specification ?? normalized.systemSpecification;
    delete normalized.systemSpecification;
  }
  if (normalized.warrantyDetails !== undefined) {
    normalized.warranty_details = normalized.warranty_details ?? normalized.warrantyDetails;
    delete normalized.warrantyDetails;
  }
  if (normalized.featuredImageUrl !== undefined) {
    normalized.featured_image_url = normalized.featured_image_url ?? normalized.featuredImageUrl;
    delete normalized.featuredImageUrl;
  }

  return normalized;
};

const productService = {
  mediaInclude() {
    return {
      model:   db.ProductMedia,
      as:      'mediaRelations',
      include: [{ model: db.Media, as: 'media' }],
      order:   [['display_order', 'ASC']],
    };
  },

  componentsInclude() {
    return {
      model: db.ProductComponent,
      as:    'components',
      order: [['sort_order', 'ASC']],
    };
  },

  format(product) {
    const data      = normalizeProductResponse(product.toJSON());
    const mediaRels = data.mediaRelations || [];

    const mainMedia        = mediaRels.find(r => r.role === 'main');
    const featuredImageUrl =
      data.featured_image_url  ||
      mainMedia?.media?.url    ||
      mediaRels[0]?.media?.url ||
      null;

    const images = mediaRels
      .filter(r => r.role !== 'main')
      .sort((a, b) => a.display_order - b.display_order)
      .map(r => ({
        url:     r.media?.url || null,
        caption: r.caption || r.media?.alt_text || null,
        role:    r.role,
      }))
      .filter(i => i.url);

    if (mainMedia?.media?.url) {
      images.unshift({
        url:     mainMedia.media.url,
        caption: mainMedia.caption || mainMedia.media?.alt_text || null,
        role:    'main',
      });
    }

    return { ...data, featured_image_url: featuredImageUrl, images, mediaRelations: undefined };
  },

  buildWhere(filters) {
    const where = {};
    const { search, category, listing_type, min_price, max_price, is_featured, is_visible } = filters;

    if (typeof is_visible  !== 'undefined') where.is_visible  = is_visible;
    if (typeof is_featured !== 'undefined') where.is_featured = is_featured;
    if (category)     where.category     = category;
    if (listing_type) where.listing_type = listing_type;

    if (min_price || max_price) {
      where.price = {};
      if (min_price) where.price[Op.gte] = parseFloat(min_price);
      if (max_price) where.price[Op.lte] = parseFloat(max_price);
    }

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      where[Op.or] = [
        { name:              { [Op.like]: term } },
        { description:       { [Op.like]: term } },
        { short_description: { [Op.like]: term } },
        { brand:             { [Op.like]: term } },
        { sku:               { [Op.like]: term } },
      ];
    }

    return where;
  },

  buildOrder(sort = '') {
    const orderMap = {
      price_asc:  [['price',       'ASC']],
      price_desc: [['price',       'DESC']],
      name_asc:   [['name',        'ASC']],
      name_desc:  [['name',        'DESC']],
      featured:   [['is_featured', 'DESC'], ['createdAt', 'DESC']],
      newest:     [['createdAt',  'DESC']],
    };
    return orderMap[sort] ?? [['createdAt', 'DESC']];
  },

  calculateRatingSummary(reviews) {
    const total = reviews.length;
    if (!total) return { average: 0, total: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    const average = parseFloat(
      (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)
    );
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => breakdown[r.rating]++);
    Object.keys(breakdown).forEach(k => {
      breakdown[k] = Math.round((breakdown[k] / total) * 100);
    });
    return { average, total, breakdown };
  },
};

// ============================================================================
// PROJECT SERVICE
// ============================================================================

const projectService = {
  mediaInclude() {
    return {
      model:   db.ProjectMedia,
      as:      'mediaRelations',
      include: [{ model: db.Media, as: 'media' }],
      order:   [['display_order', 'ASC']],
    };
  },

  format(project) {
    return {
      ...project.toJSON(),
      galleryImages:  project.mediaRelations?.map(rel => rel.media) || [],
      mediaRelations: undefined,
    };
  },

  LIST_ATTRIBUTES: [
    'id', 'title', 'slug', 'year', 'location', 'type',
    'overview', 'is_featured', 'display_order',
  ],

  DETAIL_ATTRIBUTES: [
    'id', 'title', 'slug', 'year', 'location', 'overview',
    'problem', 'solution', 'results', 'conclusion',
  ],
};

// ============================================================================
// CONTROLLERS — PAGES
// ============================================================================

export const getPageBySlug = async (req, res) => {
console.log('[getPageBySlug] slug:', req.params.slug);  // ← add this
  try {
    const { slug = 'home' } = req.params;

    const page = await pageService.getBySlug(slug);
    if (!page) {
      return res.status(404).json({
        message: 'Page not found or not published',
        fallback: { title: 'Page Not Found', content: 'The requested page is unavailable or still in draft.' },
      });
    }

    const sections = pageService.formatSections(page);
    const globals  = await globalsService.getAll();
    const stats    = globalsService.buildStats(globals);

    return res.json(pageService.buildPayload(page, sections, globals, stats));
  } catch (err) {
    console.error('Page fetch error:', err);
    return res.status(500).json({
      message: 'Internal server error while fetching page content',
      error:   process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

export const getHomepage = (req, res) => {
  req.params.slug = 'home';
  return getPageBySlug(req, res);
};

// ============================================================================
// CONTROLLERS — PRODUCTS
// ============================================================================

export const getPublicProducts = async (req, res) => {
  try {
    const {
      search, category, listing_type,
      min_price, max_price, is_featured,
      sort = '', page = 1, limit = 24,
    } = req.query;

    const parsedPage  = Math.max(1, parseInt(page));
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit)));
    const offset      = (parsedPage - 1) * parsedLimit;

    const where = productService.buildWhere({
      search, category, listing_type, min_price, max_price,
      is_visible: true,
      is_featured: typeof is_featured !== 'undefined'
        ? is_featured === 'true'
        : undefined,
    });

    const { count, rows } = await db.Product.findAndCountAll({
      where,
      attributes: PRODUCT_ATTRIBUTES.LIST,
      include:    [productService.mediaInclude()],
      order:      productService.buildOrder(sort),
      limit:      parsedLimit,
      offset,
      distinct:   true,
    });

    return res.json({
      products: rows.map(productService.format),
      pagination: {
        total: count,
        page:  parsedPage,
        pages: Math.ceil(count / parsedLimit),
        limit: parsedLimit,
      },
    });
  } catch (err) {
    console.error('getPublicProducts error:', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

export const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await db.Product.findOne({
      where:      { slug, is_visible: true },
      attributes: PRODUCT_ATTRIBUTES.DETAIL,
      include: [
        productService.mediaInclude(),
        productService.componentsInclude(),
        {
          model:      db.ProductReview,
          as:         'reviews',
          attributes: ['id', 'rating', 'title', 'body', 'author', 'verified', 'created_at'],
          limit:      20,
          order:      [['created_at', 'DESC']],
        },
      ],
    });

    if (!product) return res.status(404).json({ message: 'Product not found' });

    const formatted     = productService.format(product);
    const ratingSummary = productService.calculateRatingSummary(product.reviews || []);

    return res.json({ ...formatted, rating_summary: ratingSummary });
  } catch (err) {
    console.error('getPublicProduct error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// CONTROLLERS — FAQs
// ============================================================================

export const getPublicFaqs = async (req, res) => {
  try {
    const faqs = await db.Faq.findAll({
      where:      { is_visible: true },
      order:      [['display_order', 'ASC']],
      attributes: ['id', 'question', 'answer'],
    });
    return res.json(faqs);
  } catch (err) {
    console.error('Get public FAQs error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// CONTROLLERS — PROJECTS
// ============================================================================

export const getPublicProjects = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const parsedPage  = parseInt(page);
    const parsedLimit = parseInt(limit);
    const offset      = (parsedPage - 1) * parsedLimit;

    const { count, rows } = await db.Project.findAndCountAll({
      where:      { is_visible: true },
      include:    [projectService.mediaInclude()],
      attributes: projectService.LIST_ATTRIBUTES,
      limit:      parsedLimit,
      offset,
    });

    return res.json({
      projects: rows.map(projectService.format),
      pagination: {
        total: count,
        page:  parsedPage,
        pages: Math.ceil(count / parsedLimit),
        limit: parsedLimit,
      },
    });
  } catch (err) {
    console.error('Get public projects error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getProjectBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const project = await db.Project.findOne({
      where:      { slug, is_visible: true },
      include:    [projectService.mediaInclude()],
      attributes: projectService.DETAIL_ATTRIBUTES,
    });

    if (!project) return res.status(404).json({ message: 'Project not found' });

    return res.json(projectService.format(project));
  } catch (err) {
    console.error('Get project by slug error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// no-op so any file that imports invalidatePageCache doesn't break
export const invalidatePageCache = () => {};