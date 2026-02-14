'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('global_settings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      key: {
        type: Sequelize.STRING(120),
        allowNull: false,
        unique: true,
      },
      value: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      type: {
        type: Sequelize.ENUM('text', 'number', 'boolean', 'rich_text', 'image', 'array', 'object', 'color', 'url'),
        allowNull: false,
        defaultValue: 'text',
      },
      group: {
        type: Sequelize.STRING(60),
        allowNull: true,
      },
      label: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      is_system: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('global_settings', ['key'], { unique: true });
    await queryInterface.addIndex('global_settings', ['group']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('global_settings');
  },
};