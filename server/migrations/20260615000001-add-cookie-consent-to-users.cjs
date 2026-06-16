'use strict';

/**
 * Per-user cookie consent.
 *
 * Stores the visitor's saved choices from Account → Cookie Preferences so the
 * decision follows them across devices and can be enforced server-side
 * (e.g. analytics page-view writes are skipped when `analytics` is false).
 *
 * Shape: { analytics: bool, marketing: bool, personalization: bool, updatedAt: ISO }
 * NULL  → no explicit decision yet; the app falls back to its defaults.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'cookie_consent', {
      type:      Sequelize.JSON,
      allowNull: true,
      after:     'shipping_address',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'cookie_consent');
  },
};
