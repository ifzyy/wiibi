import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getGlobalSettings,
  updateGlobalSetting,
  getPages,
  getPage,
  updatePage,
  getSectionsForPage,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
} from '../controllers/adminController.js';

const router = express.Router();
router.use(authenticate)
router.use(requireAdmin); // all routes require admin

// Globals
router.get('/global-settings', getGlobalSettings);
router.put('/global-settings/:key', updateGlobalSetting);

// Pages
router.get('/pages', getPages);
router.get('/pages/:id', getPage);
router.put('/pages/:id', updatePage);

// Sections
router.get('/sections', getSectionsForPage); // ?pageId=xxx
router.post('/sections', createSection);
router.put('/sections/:id', updateSection);
router.delete('/sections/:id', deleteSection);
router.post('/sections/reorder', reorderSections);

export default router;