/**
 * controllers/supportController.js
 */

import Joi from 'joi';
import asyncHandler from '../utils/Asynchandler.js';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response.js';
import { ValidationError } from '../utils/AppError.js';
import {
  createTicket,
  getTicketList,
  getTicketById,
  getMyTickets,
  getMyTicketByNumber,
  updateTicketStatus,
  assignTicket,
  addMessage,
  replaceTags,
  getTicketStats,
} from '../services/SupportService.js';

/* ── Schemas ─────────────────────────────────────────────────────────────── */

const createTicketSchema = Joi.object({
  requesterName:  Joi.string().max(200).allow(null, ''),
  requesterEmail: Joi.string().email().required(),
  requesterPhone: Joi.string().max(20).allow(null, ''),
  orderId:        Joi.string().uuid().allow(null),
  subject:        Joi.string().min(3).max(300).required(),
  body:           Joi.string().min(10).max(5000).required(),
  type:           Joi.string()
    .valid('complaint', 'request', 'inquiry', 'refund_request', 'technical', 'other')
    .default('inquiry'),
  priority:       Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  channel:        Joi.string()
    .valid('web_form', 'email', 'phone', 'chat', 'admin_created')
    .default('web_form'),
  tags:           Joi.array().items(Joi.string().max(80)).max(10).default([]),
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('open', 'in_progress', 'waiting_customer', 'resolved', 'closed')
    .required(),
  note: Joi.string().max(500).allow(null, ''),
});

const assignSchema = Joi.object({
  assignedTo: Joi.string().uuid().allow(null).required(),
});

const addMessageSchema = Joi.object({
  body:        Joi.string().min(1).max(10000).required(),
  isInternal:  Joi.boolean().default(false),
  attachments: Joi.array().items(Joi.object({
    url:       Joi.string().uri().required(),
    filename:  Joi.string().max(255).required(),
    mimeType:  Joi.string().max(100).required(),
    sizeBytes: Joi.number().integer().min(0),
  })).max(5).allow(null),
});

const tagsSchema = Joi.object({
  tags: Joi.array().items(Joi.string().max(80)).max(20).required(),
});

/* ── Handlers ────────────────────────────────────────────────────────────── */

/**
 * GET /admin/support/stats
 * Dashboard summary card — open/in-progress/unassigned counts.
 */
export const handleGetStats = asyncHandler(async (_req, res) => {
  const stats = await getTicketStats();
  return sendSuccess(res, stats);
});

/**
 * GET /admin/support
 * Paginated ticket list with filtering.
 */
export const handleGetTickets = asyncHandler(async (req, res) => {
  const { error, value } = Joi.object({
    page:       Joi.number().integer().min(1).default(1),
    limit:      Joi.number().integer().min(1).max(100).default(20),
    status:     Joi.string()
      .valid('open', 'in_progress', 'waiting_customer', 'resolved', 'closed')
      .allow(null, ''),
    priority:   Joi.string().valid('low', 'medium', 'high', 'urgent').allow(null, ''),
    type:       Joi.string()
      .valid('complaint', 'request', 'inquiry', 'refund_request', 'technical', 'other')
      .allow(null, ''),
    assignedTo: Joi.string().uuid().allow(null, ''),
    unassigned: Joi.boolean().default(false),
    search:     Joi.string().max(200).allow(null, ''),
    startDate:  Joi.string().isoDate().allow(null, ''),
    endDate:    Joi.string().isoDate().allow(null, ''),
    sortBy:     Joi.string().valid('createdAt', 'updatedAt', 'priority', 'status').default('createdAt'),
    sortDir:    Joi.string().valid('ASC', 'DESC').default('DESC'),
  }).validate(req.query, { convert: true });

  if (error) throw new ValidationError(error.details[0].message);

  const result = await getTicketList({
    ...value,
    status:     value.status     || null,
    priority:   value.priority   || null,
    type:       value.type       || null,
    assignedTo: value.assignedTo || null,
    search:     value.search     || null,
    startDate:  value.startDate  || null,
    endDate:    value.endDate    || null,
  });

  return sendPaginated(res, result.tickets, result.pagination);
});

/**
 * GET /admin/support/:id
 * Full ticket detail with thread. includeInternal=true for admin.
 */
export const handleGetTicket = asyncHandler(async (req, res) => {
  const ticket = await getTicketById(req.params.id, { includeInternal: true });
  return sendSuccess(res, ticket);
});

/**
 * POST /admin/support
 * Admin creates a ticket on behalf of a customer (channel = admin_created).
 */
export const handleCreateTicket = asyncHandler(async (req, res) => {
  const { error, value } = createTicketSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message);

  // Admin-created tickets are assigned to the creating admin by default
  const ticket = await createTicket({
    ...value,
    channel:    'admin_created',
    assignedTo: req.user.id,
  });

  return sendCreated(res, ticket, 'Ticket created');
});

/**
 * PATCH /admin/support/:id/status
 * Move ticket through status machine.
 */
export const handleUpdateStatus = asyncHandler(async (req, res) => {
  const { error, value } = updateStatusSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message);

  const ticket = await updateTicketStatus(req.params.id, {
    ...value,
    actorId: req.user.id,
  });

  return sendSuccess(res, ticket, `Ticket ${value.status}`);
});

/**
 * PATCH /admin/support/:id/assign
 * Assign or unassign a ticket. { assignedTo: "uuid" | null }
 */
export const handleAssignTicket = asyncHandler(async (req, res) => {
  const { error, value } = assignSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message);

  const ticket = await assignTicket(req.params.id, {
    assignedTo: value.assignedTo,
    actorId:    req.user.id,
  });

  return sendSuccess(res, ticket, value.assignedTo ? 'Ticket assigned' : 'Ticket unassigned');
});

/**
 * POST /admin/support/:id/messages
 * Admin adds a reply or internal note to a ticket.
 */
export const handleAddMessage = asyncHandler(async (req, res) => {
  const { error, value } = addMessageSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message);

  const message = await addMessage(req.params.id, {
    senderId:   req.user.id,
    senderType: 'admin',
    ...value,
  });

  return sendCreated(res, message, 'Message sent');
});

/**
 * PUT /admin/support/:id/tags
 * Replace all tags on a ticket. Pass the complete desired tag set.
 * { tags: ["billing", "urgent", "ng-specific"] }
 */
export const handleReplaceTags = asyncHandler(async (req, res) => {
  const { error, value } = tagsSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message);

  const tags = await replaceTags(req.params.id, value.tags);
  return sendSuccess(res, { tags }, 'Tags updated');
});

/* ── Public-facing handler (no auth) ─────────────────────────────────────── */

/**
 * POST /support/tickets  (public route — no admin auth)
 * Customer submits a support ticket from the website.
 */
export const handlePublicCreateTicket = asyncHandler(async (req, res) => {
  const { error, value } = createTicketSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message);

  const ticket = await createTicket({
    ...value,
    userId:  req.user?.id ?? null,
    channel: 'web_form',
  });

  // Return a minimal response to the public — no internal fields
  return sendCreated(res, {
    ticketNumber: ticket.ticketNumber,
    subject:      ticket.subject,
    status:       ticket.status,
    createdAt:    ticket.createdAt,
  }, 'Your support ticket has been submitted. We will respond within 24 hours.');
});

/**
 * GET /support/tickets  (authenticated customer)
 * List the logged-in customer's own tickets.
 */
export const handleListMyTickets = asyncHandler(async (req, res) => {
  const { error, value } = Joi.object({
    page:  Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
  }).validate(req.query, { convert: true });
  if (error) throw new ValidationError(error.details[0].message);

  const result = await getMyTickets({
    userId: req.user.id,
    email:  req.user.email ?? null,
    ...value,
  });

  return sendPaginated(res, result.tickets, result.pagination);
});

/**
 * GET /support/tickets/:ticketNumber  (authenticated customer)
 * Full thread for one of the customer's own tickets — no internal notes.
 */
export const handleGetMyTicket = asyncHandler(async (req, res) => {
  const ticket = await getMyTicketByNumber({
    ticketNumber: req.params.ticketNumber,
    userId:       req.user.id,
    email:        req.user.email ?? null,
  });
  return sendSuccess(res, ticket);
});

/**
 * POST /support/tickets/:ticketNumber/messages  (authenticated customer only)
 * Customer adds a reply to their own ticket.
 */
export const handleCustomerReply = asyncHandler(async (req, res) => {
  const { error, value } = addMessageSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message);

  // Find ticket by number and verify ownership
  const db = (await import('../models/index.js')).default;
  const ticket = await db.SupportTicket.findOne({
    where:      { ticketNumber: req.params.ticketNumber },
    attributes: ['id', 'userId', 'requesterEmail'],
  });

  if (!ticket) throw new ValidationError('Ticket not found');

  // Ownership: logged-in user must own the ticket, or email must match
  const isOwner = (req.user && ticket.userId === req.user.id) ||
                  (req.user?.email && ticket.requesterEmail === req.user.email);

  if (!isOwner) throw new ValidationError('Ticket not found');

  const message = await addMessage(ticket.id, {
    senderId:   req.user?.id ?? null,
    senderType: 'customer',
    body:       value.body,
    isInternal: false,
    attachments: value.attachments,
  });

  return sendCreated(res, { id: message.id, createdAt: message.createdAt }, 'Reply sent');
});
