'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('solar_appliances', {
      id: {
        type:          Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
      },
      name: {
        type:      Sequelize.STRING(150),
        allowNull: false,
      },
      category: {
        type:      Sequelize.STRING(80),
        allowNull: false,
      },
      icon: {
        type:      Sequelize.STRING(10),
        allowNull: true,
      },
      // watts_min and watts_max allow range display e.g. "5W–20W"
      // watts_max is used as the calculation value
      watts_min: {
        type:      Sequelize.FLOAT,
        allowNull: false,
      },
      watts_max: {
        type:      Sequelize.FLOAT,
        allowNull: false,
        comment:   'Used in calculations',
      },
      default_hours: {
        type:         Sequelize.FLOAT,
        allowNull:    false,
        defaultValue: 4,
        comment:      'Pre-filled daily usage hours in the calculator UI',
      },
      surge_multiplier: {
        type:         Sequelize.FLOAT,
        allowNull:    false,
        defaultValue: 1.0,
        comment:      'Startup surge factor — motors/pumps typically 2–3x',
      },
      is_critical: {
        type:         Sequelize.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
        comment:      'Shown in "critical loads only" mode',
      },
      is_active: {
        type:         Sequelize.BOOLEAN,
        allowNull:    false,
        defaultValue: true,
      },
      sort_order: {
        type:         Sequelize.INTEGER,
        allowNull:    false,
        defaultValue: 0,
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

    await queryInterface.addIndex('solar_appliances', ['category'],   { name: 'solar_appliances_category_idx'   });
    await queryInterface.addIndex('solar_appliances', ['is_active'],  { name: 'solar_appliances_is_active_idx'  });
    await queryInterface.addIndex('solar_appliances', ['sort_order'], { name: 'solar_appliances_sort_order_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('solar_appliances');
  },
};
