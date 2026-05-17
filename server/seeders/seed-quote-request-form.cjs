'use strict';

module.exports = {
  async up(queryInterface) {
    // ── Insert form ──────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('forms', [
      {
        name:        'Request Quote',
        description: 'Fill in details',
        is_active:   true,
        created_by:  1,
        created_at:  new Date(),
        updated_at:  new Date(),
      },
    ]);

    const [[form]] = await queryInterface.sequelize.query(
      `SELECT id FROM forms WHERE name = 'Request Quote' LIMIT 1`
    );
    const formId = form.id;

    // ── Insert fields ────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('form_fields', [
      { form_id: formId, label: 'Property Type',        field_type: 'dropdown', placeholder: null,                            is_required: true,  sort_order: 1, is_active: true, created_at: new Date(), updated_at: new Date() },
      { form_id: formId, label: 'Business Name',        field_type: 'input',    placeholder: 'Enter your business name',      is_required: true,  sort_order: 2, is_active: true, created_at: new Date(), updated_at: new Date() },
      { form_id: formId, label: 'Phone Number',         field_type: 'phone',    placeholder: '+234',                          is_required: true,  sort_order: 3, is_active: true, created_at: new Date(), updated_at: new Date() },
      { form_id: formId, label: 'Business Email',       field_type: 'email',    placeholder: 'Enter business email',          is_required: true,  sort_order: 4, is_active: true, created_at: new Date(), updated_at: new Date() },
      { form_id: formId, label: 'Business Description', field_type: 'textarea', placeholder: 'What is your business about?',  is_required: false, sort_order: 5, is_active: true, created_at: new Date(), updated_at: new Date() },
      { form_id: formId, label: 'State',                field_type: 'dropdown', placeholder: null,                            is_required: true,  sort_order: 6, is_active: true, created_at: new Date(), updated_at: new Date() },
      { form_id: formId, label: 'LGA',                  field_type: 'dropdown', placeholder: null,                            is_required: true,  sort_order: 7, is_active: true, created_at: new Date(), updated_at: new Date() },
    ]);

    // ── Get field IDs ────────────────────────────────────────────────────────
    const [fields] = await queryInterface.sequelize.query(
      `SELECT id, label FROM form_fields WHERE form_id = ${formId}`
    );
    const field = Object.fromEntries(fields.map((f) => [f.label, f.id]));

    const now = new Date();

    // ── Property Type options ────────────────────────────────────────────────
    // NOTE: opt.label is used as the propertyType value in FIELD_OVERRIDES,
    // so keep them exactly "Commercial" and "Residential"
    await queryInterface.bulkInsert('field_options', [
      { field_id: field['Property Type'], label: 'Commercial',  value: 'commercial',  sort_order: 1, created_at: now, updated_at: now },
      { field_id: field['Property Type'], label: 'Residential', value: 'residential', sort_order: 2, created_at: now, updated_at: now },
    ]);

    // ── State & LGA — handled live by the NGA API, no options needed ─────────
    // The State and LGA dropdowns are populated at runtime from
    // https://nga-states-lga.onrender.com so we intentionally leave
    // field_options empty for those two fields.
  },

  async down(queryInterface) {
    const [[form]] = await queryInterface.sequelize.query(
      `SELECT id FROM forms WHERE name = 'Request Quote' LIMIT 1`
    );
    if (!form) return;

    const formId = form.id;
    const [fields] = await queryInterface.sequelize.query(
      `SELECT id FROM form_fields WHERE form_id = ${formId}`
    );
    const fieldIds = fields.map((f) => f.id);

    if (fieldIds.length) {
      await queryInterface.bulkDelete('field_options', { field_id: fieldIds });
    }
    await queryInterface.bulkDelete('form_fields', { form_id: formId });
    await queryInterface.bulkDelete('forms', { id: formId });
  },
};