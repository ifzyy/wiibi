'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('solar_leads', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.literal('(UUID())'),
        primaryKey:   true,
      },

      // ── Identity — guest OR logged-in, never both required ────────────────
      guest_token: {
        type:      Sequelize.STRING(64),
        allowNull: true,
        comment:   'Same pattern as guest cart — stored in localStorage client-side',
      },
      user_id: {
        type:       Sequelize.UUID,
        allowNull:  true,
        references: { model: 'users', key: 'id' },
        onDelete:   'SET NULL',
      },

      // ── Contact info ──────────────────────────────────────────────────────
      name: {
        type:      Sequelize.STRING(150),
        allowNull: false,
      },
      phone: {
        type:      Sequelize.STRING(30),
        allowNull: false,
      },
      email: {
        type:      Sequelize.STRING(255),
        allowNull: true,
      },

      // ── Calculator input snapshot ─────────────────────────────────────────
      location: {
        type:      Sequelize.STRING(80),
        allowNull: false,
      },
      autonomy_hours: {
        type:      Sequelize.INTEGER,
        allowNull: false,
      },
      battery_type: {
        type:      Sequelize.ENUM('lithium', 'tubular', 'dry-cell'),
        allowNull: false,
      },
      home_type: {
        type:      Sequelize.ENUM('apartment', 'duplex', 'bungalow', 'office', 'other'),
        allowNull: true,
      },
      critical_loads_only: {
        type:         Sequelize.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
      },
      appliances_snapshot: {
        type:      Sequelize.JSON,
        allowNull: false,
        comment:   '[{ id, name, watts, qty, hours }] at time of submission',
      },

      // ── Sizing output snapshot ────────────────────────────────────────────
      sizing_snapshot: {
        type:      Sequelize.JSON,
        allowNull: false,
        comment:   'Full { dailyWh, inverterKva, batteryKwh, solarKwp, ... } at submission',
      },

      // ── Chosen tier + recommendation snapshot ────────────────────────────
      chosen_tier: {
        type:         Sequelize.ENUM('sufficient', 'recommended', 'overkill'),
        allowNull:    false,
        defaultValue: 'recommended',
      },
      chosen_total: {
        type:      Sequelize.DECIMAL(14, 2),
        allowNull: false,
        comment:   'Total of the chosen tier at submission time',
      },
      recommendation_snapshot: {
        type:      Sequelize.JSON,
        allowNull: false,
        comment:   'Full [sufficient, recommended, overkill] array at submission — never recalculated',
      },

      // ── Lead origin ───────────────────────────────────────────────────────
      origin: {
        type:         Sequelize.ENUM('add_to_cart', 'request_quote'),
        allowNull:    false,
        defaultValue: 'request_quote',
        comment:      'How this lead was created',
      },

      // ── CRM ───────────────────────────────────────────────────────────────
      status: {
        type:         Sequelize.ENUM('new', 'contacted', 'converted'),
        allowNull:    false,
        defaultValue: 'new',
      },
      admin_notes: {
        type:      Sequelize.TEXT,
        allowNull: true,
      },

      created_at: {
        type:         Sequelize.DATE,
        allowNull:    false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type:         Sequelize.DATE,
        allowNull:    false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      deleted_at: {
        type:      Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('solar_leads', ['status'],       { name: 'solar_leads_status_idx'       });
    await queryInterface.addIndex('solar_leads', ['origin'],       { name: 'solar_leads_origin_idx'       });
    await queryInterface.addIndex('solar_leads', ['user_id'],      { name: 'solar_leads_user_id_idx'      });
    await queryInterface.addIndex('solar_leads', ['guest_token'],  { name: 'solar_leads_guest_token_idx'  });
    await queryInterface.addIndex('solar_leads', ['phone'],        { name: 'solar_leads_phone_idx'        });
    await queryInterface.addIndex('solar_leads', ['email'],        { name: 'solar_leads_email_idx'        });
    await queryInterface.addIndex('solar_leads', ['created_at'],   { name: 'solar_leads_created_at_idx'   });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('solar_leads');
  },
};
