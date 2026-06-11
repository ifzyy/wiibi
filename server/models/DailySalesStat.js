'use strict';

/**
 * models/DailySalesStat.js
 *
 * Precomputed daily aggregates. One row per date.
 *
 * WHY THIS EXISTS:
 *  A naive dashboard query like:
 *    SELECT SUM(total_amount) FROM orders WHERE created_at >= '2026-01-01'
 *  scans every order row for the period. Fine at 1k orders. Brutal at 100k.
 *
 *  This table is written by a nightly job (jobs/aggregateDailySales.js) and
 *  read directly by AnalyticsService.getSalesSummary(). Dashboard loads hit
 *  a 365-row table, not a 100k-row table. Difference is ~50ms vs <1ms.
 *
 * UPDATE STRATEGY:
 *  The nightly job uses INSERT ... ON DUPLICATE KEY UPDATE so re-running it
 *  is safe. For "today" stats, AnalyticsService queries orders directly and
 *  caches the result for 5 minutes.
 *
 * DO NOT query this table directly from controllers.
 * Always go through AnalyticsService which handles today vs history correctly.
 */

export default (sequelize, DataTypes) => {
  const DailySalesStat = sequelize.define(
    'DailySalesStat',
    {
      id: {
        type:          DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey:    true,
      },

      // ── Date ──────────────────────────────────────────────────────────────
      date: {
        type:      DataTypes.DATEONLY,
        allowNull: false,
        unique:    true,
        comment:   'YYYY-MM-DD. One row per calendar day.',
      },

      // ── Revenue ───────────────────────────────────────────────────────────
      totalRevenue: {
        type:         DataTypes.DECIMAL(14, 2),
        allowNull:    false,
        defaultValue: 0,
        comment:      'Sum of order total_amount for paid orders on this date',
      },

      totalOrders: {
        type:         DataTypes.INTEGER.UNSIGNED,
        allowNull:    false,
        defaultValue: 0,
        comment:      'Count of all orders created on this date (any status)',
      },

      // ── Order status breakdown ─────────────────────────────────────────────
      // Precomputed so the dashboard can show a status pie without any GROUP BY
      pendingOrders: {
        type:         DataTypes.INTEGER.UNSIGNED,
        allowNull:    false,
        defaultValue: 0,
      },
      processingOrders: {
        type:         DataTypes.INTEGER.UNSIGNED,
        allowNull:    false,
        defaultValue: 0,
      },
      completedOrders: {
        type:         DataTypes.INTEGER.UNSIGNED,
        allowNull:    false,
        defaultValue: 0,
        comment:      'Orders in "delivered" status',
      },
      cancelledOrders: {
        type:         DataTypes.INTEGER.UNSIGNED,
        allowNull:    false,
        defaultValue: 0,
      },
      refundedOrders: {
        type:         DataTypes.INTEGER.UNSIGNED,
        allowNull:    false,
        defaultValue: 0,
        comment:      'Orders with paymentStatus = refunded',
      },

      // ── Traffic ───────────────────────────────────────────────────────────
      pageViews: {
        type:         DataTypes.INTEGER.UNSIGNED,
        allowNull:    false,
        defaultValue: 0,
        comment:      'Total page_views rows for this date',
      },

      uniqueVisitors: {
        type:         DataTypes.INTEGER.UNSIGNED,
        allowNull:    false,
        defaultValue: 0,
        comment:      'COUNT(DISTINCT ip_hash) for this date',
      },

      newCustomers: {
        type:         DataTypes.INTEGER.UNSIGNED,
        allowNull:    false,
        defaultValue: 0,
        comment:      'Users created on this date',
      },
    },
    {
      tableName:   'daily_sales_stats',
      underscored: true,
      paranoid:    false,
      indexes: [
        { unique: true, fields: ['date'] },
      ],
    }
  );

  // No associations needed — this is a reporting table, not a relational entity.
  DailySalesStat.associate = () => {};

  return DailySalesStat;
};
