'use strict';

/**
 * models/PageView.js
 *
 * Append-only traffic tracking. One row per page hit.
 *
 * Design choices:
 *  - No updates, ever. Rows are written once and read in aggregates.
 *  - userId is nullable — guests generate traffic too.
 *  - sessionId ties multiple views from the same browser session together
 *    without needing a User record. A UUID set in a cookie or localStorage.
 *  - path is stored normalised (no query string) so GROUP BY path gives
 *    clean per-page counts without parameter explosion.
 *  - responseMs lets you track slow pages over time without a separate APM tool.
 *
 * Aggregation strategy:
 *  AnalyticsService never does SELECT COUNT(*) against this table for dashboard loads.
 *  Instead a nightly job (jobs/aggregateTraffic.js) writes summaries into
 *  DailySalesStat. Real-time "today" counts DO query this table but are cached.
 */

export default (sequelize, DataTypes) => {
  const PageView = sequelize.define(
    'PageView',
    {
      id: {
        type:         DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey:   true,
        comment:      'BIGINT — this table grows fast',
      },

      // ── Who ───────────────────────────────────────────────────────────────
      userId: {
        type:      DataTypes.UUID,
        allowNull: true,
        comment:   'NULL for guests',
      },

      sessionId: {
        type:      DataTypes.STRING(128),
        allowNull: true,
        comment:   'Browser session UUID (cookie/localStorage). Groups views without a user account.',
      },

      // ── What ──────────────────────────────────────────────────────────────
      path: {
        type:      DataTypes.STRING(500),
        allowNull: false,
        comment:   'Normalised path without query string. e.g. /products/solar-panel-5kw',
      },

      referrer: {
        type:      DataTypes.STRING(500),
        allowNull: true,
        comment:   'document.referrer — source of traffic (Google, direct, etc.)',
      },

      // ── Context ───────────────────────────────────────────────────────────
      userAgent: {
        type:      DataTypes.STRING(500),
        allowNull: true,
      },

      ipHash: {
        type:      DataTypes.STRING(64),
        allowNull: true,
        comment:   'SHA-256 of IP + daily salt. Never store raw IPs. Used for unique visitor estimation.',
      },

      responseMs: {
        type:      DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        comment:   'Server response time in ms. Optional — set by middleware.',
      },
    },
    {
      tableName:   'page_views',
      underscored: true,
      paranoid:    false,
      updatedAt:   false,   // append-only — no updates ever
      indexes: [
        { fields: ['created_at'] },              // date range queries
        { fields: ['path'] },                    // per-page aggregation
        { fields: ['user_id'] },                 // user journey
        { fields: ['session_id'] },              // session grouping
        { fields: ['ip_hash'] },                 // unique visitor count
        { fields: ['path', 'created_at'] },      // composite: most visited in range
      ],
    }
  );

  PageView.associate = (models) => {
    PageView.belongsTo(models.User, {
      foreignKey: 'userId',
      as:         'user',
      constraints: false,   // userId can be null (guest) — no FK enforcement
    });
  };

  return PageView;
};
