import db from '../models/index.js';
import { Op } from 'sequelize';
import { invalidatePageCache } from './publicController.js';
import { generateUniqueSlug } from '../utils/generateSlug.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const PRODUCT_ATTRIBUTES = {
  LIST: [
    'id', 'name', 'slug', 'price', 'sale_price', 'stock', 'sku',
    'category', 'listing_type', 'short_description', 'caption',
    'brand', 'is_visible', 'is_featured', 'featured_image_url',
    'tags', 'warranty_duration', 'trust_badges', 'powered_devices',
    'specifications', 'system_specification',
    'createdAt', 'updatedAt',
  ],
  DETAIL: [
    'id', 'name', 'slug', 'price', 'sale_price', 'stock', 'sku',
    'category', 'listing_type', 'short_description', 'caption',
    'brand', 'is_visible', 'is_featured', 'featured_image_url',
    'tags', 'warranty_duration', 'trust_badges', 'powered_devices',
    'description', 'specifications', 'system_specification',
    'warranty_details', 'createdAt', 'updatedAt',
  ],
};

// Whitelist for product scalar fields only.
// components is handled separately — never goes through this whitelist.
const WRITABLE_FIELDS = [
  'name', 'slug', 'category', 'listing_type', 'brand', 'sku',
  'price', 'sale_price', 'stock',
  'is_featured', 'is_visible',
  'short_description', 'caption', 'description', 'featured_image_url',
  'tags', 'warranty_duration', 'warranty_details',
  'specifications', 'system_specification',
  'powered_devices', 'trust_badges',
];

const formatWarrantyDuration = (value) => {
  if (value == null) return null;
  const parsed = typeof value === 'number'
    ? Number(value)
    : Number(String(value).replace(/[^0-9]+/g, '').trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return `${parsed} year${parsed !== 1 ? 's' : ''}`;
};

const normalizeProductPayload = (data = {}) => ({
  ...data,
  listing_type:      data.listing_type      ?? data.listingType,
  sale_price:        data.sale_price        ?? data.salePrice,
  short_description: data.short_description ?? data.shortDescription,
  featured_image_url: data.featured_image_url ?? data.featuredImageUrl,
  warranty_duration: data.warranty_duration
                       ?? data.warrantyDuration
                       ?? formatWarrantyDuration(data.warranty)
                       ?? formatWarrantyDuration(data.warranty_years),
  warranty_details:  data.warranty_details  ?? data.warrantyDetails,
  system_specification: data.system_specification ?? data.systemSpecification,
  powered_devices:      data.powered_devices      ?? data.poweredDevices,
  trust_badges:         data.trust_badges         ?? data.trustBadges,
  is_visible:           data.is_visible           ?? data.isVisible,
  is_featured:          data.is_featured          ?? data.isFeatured,
});

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

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest'          },
  { value: 'featured',   label: 'Featured first'  },
  { value: 'price_asc',  label: 'Price: Low–High' },
  { value: 'price_desc', label: 'Price: High–Low' },
  { value: 'name_asc',   label: 'Name: A–Z'       },
  { value: 'name_desc',  label: 'Name: Z–A'       },
];

// ============================================================================
// DATABASE HELPERS
// ============================================================================

const dbHelpers = {
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

  reviewsInclude(limit = 20) {
    return {
      model:      db.ProductReview,
      as:         'reviews',
      attributes: ['id', 'rating', 'title', 'body', 'author', 'verified', 'created_at'],
      limit,
      order: [['created_at', 'DESC']],
    };
  },
};

// ============================================================================
// COMPONENT HELPERS
// ============================================================================

const normaliseComponents = (raw = []) =>
  raw
    .filter(c => c?.name?.trim())
    .map((c, i) => ({
      name:        c.name.trim(),
      qty:         Number(c.qty) || 1,
      image:       typeof c.image === 'string' && c.image ? c.image : null,
      description: c.description?.trim() || null,
      specs:       Array.isArray(c.specs) && c.specs.length > 0 ? c.specs : null,
      sort_order:  c.sort_order ?? i,
    }));

const syncComponents = async (productId, rawComponents, transaction) => {
  const components = normaliseComponents(rawComponents);

  await db.ProductComponent.destroy({
    where:       { product_id: productId },
    transaction,
  });

  if (!components.length) return [];

  const rows = components.map(c => ({ ...c, product_id: productId }));
  const created = await db.ProductComponent.bulkCreate(rows, { transaction });
  console.log(`[syncComponents] product_id=${productId} → ${created.length} components saved`);
  return created;
};

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

const formatters = {
  product(product) {
    const data      = normalizeProductResponse(product.toJSON());
    const mediaRels = data.mediaRelations || [];

    const mainMedia = mediaRels.find(r => r.role === 'main');

    const featuredImageUrl =
      data.featured_image_url  ||
      mainMedia?.media?.url    ||
      mediaRels[0]?.media?.url ||
      null;

    const images = mediaRels
      .filter(r => r.role !== 'main')
      .sort((a, b) => a.display_order - b.display_order)
      .map(r => ({
        id:      r.media_id,
        url:     r.media?.url || null,
        caption: r.caption || r.media?.alt_text || null,
        role:    r.role,
      }))
      .filter(i => i.url);

    if (mainMedia?.media?.url) {
      images.unshift({
        id:      mainMedia.media_id,
        url:     mainMedia.media.url,
        caption: mainMedia.caption || mainMedia.media?.alt_text || null,
        role:    'main',
      });
    }

    return {
      ...data,
      featured_image_url: featuredImageUrl,
      images,
      mediaRelations: undefined,
    };
  },

  ratingSummary(reviews) {
    const total = reviews.length;
    if (!total) {
      return { average: 0, total: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    }
    const average = parseFloat(
      (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)
    );
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => breakdown[r.rating]++);
    Object.keys(breakdown).forEach(key => {
      breakdown[key] = Math.round((breakdown[key] / total) * 100);
    });
    return { average, total, breakdown };
  },

  pagination(count, page, limit) {
    return {
      total: count,
      page:  parseInt(page),
      pages: Math.ceil(count / limit),
      limit: parseInt(limit),
    };
  },
};

// ============================================================================
// QUERY BUILDERS
// ============================================================================

const queryBuilders = {
  where(filters) {
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

  order(sort = 'newest') {
    const map = {
      price_asc:  [['price',       'ASC']],
      price_desc: [['price',       'DESC']],
      name_asc:   [['name',        'ASC']],
      name_desc:  [['name',        'DESC']],
      featured:   [['is_featured', 'DESC'], ['createdAt', 'DESC']],
      newest:     [['createdAt',   'DESC']],
    };
    return map[sort] ?? [['createdAt', 'DESC']];
  },
};

// ============================================================================
// PUBLIC CONTROLLERS
// ============================================================================

export const getProductFilterMeta = async (req, res) => {
  try {
    const [categories, priceRange] = await Promise.all([
      db.Product.findAll({
        where:      { is_visible: true },
        attributes: ['category', [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count']],
        group:      ['category'],
        order:      [['category', 'ASC']],
        raw:        true,
      }),
      db.Product.findOne({
        where:      { is_visible: true },
        attributes: [
          [db.Sequelize.fn('MIN', db.Sequelize.col('price')), 'min'],
          [db.Sequelize.fn('MAX', db.Sequelize.col('price')), 'max'],
        ],
        raw: true,
      }),
    ]);

    return res.json({
      categories:   categories.map(c => ({ name: c.category, count: parseInt(c.count) })),
      price_range:  { min: parseFloat(priceRange?.min || 0), max: parseFloat(priceRange?.max || 0) },
      sort_options: SORT_OPTIONS,
    });
  } catch (err) {
    console.error('getProductFilterMeta error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await db.Product.findOne({
      where:   { slug, is_visible: true },
      include: [dbHelpers.mediaInclude()],
    });

    if (!product) return res.status(404).json({ message: 'Product not found' });

    return res.json(formatters.product(product));
  } catch (err) {
    console.error('getProductBySlug error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// ADMIN — LIST
// ============================================================================

export const getAdminProducts = async (req, res) => {
  try {
    const {
      search, category, listing_type, min_price, max_price,
      is_featured, is_visible,
      sort  = 'newest',
      page  = 1,
      limit = 20,
    } = req.query;

    const parsedPage  = Math.max(1, parseInt(page));
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit)));
    const offset      = (parsedPage - 1) * parsedLimit;

    const where = queryBuilders.where({
      search, category, listing_type, min_price, max_price,
      is_visible:  typeof is_visible  !== 'undefined' ? is_visible  === 'true' : undefined,
      is_featured: typeof is_featured !== 'undefined' ? is_featured === 'true' : undefined,
    });

    const { count, rows } = await db.Product.findAndCountAll({
      where,
      attributes: PRODUCT_ATTRIBUTES.LIST,
      include:    [dbHelpers.mediaInclude(), dbHelpers.componentsInclude()],
      order:      queryBuilders.order(sort),
      limit:      parsedLimit,
      offset,
      distinct:   true,
    });

    return res.json({
      products:   rows.map(formatters.product),
      pagination: formatters.pagination(count, parsedPage, parsedLimit),
    });
  } catch (err) {
    console.error('getAdminProducts error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// ADMIN — CREATE
// ============================================================================

export const createProduct = async (req, res) => {
  try {
    const data = normalizeProductPayload(req.body);
    console.log('DEBUG createProduct payload received:', {
      warranty_enabled: data.warranty_enabled,
      warranty_duration: data.warranty_duration,
      warranty_details: data.warranty_details,
    });

    if (!data.name?.trim()) {
      return res.status(400).json({ message: 'Product name is required' });
    }
    if (!data.category?.trim()) {
      return res.status(400).json({ message: 'Category is required' });
    }
    if (!data.price || Number(data.price) <= 0) {
      return res.status(400).json({ message: 'A valid price is required' });
    }

    const slug        = await generateUniqueSlug(data.name, null, 'Product');
    const listingType = data.listing_type?.toLowerCase() || 'single';

    const product = await db.sequelize.transaction(async (t) => {
      const created = await db.Product.create({
        name:         data.name.trim(),
        slug,
        category:     data.category.trim(),
        listing_type: listingType,
        brand:        data.brand?.trim()               || null,
        sku:          data.sku?.trim()                 || null,
        price:        Number(data.price),
        sale_price:   data.sale_price ? Number(data.sale_price) : null,
        stock:        Number(data.stock) || 0,
        is_visible:   data.is_visible  ?? true,
        is_featured:  data.is_featured ?? false,
        short_description:    data.short_description?.trim() || null,
        caption:              data.caption?.trim()           || null,
        description:          data.description?.trim()       || null,
        featured_image_url:   data.featured_image_url        || null,
        tags:                 data.tags              || null,
        warranty_duration:    data.warranty_duration || null,
        warranty_details:     data.warranty_details  || null,
        specifications:       data.specifications       || null,
        system_specification: data.system_specification || null,
        powered_devices:      data.powered_devices      || null,
        trust_badges:         data.trust_badges         || null,
      }, { transaction: t });

      if (listingType === 'package' && Array.isArray(data.components) && data.components.length) {
        await syncComponents(created.id, data.components, t);
      }

      return created;
    });

    invalidatePageCache('store');

    return res.status(201).json(product.toJSON());
  } catch (err) {
    console.error('createProduct error:', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

// ============================================================================
// ADMIN — UPDATE
// ============================================================================

export const updateProduct = async (req, res) => {
  try {
    const { id }   = req.params;
    const parsedId = parseInt(id, 10);
    const data     = normalizeProductPayload(req.body);
    console.log('DEBUG updateProduct payload received for id=', parsedId, {
      warranty_enabled: data.warranty_enabled,
      warranty_duration: data.warranty_duration,
      warranty_details: data.warranty_details,
    });

    const product = await db.Product.findByPk(parsedId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const updates = {};
    for (const field of WRITABLE_FIELDS) {
      if (field in data) updates[field] = data[field];
    }

    if (updates.price      != null) updates.price      = Number(updates.price);
    if (updates.sale_price != null) updates.sale_price = updates.sale_price ? Number(updates.sale_price) : null;
    if (updates.stock      != null) updates.stock      = Number(updates.stock);
    if (updates.listing_type)       updates.listing_type = updates.listing_type.toLowerCase();
    if (updates.name)               updates.name         = updates.name.trim();
    if (updates.category)           updates.category     = updates.category.trim();

    if (updates.name && !updates.slug?.trim()) {
      updates.slug = await generateUniqueSlug(updates.name, parsedId, 'Product');
    } else if (updates.slug) {
      updates.slug = await generateUniqueSlug(updates.slug, parsedId, 'Product');
    }

    const listingType = updates.listing_type ?? product.listing_type;

    await db.sequelize.transaction(async (t) => {
      await db.Product.update(updates, {
        where: { id: parsedId },
        transaction: t,
      });

      if ('components' in data) {
        await syncComponents(
          parsedId,
          listingType === 'package' ? (data.components ?? []) : [],
          t,
        );
      }
    });

    invalidatePageCache('store');

    const updated = await db.Product.findByPk(parsedId, {
      include: [
        dbHelpers.mediaInclude(),
        dbHelpers.componentsInclude(),
      ],
    });
console.log('FINAL updates object:', updated.toJSON());
    return res.json(formatters.product(updated));
  } catch (err) {
    console.error('updateProduct error:', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

// ============================================================================
// ADMIN — DELETE
// ============================================================================

export const deleteProduct = async (req, res) => {
  try {
    const { id }  = req.params;
    const product = await db.Product.findByPk(id);

    if (!product) return res.status(404).json({ message: 'Product not found' });

    await db.sequelize.transaction(async (t) => {
      await db.ProductComponent.destroy({ where: { product_id: id }, transaction: t });
      await db.ProductMedia.destroy(    { where: { product_id: id }, transaction: t });
      await product.destroy({ transaction: t });
    });

    invalidatePageCache('store');

    return res.json({ message: 'Product and associated media deleted' });
  } catch (err) {
    console.error('deleteProduct error:', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};