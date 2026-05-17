'use strict';

/**
 * routes/productReviewRoutes.js
 *
 * Mounted at two points in app.js (see bottom of file):
 *
 *   app.use('/api/products',       productReviewRoutes);   // public + user routes
 *   app.use('/api/admin/reviews',  productReviewRoutes);   // admin routes
 *
 * Route map:
 *
 *   PUBLIC  GET  /api/products/:productId/reviews          getProductReviews
 *   USER    POST /api/products/:productId/reviews          createReview
 *   USER  PATCH  /api/products/:productId/reviews/:id      updateReview
 *   USER DELETE  /api/products/:productId/reviews/:id      deleteReview
 *   ADMIN   GET  /api/admin/reviews                        adminListReviews
 *   ADMIN DELETE /api/admin/reviews/:reviewId              adminDeleteReview
 */

import express from 'express';
import {
  authenticate,
  optionalAuth,
  requireAdmin,
} from '../middleware/auth.js';
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  adminListReviews,
  adminDeleteReview,
} from '../controllers/productReviewController.js';

const router = express.Router();

// ============================================================================
// PUBLIC — no auth required
// ============================================================================

/**
 * GET /api/products/:productId/reviews
 * Returns paginated reviews + rating summary for a single product.
 * Query: page, limit, rating, sort (newest|highest|lowest)
 */
router.get('/:productId/reviews', getProductReviews);

// ============================================================================
// USER — authenticated (or optionally authenticated)
// ============================================================================

/**
 * POST /api/products/:productId/reviews
 * optionalAuth — logged-in users get userId stamped + verified flag resolved;
 * guests submit with userId = null.
 */
router.post('/:productId/reviews', optionalAuth, createReview);

/**
 * PATCH /api/products/:productId/reviews/:reviewId
 * Must be signed in and own the review.
 */
router.patch('/:productId/reviews/:reviewId', authenticate, updateReview);

/**
 * DELETE /api/products/:productId/reviews/:reviewId
 * Must be signed in and own the review.
 */
router.delete('/:productId/reviews/:reviewId', authenticate, deleteReview);

// ============================================================================
// ADMIN — authenticate + requireAdmin
// ============================================================================

/**
 * GET /api/admin/reviews
 * List all reviews across all products.
 * Query: productId, rating, verified, search, page, limit, sort
 */
router.get('/', authenticate, requireAdmin, adminListReviews);

/**
 * DELETE /api/admin/reviews/:reviewId
 * Hard-delete any review regardless of owner.
 */
router.delete('/:reviewId', authenticate, requireAdmin, adminDeleteReview);

export default router;

// ============================================================================
// REGISTRATION — add these two lines to your app.js / server.js
// ============================================================================
//
//   import productReviewRoutes from './routes/productReviewRoutes.js';
//
//   app.use('/api/products',      productReviewRoutes);   // public + user
//   app.use('/api/admin/reviews', productReviewRoutes);   // admin panel