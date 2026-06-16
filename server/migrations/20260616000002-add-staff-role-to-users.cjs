'use strict';

/**
 * Add a 'staff' tier between 'user' and 'admin'.
 *
 * Staff are limited back-office operators (support desk, order management,
 * product inventory) — they do NOT get full analytics, payments/refunds,
 * customer data, promotions, settings, staff management or the audit log.
 * Enforced by requireRole('admin','staff') on the staff-allowed routes.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'role', {
      type:         Sequelize.ENUM('user', 'staff', 'admin'),
      allowNull:    false,
      defaultValue: 'user',
    });
  },

  async down(queryInterface, Sequelize) {
    // Demote any staff to plain users before narrowing the enum back.
    await queryInterface.sequelize.query("UPDATE users SET role = 'user' WHERE role = 'staff'");
    await queryInterface.changeColumn('users', 'role', {
      type:         Sequelize.ENUM('user', 'admin'),
      allowNull:    false,
      defaultValue: 'user',
    });
  },
};
