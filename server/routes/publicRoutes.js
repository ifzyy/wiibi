import express from "express";
import {
  getHomepage,
  getPageBySlug,
  getProductBySlug,
  getPublicProducts,
  getPublicFaqs,
  getProjectBySlug,
  getPublicProjects,
} from "../controllers/publicController.js";

const router = express.Router();

router.get("/homepage", getHomepage);
router.get("/pages/:slug", getPageBySlug);

// Public routes – no auth
router.get("/products", getPublicProducts);
router.get("/products/:slug", getProductBySlug);

router.get("/faqs",getPublicFaqs)


// Public routes (no auth)
router.get('/', getPublicProjects);
router.get('/:slug', getProjectBySlug);


export default router;
