import db from '../models/index.js';
import NodeCache from 'node-cache';
import { invalidatePageCache } from './publicController.js';
import upload, { processImage } from '../middleware/upload.js';
import path from 'path';
import fs from 'fs/promises';

// In-memory cache for public endpoints
const publicCache = new NodeCache({
  stdTTL: 300,
  checkperiod: 600,
  maxKeys: 1000,
  useClones: false,
});

const CACHE_KEY_LIST = 'public:products:list';
const CACHE_KEY_DETAIL = (slug) => `public:product:${slug}`;

// ── ADMIN ENDPOINTS ──────────────────────────────────────────────────────────

export const getAdminProducts = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[db.Sequelize.Op.or] = [
        { name: { [db.Sequelize.Op.iLike]: `%${search}%` } },
        { description: { [db.Sequelize.Op.iLike]: `%${search}%` } },
      ];
    }
    if (category) where.category = category;

    const { count, rows } = await db.Product.findAndCountAll({
      where,
      include: [
        { model: db.Media, as: 'featuredImage' },
        { model: db.Media, as: 'galleryImages' },
      ],
      attributes: [
        'id', 'name', 'slug', 'price', 'sale_price', 'stock', 'category',
        'featured_image_id', 'gallery_image_ids', 'is_visible', 'is_featured',
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      products: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createProduct = [
  upload.single('featuredImage'),
  processImage,
  async (req, res) => {
    try {
      const productData = { ...req.body };

      let featuredImageId = null;

      // Handle featured image upload
      if (req.file?.processedUrl) {
        const media = await db.Media.create({
          url: req.file.processedUrl,
          filename: req.file.filename,
          mime_type: req.file.mimetype,
          type: 'image',
          size_bytes: req.file.size,
          width: 1200, // update from sharp if needed
          height: 1200,
          alt_text: req.body.altText || productData.name,
          uploaded_by: req.user.id,
          entity_type: 'product',
          entity_id: null, // will update after product creation
          is_featured: true,
          display_order: 0,
        });

        featuredImageId = media.id;
      }

      const product = await db.Product.create({
        ...productData,
        featured_image_id: featuredImageId,
        gallery_image_ids: JSON.stringify([]), // empty gallery initially
      });

      // Link media to newly created product
      if (featuredImageId) {
        await db.Media.update(
          { entity_id: product.id },
          { where: { id: featuredImageId } }
        );
      }

      invalidatePageCache('store');
      publicCache.del(CACHE_KEY_LIST);

      res.status(201).json(product);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message || 'Server error' });
    }
  },
];

export const updateProduct = [
  upload.single('featuredImage'),
  processImage,
  async (req, res) => {
    try {
      const { id } = req.params;
      const product = await db.Product.findByPk(id, {
        include: [{ model: db.Media, as: 'featuredImage' }],
      });

      if (!product) return res.status(404).json({ message: 'Product not found' });

      const updates = { ...req.body };

      // Handle featured image replacement
      if (req.file?.processedUrl) {
        let newMediaId = null;

        // Create new media record
        const newMedia = await db.Media.create({
          url: req.file.processedUrl,
          filename: req.file.filename,
          mime_type: req.file.mimetype,
          type: 'image',
          size_bytes: req.file.size,
          alt_text: req.body.altText || product.name,
          uploaded_by: req.user.id,
          entity_type: 'product',
          entity_id: product.id,
          is_featured: true,
          display_order: 0,
        });

        newMediaId = newMedia.id;

        // Soft-delete old featured image if exists
        if (product.featured_image_id) {
          await db.Media.update(
            { deleted_at: new Date() },
            { where: { id: product.featured_image_id } }
          );
        }

        updates.featured_image_id = newMediaId;
      }

      await product.update(updates);

      invalidatePageCache('store');
      publicCache.del(CACHE_KEY_LIST);
      publicCache.del(CACHE_KEY_DETAIL(product.slug));

      // Reload with updated associations
      const updatedProduct = await db.Product.findByPk(id, {
        include: [
          { model: db.Media, as: 'featuredImage' },
          { model: db.Media, as: 'galleryImages' },
        ],
      });

      res.json(updatedProduct);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message || 'Server error' });
    }
  },
];

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await db.Product.findByPk(id, {
      include: [{ model: db.Media, as: 'featuredImage' }],
    });

    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Soft-delete associated featured image
    if (product.featured_image_id) {
      await db.Media.update(
        { deleted_at: new Date() },
        { where: { id: product.featured_image_id } }
      );
    }

    // Soft-delete product
    await product.destroy();

    invalidatePageCache('store');
    publicCache.del(CACHE_KEY_LIST);
    publicCache.del(CACHE_KEY_DETAIL(product.slug));

    res.json({ message: 'Product and associated media deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Bulk sync (for admin bulk save)
export const bulkUpdateProducts = async (req, res) => {
  try {
    const { products } = req.body;

    await Promise.all(
      products.map(async (p) => {
        // If featured_image_id is provided, ensure it exists and is linked
        if (p.featured_image_id) {
          const media = await db.Media.findByPk(p.featured_image_id);
          if (media) {
            await media.update({
              entity_type: 'product',
              entity_id: p.id,
              is_featured: true,
            });
          }
        }

        await db.Product.upsert(p);
      })
    );

    invalidatePageCache('store');
    publicCache.del(CACHE_KEY_LIST);

    res.json({ message: 'Products synced' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Sync failed' });
  }
};

// ── PUBLIC ENDPOINTS ────────────────────────────────────────────────────────

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
      include: [
        { model: db.Media, as: 'featuredImage' },
      ],
      attributes: [
        'id', 'name', 'slug', 'price', 'sale_price', 'featured_image_id',
        'short_description', 'category', 'is_featured',
      ],
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
      include: [
        { model: db.Media, as: 'featuredImage' },
        { model: db.Media, as: 'galleryImages' },
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