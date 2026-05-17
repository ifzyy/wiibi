// ============================================================================
// routes/productRoutes.js
// ============================================================================
import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getAdminProducts, createProduct, updateProduct, deleteProduct,
} from '../controllers/productController.js';

const router = express.Router();
router.use(authenticate);
router.use(requireAdmin);

router.get('/',     getAdminProducts);
router.post('/',    createProduct);
router.patch('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;