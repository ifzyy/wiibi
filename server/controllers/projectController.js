import db from '../models/index.js';
import { generateUniqueSlug } from '../utils/generateSlug.js';

// ── ADMIN: List Projects ──────────────────────────────────────────────────────
export const getAdminProjects = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const where  = {};

    if (search) {
      where[db.Sequelize.Op.or] = [
        { title:    { [db.Sequelize.Op.iLike]: `%${search}%` } },
        { overview: { [db.Sequelize.Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await db.Project.findAndCountAll({
      where,
      include: [{
        model:   db.ProjectMedia,
        as:      'mediaRelations',
        include: [{ model: db.Media, as: 'media' }],
        order:   [['display_order', 'ASC']],
      }],
      attributes: ['id', 'title', 'slug', 'year', 'location', 'type', 'is_featured', 'display_order', 'overview', 'problem', 'solution', 'results', 'conclusion',  'is_visible','createdAt', 'updatedAt'],
      order:      [['display_order', 'ASC'], ['createdAt', 'DESC']],
      limit:      parseInt(limit),
      offset,
    });

    res.json({
      projects: rows.map(project => ({
        ...project.toJSON(),
        galleryImages:  project.mediaRelations?.map(rel => rel.media) || [],
        mediaRelations: undefined,
      })),
      pagination: {
        total: count,
        page:  parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    console.error('Get admin projects error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── ADMIN: Create Project ─────────────────────────────────────────────────────
export const createProject = async (req, res) => {
  try {
    const data = { ...req.body };
console.log(data)
    if (!data.title?.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    data.slug = await generateUniqueSlug(data.title);

    const project = await db.Project.create({
      ...data,
      type:          data.type          || 'project',
      is_visible:    data.is_visible    ?? true,
      is_featured:   data.is_featured   ?? false,
      display_order: data.display_order ?? 0,
    });

    res.status(201).json(project);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// ── ADMIN: Update Project ─────────────────────────────────────────────────────
export const updateProject = async (req, res) => {
  try {
    const { id }  = req.params;
    const project = await db.Project.findByPk(id);

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const updates = { ...req.body };

    if (updates.title && (!updates.slug || !updates.slug.trim())) {
      updates.slug = await generateUniqueSlug(updates.title, id);
    } else if (updates.slug) {
      updates.slug = await generateUniqueSlug(updates.slug, id);
    }

    await project.update(updates);

    if (req.body.mediaRelations) {
      await db.sequelize.transaction(async (t) => {
        await db.ProjectMedia.destroy({ where: { project_id: id }, transaction: t });

        const relations = req.body.mediaRelations.map((rel, index) => ({
          project_id:    id,
          media_id:      rel.media_id,
          role:          rel.role || 'gallery',
          display_order: rel.display_order ?? index,
          caption:       rel.caption,
        }));

        if (relations.length) {
          await db.ProjectMedia.bulkCreate(relations, { transaction: t });
        }
      });
    }

    const updated = await db.Project.findByPk(id, {
      include: [{
        model:   db.ProjectMedia,
        as:      'mediaRelations',
        include: [{ model: db.Media, as: 'media' }],
        order:   [['display_order', 'ASC']],
      }],
    });

    res.json(updated);
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// ── ADMIN: Delete Project ─────────────────────────────────────────────────────
export const deleteProject = async (req, res) => {
  try {
    const { id }  = req.params;
    const project = await db.Project.findByPk(id);

    if (!project) return res.status(404).json({ message: 'Project not found' });

    await db.sequelize.transaction(async (t) => {
      await db.ProjectMedia.destroy({ where: { project_id: id }, transaction: t });
      await project.destroy({ transaction: t });
    });

    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};