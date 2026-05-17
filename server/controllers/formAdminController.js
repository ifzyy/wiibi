import db from '../models/index.js';
import { validationResult } from 'express-validator';

const { Form, FormField, FieldOption } = db;

// ──────────────────────────────────────────────
// FORMS
// ──────────────────────────────────────────────

/** GET /admin/forms */
export const listForms = async (req, res) => {
  try {
    const forms = await Form.findAll({
      include: [{ model: FormField, as: 'fields', include: [{ model: FieldOption, as: 'options' }] }],
      order: [['created_at', 'DESC']],
    });
    return res.json({ success: true, data: forms });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /admin/forms/:id */
export const getForm = async (req, res) => {
  try {
    const form = await Form.findByPk(req.params.id, {
      include: [
        {
          model: FormField,
          as: 'fields',
          where: { is_active: true },
          required: false,
          include: [{ model: FieldOption, as: 'options', order: [['sort_order', 'ASC']] }],
          order: [['sort_order', 'ASC']],
        },
      ],
    });
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });
    return res.json({ success: true, data: form });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** POST /admin/forms */
export const createForm = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

  try {
    const { name, description, is_active, fields = [] } = req.body;

    const form = await Form.create(
      {
        name,
        description,
        is_active: is_active ?? true,
        created_by: req.user.id,
        fields: fields.map((f, i) => ({
          ...f,
          sort_order: f.sort_order ?? i,
          options: f.options ?? [],
        })),
      },
      { include: [{ model: FormField, as: 'fields', include: [{ model: FieldOption, as: 'options' }] }] }
    );

    return res.status(201).json({ success: true, data: form });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** PUT /admin/forms/:id */
export const updateForm = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

  try {
    const form = await Form.findByPk(req.params.id);
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });

    const { name, description, is_active } = req.body;
    await form.update({ name, description, is_active });

    return res.json({ success: true, data: form });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** DELETE /admin/forms/:id */
export const deleteForm = async (req, res) => {
  try {
    const form = await Form.findByPk(req.params.id);
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });
    await form.destroy(); // cascades to fields + options
    return res.json({ success: true, message: 'Form deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ──────────────────────────────────────────────
// FIELDS
// ──────────────────────────────────────────────

/** POST /admin/forms/:formId/fields */
export const addField = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

  try {
    const form = await Form.findByPk(req.params.formId);
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });

    const { label, field_type, placeholder, is_required, sort_order, options = [] } = req.body;

    const field = await FormField.create(
      {
        form_id: form.id,
        label,
        field_type,
        placeholder,
        is_required: is_required ?? false,
        sort_order: sort_order ?? 0,
        options,
      },
      { include: [{ model: FieldOption, as: 'options' }] }
    );

    return res.status(201).json({ success: true, data: field });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** PUT /admin/forms/:formId/fields/:fieldId */
export const updateField = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

  try {
    const field = await FormField.findOne({
      where: { id: req.params.fieldId, form_id: req.params.formId },
    });
    if (!field) return res.status(404).json({ success: false, message: 'Field not found' });

    const { label, field_type, placeholder, is_required, sort_order, is_active } = req.body;
    await field.update({ label, field_type, placeholder, is_required, sort_order, is_active });

    return res.json({ success: true, data: field });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** DELETE /admin/forms/:formId/fields/:fieldId */
export const deleteField = async (req, res) => {
  try {
    const field = await FormField.findOne({
      where: { id: req.params.fieldId, form_id: req.params.formId },
    });
    if (!field) return res.status(404).json({ success: false, message: 'Field not found' });
    await field.destroy();
    return res.json({ success: true, message: 'Field deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ──────────────────────────────────────────────
// FIELD OPTIONS (dropdowns)
// ──────────────────────────────────────────────

/** POST /admin/forms/:formId/fields/:fieldId/options */
export const addOption = async (req, res) => {
  try {
    const field = await FormField.findOne({
      where: { id: req.params.fieldId, form_id: req.params.formId },
    });
    if (!field) return res.status(404).json({ success: false, message: 'Field not found' });

    const { label, value, sort_order } = req.body;
    const option = await FieldOption.create({ field_id: field.id, label, value, sort_order: sort_order ?? 0 });

    return res.status(201).json({ success: true, data: option });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** PUT /admin/forms/:formId/fields/:fieldId/options/:optionId */
export const updateOption = async (req, res) => {
  try {
    const option = await FieldOption.findByPk(req.params.optionId);
    if (!option) return res.status(404).json({ success: false, message: 'Option not found' });

    const { label, value, sort_order } = req.body;
    await option.update({ label, value, sort_order });

    return res.json({ success: true, data: option });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** DELETE /admin/forms/:formId/fields/:fieldId/options/:optionId */
export const deleteOption = async (req, res) => {
  try {
    const option = await FieldOption.findByPk(req.params.optionId);
    if (!option) return res.status(404).json({ success: false, message: 'Option not found' });
    await option.destroy();
    return res.json({ success: true, message: 'Option deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export default {
  listForms,
  getForm,
  createForm,
  updateForm,
  deleteForm,
  addField,
  updateField,
  deleteField,
  addOption,
  updateOption,
  deleteOption,
};