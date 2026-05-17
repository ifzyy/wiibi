import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getAdminProjects, createProject, updateProject, deleteProject,
} from '../controllers/projectController.js';
import { attachMediaToProject } from '../controllers/uploadController.js';
const router = express.Router();
router.use(authenticate);
router.use(requireAdmin);

router.get('/',      getAdminProjects);
router.post('/',     createProject);
router.put('/:id',   updateProject);
router.delete('/:id', deleteProject);
router.post('/:id/media/attach',       attachMediaToProject);  // ← new
export default router;