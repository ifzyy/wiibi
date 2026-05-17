import express from 'express';
import {
  handleGetMe,
  handleUpdateMe,
  handleGetAllUsers,
  handleGetAllUsersTest,
  handleGetUser,
  handleUpdateRole,
  handleDeactivateUser,
} from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';

const router = express.Router();

// ── Current user ──────────────────────────────────────────────────────────────
router.get  ('/me',      authMiddleware,                  handleGetMe);
router.patch('/me',      authMiddleware,                  handleUpdateMe);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get   ('/',           authMiddleware, requireRole('admin'), handleGetAllUsers);
router.get   ('/:id',        authMiddleware, requireRole('admin'), handleGetUser);
router.patch ('/:id/role',   authMiddleware, requireRole('admin'), handleUpdateRole);
router.delete('/:id',        authMiddleware, requireRole('admin'), handleDeactivateUser);

if (process.env.NODE_ENV !== 'production') {
  router.get('/test/all', handleGetAllUsersTest);
}

export default router;