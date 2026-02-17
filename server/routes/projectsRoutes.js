import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getAdminProjects,
  createProject,
  updateProject,
  deleteProject,

} from '../controllers/projectController.js';

const router = express.Router();


// Admin routes (protected)
router.use(authenticate);
router.use(requireAdmin);
router.get('/admin', getAdminProjects);
router.post('/admin', ...createProject);
router.put('/admin/:id', ...updateProject);
router.delete('/admin/:id', deleteProject);

export default router;