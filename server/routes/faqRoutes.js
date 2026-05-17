'use strict';

import { Router } from 'express';
import {
  getAllFaqs,
  getFaqById,
  createFaq,
  updateFaq,
  toggleFaqVisibility,
  reorderFaqs,
  deleteFaq,
} from '../controllers/faqController.js';

import { authenticate, requireAdmin } from '../middleware/auth.js';
const router = Router();

// All routes below require a valid JWT + admin role
router.use(authenticate);
router.use(requireAdmin);

// ── Collection ────────────────────────────────────────────────────────────────
router.get   ('/',         getAllFaqs);   // GET    /api/admin/faqs
router.post  ('/',         createFaq);   // POST   /api/admin/faqs
router.put   ('/reorder',  reorderFaqs); // PUT    /api/admin/faqs/reorder  ← before :id

// ── Single resource ───────────────────────────────────────────────────────────
router.get   ('/:id',           getFaqById);            // GET    /api/admin/faqs/:id
router.put   ('/:id',           updateFaq);             // PUT    /api/admin/faqs/:id
router.patch ('/:id/visibility', toggleFaqVisibility);  // PATCH  /api/admin/faqs/:id/visibility
router.delete('/:id',           deleteFaq);             // DELETE /api/admin/faqs/:id

export default router;