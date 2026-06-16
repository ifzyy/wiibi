import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import {
  getGlobalSettings, updateGlobalSetting,
  getPages, getPage, updatePage,
  getSectionsForPage, createSection, updateSection,
  deleteSection, reorderSections, assignMediaToSection,
} from '../controllers/adminController.js';
import upload from '../middleware/upload.js';
import { uploadFiles, attachMediaToProduct, attachMediaToProject } from '../controllers/uploadController.js';

const router = express.Router();
router.use(authenticate);

const staffOrAdmin = requireRole('admin', 'staff');

// ── Staff-accessible (product inventory needs image upload + attach) ──────────
// Declared BEFORE the admin-only guard below so staff can reach them.
router.post('/upload', staffOrAdmin, upload.array('images', 10), uploadFiles);
router.post('/products/:id/media/attach', staffOrAdmin, attachMediaToProduct);

// ── Everything below is admin-only (CMS: settings, pages, sections, projects) ─
router.use(requireAdmin);

// ── Global settings ───────────────────────────────────────────────────────────
router.get('/global-settings',      getGlobalSettings);
router.put('/global-settings/:key', updateGlobalSetting);

// ── Pages ─────────────────────────────────────────────────────────────────────
router.get('/pages',      getPages);
router.get('/pages/:id',  getPage);
router.put('/pages/:id',  updatePage);

// ── Sections ──────────────────────────────────────────────────────────────────
router.get('/sections',                      getSectionsForPage);
router.post('/sections',                     createSection);
router.put('/sections/:id',                  updateSection);
router.delete('/sections/:id',               deleteSection);
router.post('/sections/reorder',             reorderSections);
router.patch('/sections/:sectionId/media',   assignMediaToSection);

// ── Project media (admin-only) ────────────────────────────────────────────────
router.post('/projects/:id/media/attach',  attachMediaToProject);

export default router;