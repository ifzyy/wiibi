import db from '../models/index.js';
import NodeCache from 'node-cache';
import { invalidatePageCache } from './publicController.js';
import upload,{processImage} from '../middleware/upload.js';
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

// ADMIN ENDPOINTS (protected – no public cache)
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
      attributes: ['id', 'name', 'slug', 'price', 'sale_price', 'stock', 'category', 'featured_image_url', 'is_visible'],
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

      if (req.file?.processedUrl) {
        productData.featured_image_url = req.file.processedUrl;
      }

      const product = await db.Product.create(productData);
      invalidatePageCache('store');
      publicCache.del(CACHE_KEY_LIST); // invalidate list cache

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
      const product = await db.Product.findByPk(id);
      if (!product) return res.status(404).json({ message: 'Product not found' });

      const updates = { ...req.body };

      if (req.file?.processedUrl) {
        // Delete old image file if exists
        if (product.featured_image_url) {
          const oldPath = path.join(process.cwd(), 'public', product.featured_image_url);
          try { await fs.unlink(oldPath); } catch {}
        }
        updates.featured_image_url = req.file.processedUrl;
      }

      await product.update(updates);
      invalidatePageCache('store');
      publicCache.del(CACHE_KEY_LIST);
      publicCache.del(CACHE_KEY_DETAIL(product.slug));

      res.json(product);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message || 'Server error' });
    }
  },
];

// POST /api/admin/products/bulk – for sync all
export const bulkUpdateProducts = async (req, res) => {
  try {
    const { products } = req.body;

    await Promise.all(
      products.map(p => 
        db.Product.upsert({
          id: p.id,
          ...p,
        })
      )
    );

    invalidatePageCache('store');
    publicCache.del(CACHE_KEY_LIST);

    res.json({ message: 'Products synced' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Sync failed' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await db.Product.findByPk(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Delete associated image file
    if (product.featured_image_url) {
      const filePath = path.join(process.cwd(), 'public', product.featured_image_url);
      try { await fs.unlink(filePath); } catch {}
    }

    await product.destroy();
    invalidatePageCache('store');
    publicCache.del(CACHE_KEY_LIST);
    publicCache.del(CACHE_KEY_DETAIL(product.slug));

    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
