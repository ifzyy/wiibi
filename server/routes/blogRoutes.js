import { Router } from 'express';
import {
  getBlogs, getPublishedBlogs, getBlogById, getPublishedBlogBySlug,
  createBlog, updateBlog, deleteBlog, restoreBlog, hardDeleteBlog,
  attachMediaToBlog, removeMediaFromBlog, getTags, bulkStatusUpdate,
} from '../controllers/blogController.js';
import { validateCreateBlog, validateUpdateBlog, validateBlogId, validateAttachMedia } from '../middleware/validateBlog.js';
import { requireAdmin, protect } from '../middleware/auth.js';

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/blog',       getPublishedBlogs);
router.get('/blog/tags',  getTags);
router.get('/blog/:slug', getPublishedBlogBySlug);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get('/admin/blog',               protect, requireAdmin, getBlogs);
router.get('/admin/blog/tags',          protect, requireAdmin, getTags);
router.get('/admin/blog/:id',           protect, requireAdmin, validateBlogId, getBlogById);
router.patch('/admin/blog/bulk-status', protect, requireAdmin, bulkStatusUpdate);

router.post('/admin/blog',
  protect, requireAdmin, validateCreateBlog, createBlog);

router.patch('/admin/blog/:id',
  protect, requireAdmin, validateBlogId, validateUpdateBlog, updateBlog);

router.delete('/admin/blog/:id',
  protect, requireAdmin, validateBlogId, deleteBlog);

router.post('/admin/blog/:id/restore',
  protect, requireAdmin, validateBlogId, restoreBlog);

router.delete('/admin/blog/:id/hard',
  protect, requireAdmin, validateBlogId, hardDeleteBlog);

router.post('/admin/blog/:id/media/attach',
  protect, requireAdmin, validateBlogId, validateAttachMedia, attachMediaToBlog);

router.delete('/admin/blog/:id/media/:mediaId',
  protect, requireAdmin, validateBlogId, removeMediaFromBlog);

export default router;