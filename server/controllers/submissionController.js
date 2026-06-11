import db from '../models/index.js';

const { Form, FormField, FieldOption, FormSubmission } = db;

// ──────────────────────────────────────────────
// PUBLIC — anyone can submit
// ──────────────────────────────────────────────

/** POST /forms/:formId/submit */
export const submitForm = async (req, res) => {
  try {
    // NOTE: findByPk ignores a top-level `where`, so is_active must be checked
    // after load — otherwise inactive forms would still accept submissions.
    const form = await Form.findByPk(req.params.formId, {
      include: [
        {
          model: FormField,
          as: 'fields',
          where: { is_active: true },
          required: false,
        },
      ],
    });
    if (!form || !form.is_active) {
      return res.status(404).json({ success: false, message: 'Form not found or inactive' });
    }

    // Validate required fields
    const requiredFields = form.fields.filter((f) => f.is_required);
    const missing = requiredFields.filter((f) => !req.body.data?.[f.label]);
    if (missing.length) {
      return res.status(422).json({
        success: false,
        message: 'Missing required fields',
        missing: missing.map((f) => f.label),
      });
    }

    const submission = await FormSubmission.create({
      form_id: form.id,
      data: req.body.data,
      submitted_by: req.user?.id ?? null,
      ip_address: req.ip,
      status: 'pending',
    });

    return res.status(201).json({ success: true, data: { id: submission.id } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ──────────────────────────────────────────────
// ADMIN — view & manage submissions
// ──────────────────────────────────────────────

/** GET /admin/submissions  (optionally ?form_id=&status=) */
export const listSubmissions = async (req, res) => {
  try {
    const where = {};
    if (req.query.form_id) where.form_id = req.query.form_id;
    if (req.query.status)  where.status  = req.query.status;

    const submissions = await FormSubmission.findAll({
      where,
      include: [{ model: Form, as: 'form', attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']],
    });

    return res.json({ success: true, data: submissions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /admin/submissions/:id */
export const getSubmission = async (req, res) => {
  try {
    const submission = await FormSubmission.findByPk(req.params.id, {
      include: [{ model: Form, as: 'form' }],
    });
    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });
    return res.json({ success: true, data: submission });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** PATCH /admin/submissions/:id/status */
export const updateSubmissionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'reviewed', 'resolved'];
    if (!allowed.includes(status)) {
      return res.status(422).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });
    }

    const submission = await FormSubmission.findByPk(req.params.id);
    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });

    await submission.update({ status });
    return res.json({ success: true, data: submission });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** DELETE /admin/submissions/:id */
export const deleteSubmission = async (req, res) => {
  try {
    const submission = await FormSubmission.findByPk(req.params.id);
    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });
    await submission.destroy();
    return res.json({ success: true, message: 'Submission deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export default {
  submitForm,
  listSubmissions,
  getSubmission,
  updateSubmissionStatus,
  deleteSubmission,
};