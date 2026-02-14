import express from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  getAdminProducts,
  createProduct,
  updateProduct,
  bulkUpdateProducts,
  deleteProduct,
} from "../controllers/productController.js";

const router = express.Router();

// Admin routes – protected
router.use(authenticate);
router.use(requireAdmin);
router.get("/", getAdminProducts);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.post("/bulk", bulkUpdateProducts);
router.delete("/:id", deleteProduct);

export default router;
