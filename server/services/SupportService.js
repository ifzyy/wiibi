/**
 * services/SupportService.js
 *
 * Support ticket lifecycle management.
 *
 * Design decisions:
 *  - Status machine enforced at service level (not just model validation).
 *    Attempting an illegal transition throws AppError 422.
 *  - All ticket mutations are in transactions.
 *  - Messages are append-only — addMessage() never updates, only inserts.
 *  - firstResponseAt is set once (on the first admin message) and never reset.
 *    Used for SLA: "did we respond within 24 hours?"
 *  - resolvedAt is set when ticket moves to 'resolved' or 'closed'.
 *  - WebSocket events are emitted via the shared emitter so the admin dashboard
 *    gets live updates without polling.
 *  - Tags are managed via replaceTags() — pass the full desired set,
 *    the service diffs and updates. Simpler than add/remove endpoints.
 *
 * Ticket numbering:
 *  TKT-YYYYMMDD-NNNN where NNNN is a zero-padded daily counter.
 *  Uses DB COUNT for the sequence — no separate counter table needed.
 */

import { Op } from 'sequelize';
import db from '../models/index.js';
import { AppError, NotFoundError, ConflictError } from '../utils/AppError.js';
import { getEmitter } from '../utils/emitter.js';

/* ── Status machine ───────────────────────────────────────────────────────── */

const VALID_TRANSITIONS = {
  open:             ['in_progress', 'closed', 'resolved'],
  in_progress:      ['waiting_customer', 'resolved', 'closed', 'open'],
  waiting_customer: ['in_progress', 'resolved', 'closed', 'open'],
  resolved:         ['open', 'closed'],   // can reopen
  closed:           ['open'],             // can reopen, but unusual
};

const TERMINAL_STATUSES = ['resolved', 'closed'];

/* ── Ticket number generation ─────────────────────────────────────────────── */

const generateTicketNumber = async (transaction) => {
  const today   = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix  = `TKT-${today}-`;

  const count = await db.SupportTicket.count({
    where:   { ticketNumber: { [Op.like]: `${prefix}%` } },
    transaction,
  });

  const seq = String(count + 1).padStart(4, '0');
  return `${prefix}${seq}`;
};

/* ── createTicket ─────────────────────────────────────────────────────────── */

/**
 * Create a new support ticket.
 * Can be called from:
 *  - Public form submission (userId = null, requesterEmail from form)
 *  - Logged-in customer (userId set, email resolved from User)
 *  - Admin on behalf of customer (channel = 'admin_created')
 *
 * The initial body is stored on the ticket AND as the first TicketMessage
 * so the thread has a complete history from day one.
 */
export const createTicket = async ({
  userId         = null,
  requesterName  = null,
  requesterEmail,
  requesterPhone = null,
  orderId        = null,
  subject,
  body,
  type           = 'inquiry',
  priority       = 'medium',
  channel        = 'web_form',
  tags           = [],
}) => {
  const transaction = await db.sequelize.transaction();

  try {
    const ticketNumber = await generateTicketNumber(transaction);

    // Snapshot requester name from User if not provided
    let resolvedName = requesterName;
    if (!resolvedName && userId) {
      const user = await db.User.findByPk(userId, {
        attributes: ['firstName', 'lastName'],
        transaction,
      });
      if (user) {
        resolvedName = [user.firstName, user.lastName].filter(Boolean).join(' ') || null;
      }
    }

    const ticket = await db.SupportTicket.create({
      ticketNumber,
      userId,
      requesterName:  resolvedName,
      requesterEmail,
      requesterPhone,
      orderId,
      subject,
      body,
      type,
      priority,
      channel,
      status: 'open',
    }, { transaction });

    // Initial message — the ticket body becomes message #1
    await db.TicketMessage.create({
      ticketId:   ticket.id,
      senderId:   userId,
      senderType: userId ? 'customer' : 'customer',
      body,
      isInternal: false,
    }, { transaction });

    // Tags
    if (tags.length > 0) {
      await db.TicketTag.bulkCreate(
        tags.map(tag => ({ ticketId: ticket.id, tag: tag.toLowerCase().trim() })),
        { transaction, ignoreDuplicates: true }
      );
    }

    await transaction.commit();

    const created = await getTicketById(ticket.id);

    // Emit WebSocket event for live admin dashboard
    getEmitter().emit('ticket:created', {
      ticketId:     ticket.id,
      ticketNumber: ticket.ticketNumber,
      subject:      ticket.subject,
      priority:     ticket.priority,
    });

    return created;

  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/* ── getTicketList ────────────────────────────────────────────────────────── */

export const getTicketList = async ({
  page       = 1,
  limit      = 20,
  status     = null,
  priority   = null,
  type       = null,
  assignedTo = null,
  unassigned = false,
  search     = null,
  startDate  = null,
  endDate    = null,
  sortBy     = 'createdAt',
  sortDir    = 'DESC',
} = {}) => {
  const safeLimit = Math.min(limit, 100);
  const offset    = (page - 1) * safeLimit;
  const where     = {};

  if (status)   where.status   = status;
  if (priority) where.priority = priority;
  if (type)     where.type     = type;

  if (unassigned) {
    where.assignedTo = null;
  } else if (assignedTo) {
    where.assignedTo = assignedTo;
  }

  if (search) {
    const like = { [Op.like]: `%${search}%` };
    where[Op.or] = [
      { ticketNumber:   like },
      { subject:        like },
      { requesterEmail: like },
      { requesterName:  like },
    ];
  }

  if (startDate && endDate) {
    where.createdAt = {
      [Op.between]: [
        new Date(startDate + 'T00:00:00+01:00'),
        new Date(endDate   + 'T23:59:59+01:00'),
      ],
    };
  }

  const validSorts = ['createdAt', 'updatedAt', 'priority', 'status'];
  const orderField = validSorts.includes(sortBy) ? sortBy : 'createdAt';
  const orderDir   = sortDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const { rows, count } = await db.SupportTicket.findAndCountAll({
    where,
    include: [
      { model: db.User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
      { model: db.User, as: 'assignee',  attributes: ['id', 'firstName', 'lastName'],          required: false },
      { model: db.TicketTag, as: 'tags', attributes: ['tag'] },
    ],
    order:    [[orderField, orderDir]],
    limit:    safeLimit,
    offset,
    distinct: true,
  });

  return {
    tickets:    rows,
    pagination: { page, limit: safeLimit, total: count, pages: Math.ceil(count / safeLimit) },
  };
};

/* ── getTicketById ────────────────────────────────────────────────────────── */

export const getTicketById = async (ticketId, { includeInternal = false } = {}) => {
  const messageWhere = includeInternal ? {} : { isInternal: false };

  const ticket = await db.SupportTicket.findByPk(ticketId, {
    include: [
      { model: db.User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber'], required: false },
      { model: db.User, as: 'assignee',  attributes: ['id', 'firstName', 'lastName'], required: false },
      {
        model:   db.TicketMessage,
        as:      'messages',
        where:   messageWhere,
        required: false,
        order:   [['createdAt', 'ASC']],
        include: [{ model: db.User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatarUrl'], required: false }],
      },
      { model: db.TicketTag, as: 'tags', attributes: ['tag'] },
      { model: db.Order,     as: 'order', attributes: ['id', 'orderNumber', 'totalAmount', 'status', 'paymentStatus'], required: false },
    ],
  });

  if (!ticket) throw new NotFoundError('Ticket not found');
  return ticket;
};

/* ── updateTicketStatus ───────────────────────────────────────────────────── */

export const updateTicketStatus = async (ticketId, {
  status,
  note       = null,
  actorId,
}) => {
  const transaction = await db.sequelize.transaction();

  try {
    const ticket = await db.SupportTicket.findByPk(ticketId, {
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (!ticket) throw new NotFoundError('Ticket not found');

    const allowed = VALID_TRANSITIONS[ticket.status] ?? [];
    if (!allowed.includes(status)) {
      throw new AppError(
        `Cannot move from "${ticket.status}" to "${status}". ` +
        `Allowed: ${allowed.length ? allowed.join(', ') : 'none'}`,
        422
      );
    }

    const updates = { status };

    // Set resolvedAt on first terminal transition
    if (TERMINAL_STATUSES.includes(status) && !ticket.resolvedAt) {
      updates.resolvedAt = new Date();
    }

    await ticket.update(updates, { transaction });

    // Add system message for the status change
    const sysNote = note || `Status changed to ${status}`;
    await db.TicketMessage.create({
      ticketId:   ticket.id,
      senderId:   actorId,
      senderType: 'system',
      body:       sysNote,
      isInternal: true,
    }, { transaction });

    await transaction.commit();

    getEmitter().emit('ticket:updated', { ticketId, status, actorId });

    return getTicketById(ticketId, { includeInternal: true });

  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/* ── assignTicket ─────────────────────────────────────────────────────────── */

export const assignTicket = async (ticketId, { assignedTo, actorId }) => {
  const transaction = await db.sequelize.transaction();

  try {
    const ticket = await db.SupportTicket.findByPk(ticketId, {
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
    if (!ticket) throw new NotFoundError('Ticket not found');

    // Validate assignee is an admin
    if (assignedTo) {
      const assignee = await db.User.findOne({
        where:      { id: assignedTo, role: 'admin' },
        attributes: ['id', 'firstName', 'lastName'],
        transaction,
      });
      if (!assignee) throw new AppError('Assignee must be an admin user', 422);
    }

    await ticket.update({
      assignedTo: assignedTo || null,
      status:     ticket.status === 'open' && assignedTo ? 'in_progress' : ticket.status,
    }, { transaction });

    const assigneeName = assignedTo ? 'an agent' : 'unassigned';
    await db.TicketMessage.create({
      ticketId:   ticket.id,
      senderId:   actorId,
      senderType: 'system',
      body:       `Ticket ${assignedTo ? 'assigned to' : 'unassigned from'} ${assigneeName}`,
      isInternal: true,
    }, { transaction });

    await transaction.commit();
    return getTicketById(ticketId, { includeInternal: true });

  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/* ── addMessage ───────────────────────────────────────────────────────────── */

/**
 * Add a message to a ticket thread. Append-only.
 *
 * Handles:
 *  - Customer reply → status moves from 'waiting_customer' back to 'in_progress'
 *  - Admin reply → sets firstResponseAt if this is the first admin message
 *  - Internal notes (isInternal = true) → visible to admins only
 */
export const addMessage = async (ticketId, {
  senderId,
  senderType,
  body,
  isInternal = false,
  attachments = null,
}) => {
  const transaction = await db.sequelize.transaction();

  try {
    const ticket = await db.SupportTicket.findByPk(ticketId, {
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
    if (!ticket) throw new NotFoundError('Ticket not found');

    if (['resolved', 'closed'].includes(ticket.status) && senderType === 'customer') {
      // Customer replying on a closed ticket reopens it
      await ticket.update({ status: 'open' }, { transaction });
    }

    const updates = {};

    if (senderType === 'customer' && ticket.status === 'waiting_customer') {
      updates.status = 'in_progress';
    }

    if (senderType === 'admin' && !ticket.firstResponseAt) {
      updates.firstResponseAt = new Date();
    }

    if (Object.keys(updates).length > 0) {
      await ticket.update(updates, { transaction });
    }

    const message = await db.TicketMessage.create({
      ticketId,
      senderId,
      senderType,
      body,
      isInternal,
      attachments,
    }, { transaction });

    await transaction.commit();

    getEmitter().emit('ticket:message', {
      ticketId,
      messageId:  message.id,
      senderType,
      isInternal,
    });

    return message;

  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/* ── replaceTags ──────────────────────────────────────────────────────────── */

export const replaceTags = async (ticketId, tags = []) => {
  const ticket = await db.SupportTicket.findByPk(ticketId, { attributes: ['id'] });
  if (!ticket) throw new NotFoundError('Ticket not found');

  const normalised = [...new Set(tags.map(t => t.toLowerCase().trim()).filter(Boolean))];

  await db.sequelize.transaction(async (t) => {
    await db.TicketTag.destroy({ where: { ticketId }, transaction: t });
    if (normalised.length > 0) {
      await db.TicketTag.bulkCreate(
        normalised.map(tag => ({ ticketId, tag })),
        { transaction: t }
      );
    }
  });

  return normalised;
};

/* ── getTicketStats ───────────────────────────────────────────────────────── */

export const getTicketStats = async () => {
  // Redis: `support:stats` TTL 5min

  const rows = await db.SupportTicket.findAll({
    attributes: [
      'status',
      'priority',
      [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
    ],
    group: ['status', 'priority'],
    raw:   true,
  });

  const byStatus   = {};
  const byPriority = {};

  for (const row of rows) {
    const n = parseInt(row.count, 10);
    byStatus[row.status]     = (byStatus[row.status]     || 0) + n;
    byPriority[row.priority] = (byPriority[row.priority] || 0) + n;
  }

  // Unassigned open tickets
  const unassigned = await db.SupportTicket.count({
    where: { assignedTo: null, status: { [Op.notIn]: ['resolved', 'closed'] } },
  });

  return {
    byStatus,
    byPriority,
    unassigned,
    total: Object.values(byStatus).reduce((s, n) => s + n, 0),
  };
};
