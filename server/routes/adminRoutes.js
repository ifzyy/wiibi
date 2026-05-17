import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getGlobalSettings, updateGlobalSetting,
  getPages, getPage, updatePage,
  getSectionsForPage, createSection, updateSection,
  deleteSection, reorderSections, assignMediaToSection,
} from '../controllers/adminController.js';
import upload from '../middleware/upload.js';
import { uploadFiles, attachMediaToProduct } from '../controllers/uploadController.js';
import { processImage } from '../middleware/upload.js';

const router = express.Router();
router.use(authenticate);
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

// ── Upload / media ────────────────────────────────────────────────────────────
router.post('/products/:id/media/attach', attachMediaToProduct);
router.post('/upload', upload.array('images', 10), processImage, uploadFiles);

export default router;