import db from '../models/index.js';
import NodeCache from 'node-cache';
import { invalidatePageCache } from './publicController.js';
import upload, { processImage } from '../middleware/upload.js';
import path from 'path';
import fs from 'fs/promises';

const publicCache = new NodeCache({
  stdTTL: 300,
  checkperiod: 600,
  maxKeys: 1000,
  useClones: false,
});

const CACHE_KEY_LIST = 'public:projects:list';
const CACHE_KEY_DETAIL = (slug) => `public:project:${slug}`;

// ── ADMIN: Get all projects (paginated, searchable)
export const getAdminProjects = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[db.Sequelize.Op.or] = [
        { title: { [db.Sequelize.Op.iLike]: `%${search}%` } },
        { overview: { [db.Sequelize.Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await db.Project.findAndCountAll({
      where,
      include: [
        { model: db.Media, as: 'featuredImage' },
        { model: db.Media, as: 'galleryImages' },
      ],
      attributes: [
        'id', 'title', 'slug', 'year', 'location', 'type',
        'featured_image_id', 'gallery_image_ids', 'is_featured',
        'display_order', 'is_visible',
      ],
      order: [['display_order', 'ASC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      projects: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── ADMIN: Create project
export const createProject = [
  upload.fields([
    { name: 'featuredImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 10 }, // support multiple gallery uploads
  ]),
  processImage,
  async (req, res) => {
    try {
      const projectData = { ...req.body };

      let featuredImageId = null;
      const galleryIds = [];

      // Featured image
      if (req.files?.featuredImage?.[0]) {
        const file = req.files.featuredImage[0];
        const media = await db.Media.create({
          url: file.processedUrl,
          filename: file.filename,
          mime_type: file.mimetype,
          type: 'image',
          size_bytes: file.size,
          alt_text: req.body.altText || projectData.title,
          uploaded_by: req.user.id,
          entity_type: 'project',
          entity_id: null, // update after creation
          is_featured: true,
          display_order: 0,
        });
        featuredImageId = media.id;
      }

      // Gallery images
      if (req.files?.galleryImages) {
        for (const file of req.files.galleryImages) {
          const media = await db.Media.create({
            url: file.processedUrl,
            filename: file.filename,
            mime_type: file.mimetype,
            type: 'image',
            size_bytes: file.size,
            alt_text: file.originalname,
            uploaded_by: req.user.id,
            entity_type: 'project',
            entity_id: null,
            is_featured: false,
            display_order: galleryIds.length,
          });
          galleryIds.push(media.id);
        }
      }

      const project = await db.Project.create({
        ...projectData,
        featured_image_id: featuredImageId,
        gallery_image_ids: JSON.stringify(galleryIds),
      });

      // Link media records to project
      if (featuredImageId) {
        await db.Media.update(
          { entity_id: project.id },
          { where: { id: featuredImageId } }
        );
      }
      if (galleryIds.length > 0) {
        await db.Media.update(
          { entity_id: project.id },
          { where: { id: { [db.Sequelize.Op.in]: galleryIds } } }
        );
      }

      invalidatePageCache('projects');
      publicCache.del(CACHE_KEY_LIST);

      res.status(201).json(project);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message || 'Server error' });
    }
  },
];

// ── ADMIN: Update project
export const updateProject = [
  upload.fields([
    { name: 'featuredImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 10 },
  ]),
  processImage,
  async (req, res) => {
    try {
      const { id } = req.params;
      const project = await db.Project.findByPk(id, {
        include: [
          { model: db.Media, as: 'featuredImage' },
          { model: db.Media, as: 'galleryImages' },
        ],
      });

      if (!project) return res.status(404).json({ message: 'Project not found' });

      const updates = { ...req.body };

      // Featured image replacement
      if (req.files?.featuredImage?.[0]) {
        const file = req.files.featuredImage[0];
        const newMedia = await db.Media.create({
          url: file.processedUrl,
          filename: file.filename,
          mime_type: file.mimetype,
          type: 'image',
          size_bytes: file.size,
          alt_text: req.body.altText || project.title,
          uploaded_by: req.user.id,
          entity_type: 'project',
          entity_id: project.id,
          is_featured: true,
          display_order: 0,
        });

        // Soft-delete old featured image
        if (project.featured_image_id) {
          await db.Media.update(
            { deleted_at: new Date() },
            { where: { id: project.featured_image_id } }
          );
        }

        updates.featured_image_id = newMedia.id;
      }

      // Gallery images (append new ones)
      if (req.files?.galleryImages) {
        const currentGallery = JSON.parse(project.gallery_image_ids || '[]');
        const newGalleryIds = [];

        for (const file of req.files.galleryImages) {
          const media = await db.Media.create({
            url: file.processedUrl,
            filename: file.filename,
            mime_type: file.mimetype,
            type: 'image',
            size_bytes: file.size,
            alt_text: file.originalname,
            uploaded_by: req.user.id,
            entity_type: 'project',
            entity_id: project.id,
            is_featured: false,
            display_order: currentGallery.length + newGalleryIds.length,
          });
          newGalleryIds.push(media.id);
        }

        updates.gallery_image_ids = JSON.stringify([...currentGallery, ...newGalleryIds]);
      }

      await project.update(updates);

      invalidatePageCache('projects');
      publicCache.del(CACHE_KEY_LIST);
      publicCache.del(CACHE_KEY_DETAIL(project.slug));

      const updatedProject = await db.Project.findByPk(id, {
        include: [
          { model: db.Media, as: 'featuredImage' },
          { model: db.Media, as: 'galleryImages' },
        ],
      });

      res.json(updatedProject);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message || 'Server error' });
    }
  },
];

// ── ADMIN: Delete project
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await db.Project.findByPk(id, {
      include: [
        { model: db.Media, as: 'featuredImage' },
        { model: db.Media, as: 'galleryImages' },
      ],
    });

    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Soft-delete featured image
    if (project.featured_image_id) {
      await db.Media.update(
        { deleted_at: new Date() },
        { where: { id: project.featured_image_id } }
      );
    }

    // Soft-delete gallery images
    if (project.gallery_image_ids?.length > 0) {
      await db.Media.update(
        { deleted_at: new Date() },
        { where: { id: { [db.Sequelize.Op.in]: JSON.parse(project.gallery_image_ids) } } }
      );
    }

    await project.destroy();

    invalidatePageCache('projects');
    publicCache.del(CACHE_KEY_LIST);
    publicCache.del(CACHE_KEY_DETAIL(project.slug));

    res.json({ message: 'Project and associated media deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


