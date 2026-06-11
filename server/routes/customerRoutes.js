/**
 * routes/customerRoutes.js
 */
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import {
  handleGetCustomers,
  handleGetCustomerStats,
  handleGetCustomerProfile,
  handleGetCustomerOrders,
  handleGetCustomerInquiries,
} from '../controllers/customerController.js';

const router = express.Router();

router.use(authenticate);
router.use(requireRole('admin'));

router.get('/',             handleGetCustomers);       // GET /admin/customers
router.get('/stats',        handleGetCustomerStats);   // GET /admin/customers/stats
router.get('/:id',          handleGetCustomerProfile); // GET /admin/customers/:id
router.get('/:id/orders',   handleGetCustomerOrders);  // GET /admin/customers/:id/orders
router.get('/:id/inquiries',handleGetCustomerInquiries); // GET /admin/customers/:id/inquiries

export default router;
