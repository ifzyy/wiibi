import db from '../models/index.js';
import { Op } from 'sequelize';
import { invalidatePageCache } from './publicController.js';

// ============================================================================
// MIDDLEWARE
// ============================================================================

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// ============================================================================
// GLOBALS HELPER  (no cache — direct DB read)
// ============================================================================

async function getGlobals() {
  const rows = await db.GlobalSetting.findAll({
    where:      { is_public: true },
    attributes: ['key', 'value'],
  });
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

function buildStats(globals) {
  return Object.keys(globals)
    .filter(k => k.startsWith('stats.') && k.endsWith('.value'))
    .map(key => {
      const labelKey = key.replace('.value', '.label');
      return {
        label: globals[labelKey] ?? key
          .replace('stats.', '')
          .replace('.value', '')
          .replace(/_/g, ' '),
        value: globals[key],
      };
    });
}

// ============================================================================
// 1. GLOBAL SETTINGS
// ============================================================================

export const getGlobalSettings = async (req, res) => {
  try {
    const settings = await db.GlobalSetting.findAll({
      where:      { is_public: true },
      attributes: ['key', 'label', 'description', 'type', 'value', 'group'],
      order:      [['group', 'ASC'], ['key', 'ASC']],
    });
    res.json(settings);
  } catch (err) {
    console.error('Admin globals error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateGlobalSetting = async (req, res) => {
  const { key }   = req.params;
  const { value } = req.body;

  try {
    const setting = await db.GlobalSetting.findOne({ where: { key } });
    if (!setting) return res.status(404).json({ message: 'Setting not found' });

    setting.value = value;
    await setting.save();

    res.json({ message: 'Updated', setting });
  } catch (err) {
    console.error('Update global error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// 2. PAGES
// ============================================================================

export const getPages = async (req, res) => {
  try {
    const pages = await db.Page.findAll({
      attributes: ['id', 'title', 'slug', 'status', 'meta_title', 'meta_description'],
      order:      [['title', 'ASC']],
    });
    res.json(pages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPage = async (req, res) => {
  try {
    const { slug = 'home' } = req.params;

    const page = await db.Page.findOne({
      where:      { slug, status: 'published' },
      attributes: ['id', 'title', 'slug', 'meta_title', 'meta_description'],
      include: [{
        model:      db.PageSection,
        where:      { is_visible: true },
        attributes: ['id', 'section_type', 'display_order', 'content'],
        required:   false,
        order:      [['display_order', 'ASC']],
        include: [{
          model:    db.PageSectionMedia,
          as:       'mediaRelations',
          required: false,
          order:    [['display_order', 'ASC']],
          include: [{
            model:      db.Media,
            as:         'media',
            attributes: ['id', 'url', 'alt_text', 'mime_type', 'is_external'],
          }],
        }],
      }],
    });

    if (!page) {
      return res.status(404).json({
        message: 'Page not found or not published',
        fallback: { title: 'Page Not Found', content: 'The requested page is unavailable or still in draft.' },
      });
    }

    const sections = page.PageSections.map(sec => ({
      id:      sec.id,
      type:    sec.section_type,
      order:   sec.display_order,
      content: sec.content || {},
      media:   sec.mediaRelations?.map(rel => ({
        id:            rel.media?.id,
        url:           rel.media?.url,
        alt_text:      rel.media?.alt_text || rel.caption || `Image for ${sec.section_type}`,
        role:          rel.role,
        display_order: rel.display_order,
        caption:       rel.caption,
        is_external:   rel.media?.is_external || false,
      })).filter(m => m.url) || [],
    }));

    const globals = await getGlobals();
    const stats   = buildStats(globals);

    return res.json({
      page: {
        id:               page.id,
        title:            page.title,
        slug:             page.slug,
        meta_title:       page.meta_title || page.title,
        meta_description: page.meta_description || '',
      },
      sections,
      globals,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Page fetch error:', err);
    res.status(500).json({
      message: 'Internal server error while fetching page content',
      error:   process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

export const updatePage = async (req, res) => {
  const { id } = req.params;
  const { title, slug, status, meta_title, meta_description } = req.body;

  try {
    const page = await db.Page.findByPk(id);
    if (!page) return res.status(404).json({ message: 'Page not found' });

    await page.update({ title, slug, status, meta_title, meta_description });
    res.json(page);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// 3. PAGE SECTIONS
// ============================================================================

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
    let order = display_order ?? 9999;
    if (order === 9999) {
      const last = await db.PageSection.findOne({
        where:      { page_id },
        order:      [['display_order', 'DESC']],
        attributes: ['display_order'],
      });
      order = last ? last.display_order + 10 : 10;
    }

    const section = await db.PageSection.create({
      page_id,
      section_type,
      display_order: order,
      is_visible:    is_visible ?? true,
      content:       content || {},
    });

    res.status(201).json(section);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateSection = async (req, res) => {
  const { id }                = req.params;
  const { content, is_visible } = req.body;

  try {
    const section = await db.PageSection.findByPk(id);
    if (!section) return res.status(404).json({ message: 'Section not found' });

    await section.update({ content, is_visible });
    res.json(section);
  } catch (err) {
    console.error('updateSection failed:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const deleteSection = async (req, res) => {
  const { id } = req.params;

  try {
    const section = await db.PageSection.findByPk(id);
    if (!section) return res.status(404).json({ message: 'Section not found' });

    await section.destroy();
    res.json({ message: 'Section deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const reorderSections = async (req, res) => {
  const { sections } = req.body;

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
    res.json({ message: 'Sections reordered' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const assignMediaToSection = async (req, res) => {
  const { sectionId }         = req.params;
  const { media, reset = false } = req.body;
console.log(['assignMediaToSection', req.body]);
  if (!Array.isArray(media) || media.length === 0) {
    return res.status(400).json({
      message: 'Invalid or empty media array. Provide at least one media assignment.',
    });
  }

  const allowedRoles = [
    'hero', 'background', 'gallery', 'cta',
    'stats-icon', 'featured', 'thumbnail', 'mobile-hero','pillar1-image','pillar2-image','staff-media-1','staff-media-2','staff-media-3','staff-media-4','staff-media-5','staff-media-6','staff-media-7','staff-media-8','staff-media-9','staff-media-10',
  ];

  try {
    const t = await db.sequelize.transaction();

    const section = await db.PageSection.findByPk(sectionId, { transaction: t });
    if (!section) {
      await t.rollback();
      return res.status(404).json({ message: 'Page section not found' });
    }

    if (reset) {
      const rolesToReset = [...new Set(media.map(m => m.role))];
      await db.PageSectionMedia.destroy({
        where:       { page_section_id: sectionId, role: rolesToReset },
        transaction: t,
      });
    }

    const assignments = [];
    const seen        = new Set();

    for (let i = 0; i < media.length; i++) {
      const item = media[i];

      if (!item.mediaId || !item.role) throw new Error('Each media item must have mediaId and role');
      if (seen.has(item.mediaId))      throw new Error(`Duplicate mediaId: ${item.mediaId}`);
      seen.add(item.mediaId);

      if (!allowedRoles.includes(item.role)) {
        throw new Error(`Invalid role "${item.role}". Allowed: ${allowedRoles.join(', ')}`);
      }

      const exists = await db.Media.findByPk(item.mediaId, { transaction: t });
      if (!exists) throw new Error(`Media not found: ${item.mediaId}`);

      assignments.push({
        page_section_id: sectionId,
        media_id:        item.mediaId,
        role:            item.role,
        display_order:   item.displayOrder ?? i,
        caption:         item.caption || null,
      });
    }

    await db.PageSectionMedia.bulkCreate(assignments, {
      transaction:       t,
      updateOnDuplicate: ['display_order', 'caption'],
    });

    await t.commit();

    return res.status(200).json({
      message:       `${assignments.length} media item(s) attached to section`,
      sectionId,
      assignedCount: assignments.length,
    });

  } catch (err) {
    console.error('Assign media error:', err);
    if (/Invalid|Duplicate|not found/i.test(err.message)) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Failed to assign media' });
  }
};