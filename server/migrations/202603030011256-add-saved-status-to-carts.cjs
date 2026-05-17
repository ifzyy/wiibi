'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "ALTER TABLE `carts` MODIFY `status` ENUM('active','checked_out','abandoned','saved') NOT NULL DEFAULT 'active';"
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "ALTER TABLE `carts` MODIFY `status` ENUM('active','checked_out','abandoned') NOT NULL DEFAULT 'active';"
    );
  },
};
