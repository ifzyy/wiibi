'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('solar_settings', {
      id: {
        type:          Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
      },
      key: {
        type:      Sequelize.STRING(80),
        allowNull: false,
        unique:    true,
        comment:   'Stable lookup key e.g. monthly_grid_cost, vat_rate',
      },
      label: {
        type:      Sequelize.STRING(150),
        allowNull: false,
        comment:   'Human-readable label shown in admin UI',
      },
      value: {
        type:      Sequelize.DECIMAL(14, 2),
        allowNull: false,
      },
      unit: {
        type:      Sequelize.STRING(30),
        allowNull: true,
        comment:   'Display unit e.g. ₦, %, ₦/kWh',
      },
      description: {
        type:      Sequelize.TEXT,
        allowNull: true,
        comment:   'Explains what this setting controls',
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
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('solar_settings');
  },
};
