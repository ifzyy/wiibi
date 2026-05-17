'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_tracking', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.literal('(UUID())'),
        primaryKey:   true,
        allowNull:    false,
      },
      order_id: {
        type:       Sequelize.UUID,
        allowNull:  false,
        references: { model: 'orders', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'CASCADE',
      },
      status: {
        type:      Sequelize.STRING(50),
        allowNull: false,
      },
      note: {
        type:      Sequelize.TEXT,
        allowNull: true,
      },
      updated_by: {
        type:      Sequelize.UUID,
        allowNull: true,               // UUID of admin who made the change
      },
      tracking_number: {
        type:      Sequelize.STRING(100),
        allowNull: true,
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

    await queryInterface.addIndex('order_tracking', ['order_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('order_tracking');
  },
};
