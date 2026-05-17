'use strict';

import db from '../models/index.js';

// ─── GET ALL (admin – includes hidden) ───────────────────────────────────────
export const getAllFaqs = async (req, res) => {
  try {
    const faqs = await db.Faq.findAll({
      order: [['display_order', 'ASC']],
      attributes: ['id', 'question', 'answer', 'display_order', 'is_visible', 'created_at', 'updated_at'],
    });
    return res.json(faqs);
  } catch (err) {
    console.error('Admin – get all FAQs error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET ONE ──────────────────────────────────────────────────────────────────
export const getFaqById = async (req, res) => {
  try {
    const faq = await db.Faq.findByPk(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    return res.json(faq);
  } catch (err) {
    console.error('Admin – get FAQ by id error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const createFaq = async (req, res) => {
  try {
    const { question, answer, display_order = 0, is_visible = true } = req.body;

    if (!question?.trim() || !answer?.trim()) {
      return res.status(400).json({ message: 'Question and answer are required' });
    }

    const faq = await db.Faq.create({
      question: question.trim(),
      answer:   answer.trim(),
      display_order,
      is_visible,
    });

    return res.status(201).json(faq);
  } catch (err) {
    console.error('Admin – create FAQ error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const updateFaq = async (req, res) => {
  try {
    const faq = await db.Faq.findByPk(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });

    const { question, answer, display_order, is_visible } = req.body;

    await faq.update({
      ...(question     !== undefined && { question:      question.trim() }),
      ...(answer       !== undefined && { answer:        answer.trim()   }),
      ...(display_order !== undefined && { display_order                 }),
      ...(is_visible   !== undefined && { is_visible                     }),
    });

    return res.json(faq);
  } catch (err) {
    console.error('Admin – update FAQ error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── TOGGLE VISIBILITY ────────────────────────────────────────────────────────
export const toggleFaqVisibility = async (req, res) => {
  try {
    const faq = await db.Faq.findByPk(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });

    await faq.update({ is_visible: !faq.is_visible });
    return res.json({ id: faq.id, is_visible: faq.is_visible });
  } catch (err) {
    console.error('Admin – toggle FAQ visibility error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── REORDER (bulk update display_order) ─────────────────────────────────────
export const reorderFaqs = async (req, res) => {
  try {
    // Expects: [{ id: 'uuid', display_order: 10 }, ...]
    const items = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Provide an array of { id, display_order }' });
    }

    await Promise.all(
      items.map(({ id, display_order }) =>
        db.Faq.update({ display_order }, { where: { id } })
      )
    );

    return res.json({ message: 'Order updated' });
  } catch (err) {
    console.error('Admin – reorder FAQs error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const deleteFaq = async (req, res) => {
  try {
    const faq = await db.Faq.findByPk(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });

    await faq.destroy();
    return res.json({ message: 'FAQ deleted successfully' });
  } catch (err) {
    console.error('Admin – delete FAQ error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};