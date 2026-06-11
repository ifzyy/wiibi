'use strict';

/**
 * models/SupportTicket.js
 *
 * Support ticket entity. One ticket per customer issue/request.
 *
 * Design decisions:
 *  - Ticket messages live in TicketMessage (separate table, append-only thread).
 *    Never store message content on the ticket itself.
 *  - assignedTo links to the User model (admin users only). NULL = unassigned.
 *  - userId links to the customer. NULL = guest (identified by email only).
 *  - orderId is nullable — tickets don't always relate to an order.
 *  - priority is independent of status — a ticket can be low priority but open.
 *  - resolvedAt is set when status → 'resolved' or 'closed'. Never reset.
 *  - Tags live in TicketTag (many-to-many via junction). Kept flexible.
 *
 * Status machine:
 *  open → in_progress → waiting_customer → resolved → closed
 *                     ↗ (can reopen)
 *  open → closed (admin closes without resolution)
 *
 * This matches how real support desks work: a ticket goes back to open
 * if the customer replies after it was "waiting_customer".
 */

export default (sequelize, DataTypes) => {
  const SupportTicket = sequelize.define(
    'SupportTicket',
    {
      id: {
        type:         DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey:   true,
      },

      // ── Identity ──────────────────────────────────────────────────────────
      ticketNumber: {
        type:      DataTypes.STRING(30),
        allowNull: false,
        unique:    true,
        comment:   'Human-readable. e.g. TKT-20260525-0001. Set at creation.',
      },

      // ── Requester ─────────────────────────────────────────────────────────
      userId: {
        type:      DataTypes.UUID,
        allowNull: true,
        comment:   'NULL for guest submissions',
      },

      requesterName: {
        type:      DataTypes.STRING(200),
        allowNull: true,
        comment:   'Snapshot of name at submission. Stays stable even if user changes profile.',
      },

      requesterEmail: {
        type:      DataTypes.STRING(255),
        allowNull: false,
        validate:  { isEmail: true },
        comment:   'Required for all tickets — how we contact the requester.',
      },

      requesterPhone: {
        type:      DataTypes.STRING(20),
        allowNull: true,
      },

      // ── Related order (optional) ───────────────────────────────────────────
      orderId: {
        type:      DataTypes.UUID,
        allowNull: true,
        comment:   'NULL if ticket is not about a specific order',
      },

      // ── Content ───────────────────────────────────────────────────────────
      subject: {
        type:      DataTypes.STRING(300),
        allowNull: false,
        validate:  { notEmpty: true, len: [3, 300] },
      },

      // Initial message body. Subsequent messages go in TicketMessage.
      // We keep this here so we can show the ticket detail without joining messages
      // for the common case of "what was the original issue".
      body: {
        type:      DataTypes.TEXT,
        allowNull: false,
      },

      // ── Classification ────────────────────────────────────────────────────
      type: {
        type: DataTypes.ENUM(
          'complaint',
          'request',
          'inquiry',
          'refund_request',
          'technical',
          'other'
        ),
        allowNull:    false,
        defaultValue: 'inquiry',
      },

      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull:    false,
        defaultValue: 'medium',
      },

      // ── Status ────────────────────────────────────────────────────────────
      status: {
        type: DataTypes.ENUM(
          'open',
          'in_progress',
          'waiting_customer',
          'resolved',
          'closed'
        ),
        allowNull:    false,
        defaultValue: 'open',
      },

      // ── Assignment ────────────────────────────────────────────────────────
      assignedTo: {
        type:      DataTypes.UUID,
        allowNull: true,
        comment:   'Admin user ID. NULL = unassigned queue.',
      },

      // ── Timestamps ────────────────────────────────────────────────────────
      resolvedAt: {
        type:      DataTypes.DATE,
        allowNull: true,
        comment:   'Set when status moves to resolved or closed. Never reset.',
      },

      firstResponseAt: {
        type:      DataTypes.DATE,
        allowNull: true,
        comment:   'When the first admin message was added. Used for SLA tracking.',
      },

      // ── Source channel ────────────────────────────────────────────────────
      channel: {
        type: DataTypes.ENUM('web_form', 'email', 'phone', 'chat', 'admin_created'),
        allowNull:    false,
        defaultValue: 'web_form',
      },
    },
    {
      tableName:   'support_tickets',
      underscored: true,
      paranoid:    false,
      indexes: [
        { unique: true, fields: ['ticket_number'] },
        { fields: ['user_id'] },
        { fields: ['order_id'] },
        { fields: ['status'] },
        { fields: ['priority'] },
        { fields: ['assigned_to'] },
        { fields: ['type'] },
        { fields: ['created_at'] },
        { fields: ['status', 'priority'] },   // dashboard "open + urgent" filter
        { fields: ['requester_email'] },
      ],
    }
  );

  SupportTicket.associate = (models) => {
    SupportTicket.belongsTo(models.User, {
      foreignKey:  'userId',
      as:          'requester',
      constraints: false,   // nullable
    });

    SupportTicket.belongsTo(models.User, {
      foreignKey:  'assignedTo',
      as:          'assignee',
      constraints: false,   // nullable
    });

    SupportTicket.belongsTo(models.Order, {
      foreignKey:  'orderId',
      as:          'order',
      constraints: false,   // nullable
    });

    SupportTicket.hasMany(models.TicketMessage, {
      foreignKey: 'ticketId',
      as:         'messages',
      onDelete:   'CASCADE',
    });

    SupportTicket.hasMany(models.TicketTag, {
      foreignKey: 'ticketId',
      as:         'tags',
      onDelete:   'CASCADE',
    });
  };

  return SupportTicket;
};
