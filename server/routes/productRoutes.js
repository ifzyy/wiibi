// ============================================================================
// routes/productRoutes.js
// ============================================================================
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import {
  getAdminProducts, createProduct, updateProduct, deleteProduct,
} from '../controllers/productController.js';

const router = express.Router();
router.use(authenticate);
// Product inventory is part of the staff scope (alongside support + orders).
router.use(requireRole('admin', 'staff'));

router.get('/',     getAdminProducts);
router.post('/',    createProduct);
router.patch('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;