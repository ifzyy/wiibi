/**
 * upload.service.js
 *
 * All image upload business logic lives here.
 * Controllers call this service; the service calls storage providers + DB.
 *
 * Flow for file uploads:
 *   1. Validate (type, size) — pure, no I/O
 *   2. Save each buffer to storage provider (local or cloud)
 *   3. Write Media + junction rows inside a DB transaction
 *   4. On any failure: rollback DB + delete already-saved files
 *
 * Flow for external URLs:
 *   1. Validate URL format
 *   2. HEAD request to verify reachability + MIME type
 *   3. Create Media + junction rows in a DB transaction
 */

import fetch from "node-fetch";
import db    from "../models/index.js";
import storageProvider from "./storage/index.js";

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────
export const ALLOWED_ENTITY_TYPES = [
  "general", "homepage", "product", "project", "blog",
  "testimonial", "package", "appliance", "section", "global",
];

export const ALLOWED_MIME_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
];

export const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE_BYTES) || 5 * 1024 * 1024;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const deriveFilename = (url) => {
  try {
    const segments = new URL(url).pathname.split("/").filter(Boolean);
    return segments[segments.length - 1] || "external_image";
  } catch {
    return "external_image";
  }
};

export const toFileResponse = (media, role, entityId) => ({
  id:          media.id,
  url:         media.url,
  filename:    media.filename,
  alt_text:    media.alt_text,
  entity_type: media.entity_type,
  entity_id:   entityId,
  is_external: media.is_external,
  role,
});

// Creates a Media row and optionally a junction row (ProductMedia / ProjectMedia)
const createMediaAndLink = async (mediaData, options) => {
  const { entityType, entityId, role, displayOrder, caption, userId, transaction } = options;
  const isFeatured = role === "main";

  const media = await db.Media.create(
    {
      ...mediaData,
      is_featured:   isFeatured,
      display_order: displayOrder,
      uploaded_by:   userId || null,
      entity_type:   entityId ? entityType : "general",
      entity_id:     entityId,
    },
    { transaction },
  );

  if (entityId && entityType === "product") {
    await db.ProductMedia.create(
      { product_id: entityId, media_id: media.id, role, display_order: displayOrder, caption: caption || null },
      { transaction },
    );
    if (isFeatured) {
      await db.Product.update(
        { featured_image_url: mediaData.url },
        { where: { id: entityId }, transaction },
      );
    }
  }

  if (entityId && entityType === "project") {
    await db.ProjectMedia.create(
      { project_id: entityId, media_id: media.id, role, display_order: displayOrder, caption: caption || null },
      { transaction },
    );
  }

  return media;
};

// ─────────────────────────────────────────────────────────────────────────────
// uploadMedia
//
// Main entry point called by the upload controller.
// Handles both file uploads and external URL registration in one call.
// ─────────────────────────────────────────────────────────────────────────────
export const uploadMedia = async (files, externalUrl, options) => {
  const { entityType, entityId, role, displayOrder, altText, caption, userId } = options;

  // ── Validate before any I/O ─────────────────────────────────────────────
  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype))
      throw Object.assign(new Error(`Invalid file type: ${file.mimetype}`), { status: 400 });
    if (file.size > MAX_FILE_SIZE)
      throw Object.assign(new Error(`File too large: ${file.originalname}`), { status: 400 });
  }

  // ── Phase 1: save files to storage (outside transaction) ────────────────
  const savedFiles = [];
  try {
    for (const file of files) {
      const stored = await storageProvider.saveFile(file.buffer, {
        entityType,
        fieldname:    file.fieldname,
        originalname: file.originalname,
      });
      savedFiles.push({ file, stored });
    }
  } catch (err) {
    // Clean up any files written before the error
    await Promise.allSettled(savedFiles.map(({ stored }) => storageProvider.deleteFile(stored.storagePath)));
    throw err;
  }

  // ── Phase 2: write to DB in a single transaction ─────────────────────────
  const results     = [];
  const transaction = await db.sequelize.transaction();

  try {
    for (const { file, stored } of savedFiles) {
      const media = await createMediaAndLink(
        {
          url:         stored.url,
          filename:    stored.filename,
          mime_type:   file.mimetype,
          type:        "image",
          size_bytes:  file.size,
          width:       stored.width,
          height:      stored.height,
          alt_text:    altText || file.originalname,
          is_external: false,
        },
        { entityType, entityId, role, displayOrder, caption, userId, transaction },
      );
      results.push(toFileResponse(media, role, entityId));
    }

    // External URL handled in the same transaction
    if (externalUrl) {
      const extResult = await _registerExternalUrl(externalUrl, options, transaction);
      results.push(extResult);
    }

    await transaction.commit();
    return results;

  } catch (err) {
    await transaction.rollback();
    // Clean up files saved in Phase 1
    await Promise.allSettled(savedFiles.map(({ stored }) => storageProvider.deleteFile(stored.storagePath)));
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// _registerExternalUrl (private)
// ─────────────────────────────────────────────────────────────────────────────
const _registerExternalUrl = async (url, options, transaction) => {
  const { entityType, entityId, role, displayOrder, altText, caption, userId } = options;

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    throw Object.assign(new Error("External URL must start with http:// or https://"), { status: 400 });
  }

  const response = await fetch(url, { method: "HEAD" });
  if (!response.ok) {
    throw Object.assign(new Error(`Failed to reach external URL: ${response.statusText}`), { status: 400 });
  }

  const rawMime  = response.headers.get("content-type") || "";
  const mimeType = rawMime.split(";")[0].trim();
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw Object.assign(new Error(`Invalid content type at URL: ${mimeType}`), { status: 400 });
  }

  const sizeBytes = parseInt(response.headers.get("content-length"), 10) || null;

  const media = await createMediaAndLink(
    {
      url,
      filename:    deriveFilename(url),
      mime_type:   mimeType,
      type:        "image",
      size_bytes:  sizeBytes,
      width:       null,
      height:      null,
      alt_text:    altText || "External image",
      is_external: true,
    },
    { entityType, entityId, role, displayOrder, caption, userId, transaction },
  );

  return toFileResponse(media, role, entityId);
};

// ─────────────────────────────────────────────────────────────────────────────
// attachToProduct
//
// Links pre-uploaded (general) Media records to a specific product.
// Called after product creation in the CREATE flow.
// ─────────────────────────────────────────────────────────────────────────────
export const attachToProduct = async (productId, { featured, gallery = [] }) => {
  const product = await db.Product.findByPk(productId);
  if (!product) throw Object.assign(new Error("Product not found"), { status: 404 });

  const rows             = [];
  let   featuredImageUrl = product.featured_image_url;
  const transaction      = await db.sequelize.transaction();

  try {
    if (featured?.id) {
      await db.Media.update(
        { entity_type: "product", entity_id: productId },
        { where: { id: featured.id }, transaction },
      );
      rows.push({ product_id: productId, media_id: featured.id, role: "main", display_order: 0, caption: null });
      featuredImageUrl = featured.url;
    }

    for (const [i, img] of gallery.entries()) {
      if (!img?.id) continue;
      await db.Media.update(
        { entity_type: "product", entity_id: productId },
        { where: { id: img.id }, transaction },
      );
      rows.push({ product_id: productId, media_id: img.id, role: "gallery", display_order: i + 1, caption: null });
    }

    if (rows.length) await db.ProductMedia.bulkCreate(rows, { transaction });

    if (featuredImageUrl !== product.featured_image_url) {
      await db.Product.update(
        { featured_image_url: featuredImageUrl },
        { where: { id: productId }, transaction },
      );
    }

    await transaction.commit();
    return { attached: rows.length, featured_image_url: featuredImageUrl };

  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// attachToProject
// ─────────────────────────────────────────────────────────────────────────────
export const attachToProject = async (projectId, { gallery = [] }) => {
  const project = await db.Project.findByPk(projectId);
  if (!project) throw Object.assign(new Error("Project not found"), { status: 404 });

  const rows        = [];
  const transaction = await db.sequelize.transaction();

  try {
    for (const [i, img] of gallery.entries()) {
      if (!img?.id) continue;
      await db.Media.update(
        { entity_type: "project", entity_id: projectId },
        { where: { id: img.id }, transaction },
      );
      rows.push({ project_id: projectId, media_id: img.id, role: "gallery", display_order: i, caption: img.caption || null });
    }

    if (rows.length) {
      await db.ProjectMedia.bulkCreate(rows, { transaction, ignoreDuplicates: true });
    }

    await transaction.commit();
    return { attached: rows.length };

  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};
