'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('daily_sales_stats', {
      id: {
        type:          Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey:    true,
      },
      date: {
        type:      Sequelize.DATEONLY,
        allowNull: false,
        unique:    true,
      },
      total_revenue: {
        type:         Sequelize.DECIMAL(14, 2),
        allowNull:    false,
        defaultValue: 0,
      },
      total_orders: {
        type:         Sequelize.INTEGER.UNSIGNED,
        allowNull:    false,
        defaultValue: 0,
      },
      pending_orders: {
        type:         Sequelize.INTEGER.UNSIGNED,
        allowNull:    false,
        defaultValue: 0,
      },
      processing_orders: {
        type:         Sequelize.INTEGER.UNSIGNED,
        allowNull:    false,
        defaultValue: 0,
      },
      completed_orders: {
        type:         Sequelize.INTEGER.UNSIGNED,
        allowNull:    false,
        defaultValue: 0,
      },
      cancelled_orders: {
        type:         Sequelize.INTEGER.UNSIGNED,
        allowNull:    false,
        defaultValue: 0,
      },
      refunded_orders: {
        type:         Sequelize.INTEGER.UNSIGNED,
        allowNull:    false,
        defaultValue: 0,
      },
      page_views: {
        type:         Sequelize.INTEGER.UNSIGNED,
        allowNull:    false,
        defaultValue: 0,
      },
      unique_visitors: {
        type:         Sequelize.INTEGER.UNSIGNED,
        allowNull:    false,
        defaultValue: 0,
      },
      new_customers: {
        type:         Sequelize.INTEGER.UNSIGNED,
        allowNull:    false,
        defaultValue: 0,
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

    await queryInterface.addIndex('daily_sales_stats', ['date'], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('daily_sales_stats');
  }
};