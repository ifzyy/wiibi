import express from 'express';

const router = express.Router();

import { authenticate, requireAdmin } from '../middleware/auth.js';
import formAdmin from '../controllers/formAdminController.js';
import submissions from '../controllers/submissionController.js';
import { createFormRules, updateFormRules, fieldRules } from '../middleware/formValidator.js';

// ════════════════════════════════════════════════
// ADMIN — all routes require JWT + admin role
// ════════════════════════════════════════════════
const adminGuard = [authenticate, requireAdmin];

// Forms
router.get   ('/admin/forms',          adminGuard, formAdmin.listForms);
router.get   ('/admin/forms/:id',      adminGuard, formAdmin.getForm);
router.post  ('/admin/forms',          adminGuard, createFormRules, formAdmin.createForm);
router.put   ('/admin/forms/:id',      adminGuard, updateFormRules, formAdmin.updateForm);
router.delete('/admin/forms/:id',      adminGuard, formAdmin.deleteForm);

// Fields on a form
router.post  ('/admin/forms/:formId/fields',           adminGuard, fieldRules, formAdmin.addField);
router.put   ('/admin/forms/:formId/fields/:fieldId',  adminGuard, fieldRules, formAdmin.updateField);
router.delete('/admin/forms/:formId/fields/:fieldId',  adminGuard, formAdmin.deleteField);

// Dropdown options on a field
router.post  ('/admin/forms/:formId/fields/:fieldId/options',             adminGuard, formAdmin.addOption);
router.put   ('/admin/forms/:formId/fields/:fieldId/options/:optionId',   adminGuard, formAdmin.updateOption);
router.delete('/admin/forms/:formId/fields/:fieldId/options/:optionId',   adminGuard, formAdmin.deleteOption);

// Submissions (admin view)
router.get   ('/admin/submissions',          adminGuard, submissions.listSubmissions);
router.get   ('/admin/submissions/:id',      adminGuard, submissions.getSubmission);
router.patch ('/admin/submissions/:id/status', adminGuard, submissions.updateSubmissionStatus);
router.delete('/admin/submissions/:id',      adminGuard, submissions.deleteSubmission);

// ════════════════════════════════════════════════
// PUBLIC — authenticated users submit forms
// ════════════════════════════════════════════════
router.post('/forms/:formId/submit', authenticate, submissions.submitForm);

export default router;