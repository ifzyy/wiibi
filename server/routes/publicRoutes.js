import express from "express";
import {
  getHomepage,
  getPageBySlug,
  getProductBySlug,
  getPublicProducts,
  getPublicFaqs,
} from "../controllers/publicController.js";

const router = express.Router();

router.get("/homepage", getHomepage);
router.get("/pages/:slug", getPageBySlug);

// Public routes – no auth
router.get("/products", getPublicProducts);
router.get("/products/:slug", getProductBySlug);

router.get("/faqs",getPublicFaqs)
export default router;
