import express from 'express';
import {
  getHomepage,
  getPageBySlug,
  getProductBySlug,
  getPublicProducts,
  getPublicFaqs,
  getProjectBySlug,
  getPublicProjects,
} from '../controllers/publicController.js';

const router = express.Router();

router.get('/homepage',        getHomepage);
router.get('/pages/:slug',     getPageBySlug);
router.get('/products',        getPublicProducts);
router.get('/products/:slug',  getProductBySlug);
router.get('/faqs',            getPublicFaqs);
router.get('/projects',        getPublicProjects);
router.get('/projects/:slug',  getProjectBySlug);

export default router;