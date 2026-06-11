'use strict';

/**
 * models/TicketMessage.js
 *
 * Append-only message thread for a support ticket.
 *
 * Design decisions:
 *  - NEVER updated after creation. If someone needs to "edit" a message,
 *    a new message is created with the correction.
 *  - senderType distinguishes customer vs admin messages without a JOIN.
 *    This is important for the thread UI — different bubble styles.
 *  - isInternal = true means the message is an admin note, not visible to
 *    the customer. Used for internal handoff notes.
 *  - attachments is a JSON array of { url, filename, mimeType, sizeBytes }.
 *    Files are uploaded via the existing upload middleware and stored in
 *    public/uploads/support/. The URL is stored here.
 */

export default (sequelize, DataTypes) => {
  const TicketMessage = sequelize.define(
    'TicketMessage',
    {
      id: {
        type:         DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey:   true,
      },

      ticketId: {
        type:      DataTypes.UUID,
        allowNull: false,
        references: { model: 'support_tickets', key: 'id' },
      },

      // ── Sender ────────────────────────────────────────────────────────────
      senderId: {
        type:      DataTypes.UUID,
        allowNull: true,
        comment:   'User.id. NULL if sent by an unauthenticated guest via email.',
      },

      senderType: {
        type: DataTypes.ENUM('customer', 'admin', 'system'),
        allowNull: false,
        comment:   'system = automated messages (status changes, confirmations)',
      },

      // ── Content ───────────────────────────────────────────────────────────
      body: {
        type:      DataTypes.TEXT,
        allowNull: false,
        validate:  { notEmpty: true },
      },

      isInternal: {
        type:         DataTypes.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
        comment:      'true = admin note only, never shown to customer',
      },

      attachments: {
        type:      DataTypes.JSON,
        allowNull: true,
        comment:   '[{ url, filename, mimeType, sizeBytes }]',
      },
    },
    {
      tableName:   'ticket_messages',
      underscored: true,
      paranoid:    false,
      updatedAt:   false,   // append-only
      indexes: [
        { fields: ['ticket_id'] },
        { fields: ['sender_id'] },
        { fields: ['sender_type'] },
        { fields: ['ticket_id', 'created_at'] },   // thread ordering
      ],
    }
  );

  TicketMessage.associate = (models) => {
    TicketMessage.belongsTo(models.SupportTicket, {
      foreignKey: 'ticketId',
      as:         'ticket',
    });

    TicketMessage.belongsTo(models.User, {
      foreignKey:  'senderId',
      as:          'sender',
      constraints: false,
    });
  };

  return TicketMessage;
};
