'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ── support_tickets ───────────────────────────────────────────────────────
    await queryInterface.createTable('support_tickets', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey:   true,
      },
      ticket_number: {
        type:      Sequelize.STRING(30),
        allowNull: false,
        unique:    true,
      },
      user_id: {
        type:       Sequelize.UUID,
        allowNull:  true,
        references: { model: 'users', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'SET NULL',
      },
      requester_name: {
        type:      Sequelize.STRING(200),
        allowNull: true,
      },
      requester_email: {
        type:      Sequelize.STRING(255),
        allowNull: false,
      },
      requester_phone: {
        type:      Sequelize.STRING(20),
        allowNull: true,
      },
      order_id: {
        type:       Sequelize.UUID,
        allowNull:  true,
        references: { model: 'orders', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'SET NULL',
      },
      subject: {
        type:      Sequelize.STRING(300),
        allowNull: false,
      },
      body: {
        type:      Sequelize.TEXT,
        allowNull: false,
      },
      type: {
        type:         Sequelize.ENUM('complaint', 'request', 'inquiry', 'refund_request', 'technical', 'other'),
        allowNull:    false,
        defaultValue: 'inquiry',
      },
      priority: {
        type:         Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull:    false,
        defaultValue: 'medium',
      },
      status: {
        type:         Sequelize.ENUM('open', 'in_progress', 'waiting_customer', 'resolved', 'closed'),
        allowNull:    false,
        defaultValue: 'open',
      },
      assigned_to: {
        type:       Sequelize.UUID,
        allowNull:  true,
        references: { model: 'users', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'SET NULL',
      },
      resolved_at: {
        type:      Sequelize.DATE,
        allowNull: true,
      },
      first_response_at: {
        type:      Sequelize.DATE,
        allowNull: true,
      },
      channel: {
        type:         Sequelize.ENUM('web_form', 'email', 'phone', 'chat', 'admin_created'),
        allowNull:    false,
        defaultValue: 'web_form',
      },
      created_at: {
        type:         Sequelize.DATE,
        allowNull:    false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type:         Sequelize.DATE,
        allowNull:    false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('support_tickets', ['ticket_number'], { unique: true });
    await queryInterface.addIndex('support_tickets', ['user_id']);
    await queryInterface.addIndex('support_tickets', ['order_id']);
    await queryInterface.addIndex('support_tickets', ['status']);
    await queryInterface.addIndex('support_tickets', ['priority']);
    await queryInterface.addIndex('support_tickets', ['assigned_to']);
    await queryInterface.addIndex('support_tickets', ['type']);
    await queryInterface.addIndex('support_tickets', ['created_at']);
    await queryInterface.addIndex('support_tickets', ['status', 'priority']);
    await queryInterface.addIndex('support_tickets', ['requester_email']);

    // ── ticket_messages ───────────────────────────────────────────────────────
    await queryInterface.createTable('ticket_messages', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey:   true,
      },
      ticket_id: {
        type:       Sequelize.UUID,
        allowNull:  false,
        references: { model: 'support_tickets', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'CASCADE',
      },
      sender_id: {
        type:      Sequelize.UUID,
        allowNull: true,
      },
      sender_type: {
        type:      Sequelize.ENUM('customer', 'admin', 'system'),
        allowNull: false,
      },
      body: {
        type:      Sequelize.TEXT,
        allowNull: false,
      },
      is_internal: {
        type:         Sequelize.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
      },
      attachments: {
        type:      Sequelize.JSON,
        allowNull: true,
      },
      created_at: {
        type:         Sequelize.DATE,
        allowNull:    false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('ticket_messages', ['ticket_id']);
    await queryInterface.addIndex('ticket_messages', ['sender_id']);
    await queryInterface.addIndex('ticket_messages', ['ticket_id', 'created_at']);

    // ── ticket_tags ────────────────────────────────────────────────────────────
    await queryInterface.createTable('ticket_tags', {
      id: {
        type:          Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey:    true,
      },
      ticket_id: {
        type:       Sequelize.UUID,
        allowNull:  false,
        references: { model: 'support_tickets', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'CASCADE',
      },
      tag: {
        type:      Sequelize.STRING(80),
        allowNull: false,
      },
    });

    await queryInterface.addIndex('ticket_tags', ['ticket_id', 'tag'], { unique: true });
    await queryInterface.addIndex('ticket_tags', ['tag']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ticket_tags');
    await queryInterface.dropTable('ticket_messages');
    await queryInterface.dropTable('support_tickets');

    // Clean up ENUMs (important for Postgres)
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_support_tickets_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_support_tickets_priority";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_support_tickets_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_support_tickets_channel";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ticket_messages_sender_type";');
  }
};