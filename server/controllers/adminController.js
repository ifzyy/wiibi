import db from '../models/index.js';
import { Op } from 'sequelize';
import { invalidatePageCache } from './publicController.js'; // your cache invalidator

// --------------------------------------------------
// Middleware: ensure admin role (add to routes)
// --------------------------------------------------
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// --------------------------------------------------
// 1. Global Settings
// --------------------------------------------------
export const getGlobalSettings = async (req, res) => {
  try {
    const settings = await db.GlobalSetting.findAll({
      where: { is_public: true },
      attributes: ['key', 'label', 'description', 'type', 'value', 'group'],
      order: [['group', 'ASC'], ['key', 'ASC']],
    });

    res.json(settings);
  } catch (err) {
    console.error('Admin globals error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateGlobalSetting = async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  try {
    const setting = await db.GlobalSetting.findOne({ where: { key } });
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    // Optional: validate value based on type
    // if (setting.type === 'number' && isNaN(value)) return res.status(400).json({ message: 'Invalid number' });

    setting.value = value;
    await setting.save();

    // Invalidate globals cache
    cache.del('globals');

    res.json({ message: 'Updated', setting });
  } catch (err) {
    console.error('Update global error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --------------------------------------------------
// 2. Pages
// --------------------------------------------------
export const getPages = async (req, res) => {
  try {
    const pages = await db.Page.findAll({
      attributes: ['id', 'title', 'slug', 'status', 'meta_title', 'meta_description'],
      order: [['title', 'ASC']],
    });
    res.json(pages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPage = async (req, res) => {
  const { id } = req.params;

  try {
    const page = await db.Page.findByPk(id, {
      include: [{
        model: db.PageSection,
        attributes: ['id', 'section_type', 'display_order', 'is_visible', 'content'],
        order: [['display_order', 'ASC']],
      }],
    });

    if (!page) return res.status(404).json({ message: 'Page not found' });

    res.json(page);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updatePage = async (req, res) => {
  const { id } = req.params;
  const { title, slug, status, meta_title, meta_description } = req.body;

  try {
    const page = await db.Page.findByPk(id);
    if (!page) return res.status(404).json({ message: 'Page not found' });

    await page.update({
      title,
      slug,
      status,
      meta_title,
      meta_description,
    });

    // Invalidate page cache
    invalidatePageCache(page.slug);

    res.json(page);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --------------------------------------------------
// 3. Page Sections
// --------------------------------------------------
export const getSectionsForPage = async (req, res) => {
  const { pageId } = req.query;

  try {
    const sections = await db.PageSection.findAll({
      where: pageId ? { page_id: pageId } : {},
      order: [['display_order', 'ASC']],
    });

    res.json(sections);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createSection = async (req, res) => {
  const { page_id, section_type, display_order, is_visible, content } = req.body;

  try {
    // Default order: append to end
    let order = display_order ?? 9999;
    if (order === 9999) {
      const last = await db.PageSection.findOne({
        where: { page_id },
        order: [['display_order', 'DESC']],
        attributes: ['display_order'],
      });
      order = last ? last.display_order + 10 : 10;
    }

    const section = await db.PageSection.create({
      page_id,
      section_type,
      display_order: order,
      is_visible: is_visible ?? true,
      content: content || {},
    });

    invalidatePageCache((await db.Page.findByPk(page_id))?.slug);

    res.status(201).json(section);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateSection = async (req, res) => {
  const { id } = req.params;
  const { section_type, display_order, is_visible, content } = req.body;

  try {
    const section = await db.PageSection.findByPk(id);
    if (!section) return res.status(404).json({ message: 'Section not found' });

    await section.update({
      section_type,
      display_order,
      is_visible,
      content,
    });

    const page = await db.Page.findByPk(section.page_id);
    invalidatePageCache(page?.slug);

    res.json(section);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteSection = async (req, res) => {
  const { id } = req.params;

  try {
    const section = await db.PageSection.findByPk(id);
    if (!section) return res.status(404).json({ message: 'Section not found' });

    const pageId = section.page_id;
    await section.destroy();

    const page = await db.Page.findByPk(pageId);
    invalidatePageCache(page?.slug);

    res.json({ message: 'Section deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const reorderSections = async (req, res) => {
  const { sections } = req.body; // [{ id: "...", display_order: 10 }, ...]

  if (!Array.isArray(sections) || sections.length === 0) {
    return res.status(400).json({ message: 'Invalid sections array' });
  }

  try {
    await db.sequelize.transaction(async (t) => {
      for (const { id, display_order } of sections) {
        await db.PageSection.update(
          { display_order },
          { where: { id }, transaction: t }
        );
      }
    });

    // Invalidate all affected pages (for simplicity, or track page_ids)
    const pageIds = [...new Set(sections.map(s => s.page_id))];
    for (const pid of pageIds) {
      const page = await db.Page.findByPk(pid);
      invalidatePageCache(page?.slug);
    }

    res.json({ message: 'Sections reordered' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};