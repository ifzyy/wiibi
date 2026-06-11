'use strict';

/**
 * models/TicketTag.js
 *
 * Tag rows on a support ticket. Simple string tags — no separate Tag master table.
 *
 * Why not a separate Tag table with a junction?
 *  For support tags ("billing", "urgent", "nigeria-specific"), we don't need
 *  a Tag entity with its own metadata. A simple (ticketId, tag) pair is enough
 *  and much cheaper to query. If tags grow into a managed taxonomy, migrate later.
 *
 * Unique constraint on (ticket_id, tag) prevents duplicates at the DB level.
 */

export default (sequelize, DataTypes) => {
  const TicketTag = sequelize.define(
    'TicketTag',
    {
      id: {
        type:          DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey:    true,
      },

      ticketId: {
        type:       DataTypes.UUID,
        allowNull:  false,
        references: { model: 'support_tickets', key: 'id' },
      },

      tag: {
        type:      DataTypes.STRING(80),
        allowNull: false,
        validate:  { notEmpty: true, len: [1, 80] },
      },
    },
    {
      tableName:   'ticket_tags',
      underscored: true,
      paranoid:    false,
      timestamps:  false,   // no need for createdAt/updatedAt on tag rows
      indexes: [
        { unique: true, fields: ['ticket_id', 'tag'] },
        { fields: ['tag'] },   // "show all tickets tagged 'billing'"
      ],
    }
  );

  TicketTag.associate = (models) => {
    TicketTag.belongsTo(models.SupportTicket, {
      foreignKey: 'ticketId',
      as:         'ticket',
    });
  };

  return TicketTag;
};
