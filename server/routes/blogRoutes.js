import { Router } from 'express';
import {
  getBlogs, getPublishedBlogs, getBlogById, getPublishedBlogBySlug,
  createBlog, updateBlog, deleteBlog, restoreBlog, hardDeleteBlog,
  attachMediaToBlog, removeMediaFromBlog, getTags, bulkStatusUpdate,
} from '../controllers/blogController.js';
import { validateCreateBlog, validateUpdateBlog, validateBlogId, validateAttachMedia } from '../middleware/validateBlog.js';
import { requireAdmin, authenticate } from '../middleware/auth.js';

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/blog',       getPublishedBlogs);
router.get('/blog/tags',  getTags);
router.get('/blog/:slug', getPublishedBlogBySlug);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get('/admin/blog',               authenticate, requireAdmin, getBlogs);
router.get('/admin/blog/tags',          authenticate, requireAdmin, getTags);
router.get('/admin/blog/:id',           authenticate, requireAdmin, validateBlogId, getBlogById);
router.patch('/admin/blog/bulk-status', authenticate, requireAdmin, bulkStatusUpdate);

router.post('/admin/blog',
  authenticate, requireAdmin, validateCreateBlog, createBlog);

router.patch('/admin/blog/:id',
  authenticate, requireAdmin, validateBlogId, validateUpdateBlog, updateBlog);

router.delete('/admin/blog/:id',
  authenticate, requireAdmin, validateBlogId, deleteBlog);

router.post('/admin/blog/:id/restore',
  authenticate, requireAdmin, validateBlogId, restoreBlog);

router.delete('/admin/blog/:id/hard',
  authenticate, requireAdmin, validateBlogId, hardDeleteBlog);

router.post('/admin/blog/:id/media/attach',
  authenticate, requireAdmin, validateBlogId, validateAttachMedia, attachMediaToBlog);

router.delete('/admin/blog/:id/media/:mediaId',
  authenticate, requireAdmin, validateBlogId, removeMediaFromBlog);

export default router;