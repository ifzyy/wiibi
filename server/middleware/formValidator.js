import { body } from 'express-validator';

export const createFormRules = [
  body('name').trim().notEmpty().withMessage('Form name is required'),
  body('is_active').optional().isBoolean(),
  body('fields').optional().isArray(),
  body('fields.*.label').notEmpty().withMessage('Field label is required'),
  body('fields.*.field_type')
    .notEmpty()
    .isIn(['input', 'dropdown', 'textarea', 'email', 'phone'])
    .withMessage('Invalid field_type'),
];

export const updateFormRules = [
  body('name').optional().trim().notEmpty(),
  body('is_active').optional().isBoolean(),
];

export const fieldRules = [
  body('label').trim().notEmpty().withMessage('Label is required'),
  body('field_type')
    .notEmpty()
    .isIn(['input', 'dropdown', 'textarea', 'email', 'phone'])
    .withMessage('Invalid field_type'),
  body('is_required').optional().isBoolean(),
  body('sort_order').optional().isInt({ min: 0 }),
];