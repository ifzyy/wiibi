'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('carts', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.literal('(UUID())'),
        primaryKey:   true,
        allowNull:    false,
      },
      user_id: {
        type:       Sequelize.UUID,
        allowNull:  true,              // null for guest carts
        references: { model: 'users', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'SET NULL',
      },
      guest_token: {
        type:      Sequelize.STRING(128),
        allowNull: true,
        unique:    true,               // one cart per guest token
      },
      status: {
        type:         Sequelize.ENUM('active', 'checked_out', 'abandoned'),
        defaultValue: 'active',
        allowNull:    false,
      },
      created_at: {
        type:      Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type:      Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('carts', ['user_id']);
    await queryInterface.addIndex('carts', ['guest_token']);
    await queryInterface.addIndex('carts', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('carts');
  },
};
