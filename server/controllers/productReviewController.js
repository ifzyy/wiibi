'use strict';

/**
 * controllers/productReviewController.js
 *
 * Public  : getProductReviews   — paginated reviews + rating summary for a product
 * User    : createReview        — authenticated or guest (optionalAuth)
 *           updateReview        — owner only
 *           deleteReview        — owner only
 * Admin   : adminListReviews    — all reviews across all products, filterable
 *           adminDeleteReview   — hard delete any review
 */

import db  from '../models/index.js';
import { Op } from 'sequelize';

// ============================================================================
// CONSTANTS
// ============================================================================

const REVIEW_PUBLIC_ATTRIBUTES = [
  'id', 'rating', 'title', 'body', 'author', 'verified', 'created_at',
];

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

const formatters = {
  /**
   * Compute average rating, total count, and per-star breakdown (as percentages)
   * from an array of { rating } objects.
   * Matches the shape already consumed by the frontend star-breakdown component.
   */
  ratingSummary(reviews) {
    const total = reviews.length;
    if (!total) {
      return { average: 0, total: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    }
    const sum       = reviews.reduce((acc, r) => acc + r.rating, 0);
    const average   = parseFloat((sum / total).toFixed(1));
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => breakdown[r.rating]++);
    Object.keys(breakdown).forEach(k => {
      breakdown[k] = Math.round((breakdown[k] / total) * 100);
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
// PUBLIC — GET REVIEWS FOR A PRODUCT
// ============================================================================

/**
 * GET /api/products/:productId/reviews
 *
 * Query params:
 *   page    — default 1
 *   limit   — default 10, max 50
 *   rating  — filter to a specific star value (1–5)
 *   sort    — newest (default) | highest | lowest
 *
 * Response:
 *   { reviews, ratingSummary, pagination }
 */
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      page   = 1,
      limit  = 10,
      rating,
      sort   = 'newest',
    } = req.query;

    const parsedPage  = Math.max(1, parseInt(page));
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit)));
    const offset      = (parsedPage - 1) * parsedLimit;

    // Confirm product exists and is visible to the public
    const product = await db.Product.findOne({
      where:      { id: productId, is_visible: true },
      attributes: ['id'],
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // ── Build WHERE ────────────────────────────────────────────────────────
    const where = { productId };
    if (rating) {
      const r = parseInt(rating);
      if (r >= 1 && r <= 5) where.rating = r;
    }

    // ── Sort order ─────────────────────────────────────────────────────────
    const orderMap = {
      newest:  [['created_at', 'DESC']],
      highest: [['rating', 'DESC'], ['created_at', 'DESC']],
      lowest:  [['rating', 'ASC'],  ['created_at', 'DESC']],
    };
    const order = orderMap[sort] ?? orderMap.newest;

    // ── Paginated page ─────────────────────────────────────────────────────
    const { count, rows } = await db.ProductReview.findAndCountAll({
      where,
      attributes: REVIEW_PUBLIC_ATTRIBUTES,
      order,
      limit:  parsedLimit,
      offset,
    });

    // ── Full set (no limit) for rating summary computation ─────────────────
    // Only fetch rating column — avoids pulling all text for large datasets.
    const allRatings = await db.ProductReview.findAll({
      where:      { productId },
      attributes: ['rating'],
      raw:        true,
    });

    return res.json({
      reviews:       rows,
      ratingSummary: formatters.ratingSummary(allRatings),
      pagination:    formatters.pagination(count, parsedPage, parsedLimit),
    });
  } catch (err) {
    console.error('getProductReviews error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// USER — CREATE REVIEW
// ============================================================================

/**
 * POST /api/products/:productId/reviews
 *
 * Auth: optionalAuth — authenticated users get userId stamped; guests do not.
 *
 * Body: { rating, title?, body?, author }
 *
 * Rules:
 *  - One review per authenticated user per product (enforced by DB unique index
 *    `unique_user_product_review`; caught here for a clean 409 error message).
 *  - Guests may always submit (userId stays null — no uniqueness constraint).
 */
export const createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, title, body, author } = req.body;

    // ── Validation ─────────────────────────────────────────────────────────
    if (!author?.trim()) {
      return res.status(400).json({ message: 'Author name is required' });
    }
    const parsedRating = parseInt(rating);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Confirm the product exists and is publicly visible
    const product = await db.Product.findOne({
      where:      { id: productId, is_visible: true },
      attributes: ['id'],
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // ── Duplicate guard for authenticated users ────────────────────────────
    const userId = req.user?.id || null;
    if (userId) {
      const existing = await db.ProductReview.findOne({
        where: { productId, userId },
      });
      if (existing) {
        return res.status(409).json({
          message: 'You have already reviewed this product',
        });
      }
    }

    // ── Verified flag — true when the user has a confirmed order ──────────
    // Adjust the Order model name / status value to match your schema.
    let verified = false;
    if (userId && db.Order) {
      const order = await db.Order.findOne({
        where: {
          userId,
          status: 'completed',          // adjust to your order status enum
          '$orderItems.productId$': productId,
        },
        include: [{
          model:    db.OrderItem,
          as:       'orderItems',
          attributes: [],
        }],
        attributes: ['id'],
      }).catch(() => null);             // silently skip if model/join fails
      verified = !!order;
    }

    const review = await db.ProductReview.create({
      productId:  parseInt(productId),
      userId,
      rating:     parsedRating,
      title:      title?.trim()  || null,
      body:       body?.trim()   || null,
      author:     author.trim(),
      verified,
    });

    return res.status(201).json(review);
  } catch (err) {
    // Unique constraint violation — race condition safety net
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        message: 'You have already reviewed this product',
      });
    }
    console.error('createReview error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// USER — UPDATE OWN REVIEW
// ============================================================================

/**
 * PATCH /api/products/:productId/reviews/:reviewId
 *
 * Auth: authenticate (required)
 *
 * Updatable fields: rating, title, body, author
 * Ownership: req.user.id must match review.userId
 */
export const updateReview = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;

    const review = await db.ProductReview.findOne({
      where: { id: reviewId, productId },
    });
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // ── Ownership check ────────────────────────────────────────────────────
    if (!review.userId || review.userId !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own reviews' });
    }

    const { rating, title, body, author } = req.body;
    const updates = {};

    if (rating !== undefined) {
      const r = parseInt(rating);
      if (r < 1 || r > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }
      updates.rating = r;
    }
    if (author !== undefined) {
      if (!author?.trim()) {
        return res.status(400).json({ message: 'Author name cannot be empty' });
      }
      updates.author = author.trim();
    }
    if (title  !== undefined) updates.title = title?.trim()  || null;
    if (body   !== undefined) updates.body  = body?.trim()   || null;

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: 'No updatable fields provided' });
    }

    await review.update(updates);

    return res.json(review);
  } catch (err) {
    console.error('updateReview error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// USER — DELETE OWN REVIEW
// ============================================================================

/**
 * DELETE /api/products/:productId/reviews/:reviewId
 *
 * Auth: authenticate (required)
 * Ownership: req.user.id must match review.userId
 */
export const deleteReview = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;

    const review = await db.ProductReview.findOne({
      where: { id: reviewId, productId },
    });
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (!review.userId || review.userId !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    await review.destroy();

    return res.json({ message: 'Review deleted' });
  } catch (err) {
    console.error('deleteReview error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// ADMIN — LIST ALL REVIEWS
// ============================================================================

/**
 * GET /api/admin/reviews
 *
 * Query params:
 *   productId — filter to a specific product
 *   rating    — filter by star value
 *   verified  — 'true' | 'false'
 *   search    — partial match on author, title, body
 *   page, limit, sort (newest | highest | lowest)
 */
export const adminListReviews = async (req, res) => {
  try {
    const {
      productId,
      rating,
      verified,
      search,
      sort   = 'newest',
      page   = 1,
      limit  = 20,
    } = req.query;

    const parsedPage  = Math.max(1, parseInt(page));
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit)));
    const offset      = (parsedPage - 1) * parsedLimit;

    // ── WHERE ──────────────────────────────────────────────────────────────
    const where = {};
    if (productId)          where.productId = parseInt(productId);
    if (rating)             where.rating    = parseInt(rating);
    if (verified !== undefined) {
      where.verified = verified === 'true';
    }
    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      where[Op.or] = [
        { author: { [Op.like]: term } },
        { title:  { [Op.like]: term } },
        { body:   { [Op.like]: term } },
      ];
    }

    // ── ORDER ──────────────────────────────────────────────────────────────
    const orderMap = {
      newest:  [['created_at', 'DESC']],
      highest: [['rating', 'DESC'], ['created_at', 'DESC']],
      lowest:  [['rating', 'ASC'],  ['created_at', 'DESC']],
    };
    const order = orderMap[sort] ?? orderMap.newest;

    const { count, rows } = await db.ProductReview.findAndCountAll({
      where,
      attributes: [...REVIEW_PUBLIC_ATTRIBUTES, 'productId', 'userId'],
      include: [{
        model:      db.Product,
        as:         'product',
        attributes: ['id', 'name', 'slug'],
      }],
      order,
      limit:    parsedLimit,
      offset,
      distinct: true,
    });

    return res.json({
      reviews:    rows,
      pagination: formatters.pagination(count, parsedPage, parsedLimit),
    });
  } catch (err) {
    console.error('adminListReviews error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// ADMIN — DELETE ANY REVIEW
// ============================================================================

/**
 * DELETE /api/admin/reviews/:reviewId
 *
 * Auth: authenticate + requireAdmin
 * Hard deletes the review regardless of ownership.
 */
export const adminDeleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await db.ProductReview.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await review.destroy();

    return res.json({ message: 'Review deleted' });
  } catch (err) {
    console.error('adminDeleteReview error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};