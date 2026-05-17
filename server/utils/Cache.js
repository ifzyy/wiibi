import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getAdminProjects, createProject, updateProject, deleteProject,
} from '../controllers/projectController.js';

const router = express.Router();
router.use(authenticate);
router.use(requireAdmin);

router.get('/',      getAdminProjects);
router.post('/',     createProject);
router.put('/:id',   updateProject);
router.delete('/:id', deleteProject);

export default router;