/**
 * routes/supportRoutes.js
 *
 * Two route groups:
 *  /admin/support/*  — admin-only, full access
 *  /support/*        — public/customer, limited (submit + reply)
 */
import express from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import {
  handleGetStats,
  handleGetTickets,
  handleGetTicket,
  handleCreateTicket,
  handleUpdateStatus,
  handleAssignTicket,
  handleAddMessage,
  handleReplaceTags,
  handlePublicCreateTicket,
  handleCustomerReply,
} from '../controllers/supportController.js';

/* ── Admin router ────────────────────────────────────────────────────────── */

export const adminSupportRouter = express.Router();

adminSupportRouter.use(authenticate);
adminSupportRouter.use(requireRole('admin'));

adminSupportRouter.get('/stats',                handleGetStats);
adminSupportRouter.get('/',                     handleGetTickets);
adminSupportRouter.post('/',                    handleCreateTicket);
adminSupportRouter.get('/:id',                  handleGetTicket);
adminSupportRouter.patch('/:id/status',         handleUpdateStatus);
adminSupportRouter.patch('/:id/assign',         handleAssignTicket);
adminSupportRouter.post('/:id/messages',        handleAddMessage);
adminSupportRouter.put('/:id/tags',             handleReplaceTags);

/* ── Public/customer router ──────────────────────────────────────────────── */

export const publicSupportRouter = express.Router();

// Customer submits a ticket — optionally authenticated
publicSupportRouter.post(
  '/tickets',
  optionalAuthenticate,   // sets req.user if token present, never blocks
  handlePublicCreateTicket
);

// Customer replies to their own ticket
publicSupportRouter.post(
  '/tickets/:ticketNumber/messages',
  authenticate,
  handleCustomerReply
);

/* ── Default export (admin router for backward compat) ────────────────────── */
export default adminSupportRouter;
