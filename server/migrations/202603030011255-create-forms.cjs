'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. forms
    await queryInterface.createTable('forms', {
      id:          { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name:        { type: Sequelize.STRING(150), allowNull: false },
      description: { type: Sequelize.TEXT },
      is_active:   { type: Sequelize.BOOLEAN, defaultValue: true },
      created_by:  { type: Sequelize.INTEGER, allowNull: false },
      created_at:  { type: Sequelize.DATE, allowNull: false },
      updated_at:  { type: Sequelize.DATE, allowNull: false },
    });

    // 2. form_fields
    await queryInterface.createTable('form_fields', {
      id:         { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      form_id:    {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'forms', key: 'id' },
        onDelete: 'CASCADE',
      },
      label:       { type: Sequelize.STRING(150), allowNull: false },
      field_type:  {
        type: Sequelize.ENUM('input', 'dropdown', 'textarea', 'email', 'phone'),
        allowNull: false,
        defaultValue: 'input',
      },
      placeholder: { type: Sequelize.STRING(200) },
      is_required: { type: Sequelize.BOOLEAN, defaultValue: false },
      sort_order:  { type: Sequelize.INTEGER, defaultValue: 0 },
      is_active:   { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at:  { type: Sequelize.DATE, allowNull: false },
      updated_at:  { type: Sequelize.DATE, allowNull: false },
    });

    // 3. field_options
    await queryInterface.createTable('field_options', {
      id:         { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      field_id:   {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'form_fields', key: 'id' },
        onDelete: 'CASCADE',
      },
      label:      { type: Sequelize.STRING(150), allowNull: false },
      value:      { type: Sequelize.STRING(150), allowNull: false },
      sort_order: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    // 4. form_submissions
    await queryInterface.createTable('form_submissions', {
      id:           { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      form_id:      {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'forms', key: 'id' },
        onDelete: 'CASCADE',
      },
      data:         { type: Sequelize.JSON, allowNull: false },
      submitted_by: { type: Sequelize.INTEGER },
      ip_address:   { type: Sequelize.STRING(45) },
      status:       {
        type: Sequelize.ENUM('pending', 'reviewed', 'resolved'),
        defaultValue: 'pending',
      },
      created_at:   { type: Sequelize.DATE, allowNull: false },
      updated_at:   { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('form_submissions');
    await queryInterface.dropTable('field_options');
    await queryInterface.dropTable('form_fields');
    await queryInterface.dropTable('forms');
  },
};