import db from "../models/index.js";
import fetch from "node-fetch";

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────
const ALLOWED_ENTITY_TYPES = [
  "general",
  "homepage",
  "product",
  "project",
  "blog",
  "testimonial",
  "package",
  "appliance",
  "section",
  "global",
];

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

const MAX_FILE_SIZE_BYTES =
  Number(process.env.MAX_FILE_SIZE_BYTES) || 5 * 1024 * 1024;

const getBaseUrl = () =>
  process.env.NODE_ENV === "production"
    ? process.env.APP_URL || "https://wiibienergy.com"
    : `http://localhost:${process.env.PORT || 5000}`;

const deriveFilenameFromUrl = (url) => {
  try {
    const segments = new URL(url).pathname.split("/").filter(Boolean);
    return segments[segments.length - 1] || "external_image";
  } catch {
    return "external_image";
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// toFileResponse — shape returned to the frontend for each uploaded file
// ─────────────────────────────────────────────────────────────────────────────
const toFileResponse = (media, role, entityId) => ({
  id:          media.id,
  url:         media.url,
  filename:    media.filename,
  alt_text:    media.alt_text,
  entity_type: media.entity_type,
  entity_id:   entityId,
  is_external: media.is_external,
  role,
});

// =============================================================================
// uploadFiles
// POST /admin/upload   multipart/form-data
// =============================================================================
export const uploadFiles = async (req, res) => {
  console.log("[upload] files:", req.files, "body:", req.body);

  const files       = req.files || [];
  const externalUrl = req.body.externalUrl?.trim();
  const altText     = req.body.altText?.trim() || "Uploaded image";

  if (files.length === 0 && !externalUrl) {
    return res.status(400).json({ message: "No file uploaded and no external URL provided" });
  }

  const entityType = (req.body.entityType || "general").trim().toLowerCase();
  if (!ALLOWED_ENTITY_TYPES.includes(entityType)) {
    return res.status(400).json({
      message: `Invalid entityType. Allowed: ${ALLOWED_ENTITY_TYPES.join(", ")}`,
    });
  }

  // ── entity_id parsing ─────────────────────────────────────────────────────
  // Products use integer PKs; projects use UUID strings — handle both
  const rawEntityId   = req.body.entity_id?.trim();
  const isProjectType = entityType === "project";

  const parsedEntityId = rawEntityId
    ? isProjectType
      ? rawEntityId                        // keep UUID string as-is
      : parseInt(rawEntityId, 10) || null  // parse integer for products
    : null;

  if (rawEntityId && !parsedEntityId) {
    return res.status(400).json({ message: "entity_id must be a valid ID" });
  }

  const role         = ["main", "gallery"].includes(req.body.role) ? req.body.role : "gallery";
  const isFeatured   = role === "main";
  const displayOrder = Number(req.body.display_order) || 0;

  const transaction   = await db.sequelize.transaction();
  const uploadedFiles = [];

  try {
    const createMediaAndMaybeLink = async (mediaData) => {
      const media = await db.Media.create(
        {
          ...mediaData,
          is_featured:   isFeatured,
          display_order: displayOrder,
          alt_text:      altText,
          uploaded_by:   req.user?.id || null,
          entity_type:   parsedEntityId ? entityType : "general",
          entity_id:     parsedEntityId, // integer, UUID string, or null
        },
        { transaction },
      );

      // ── Product: create ProductMedia + sync featured_image_url ──────────
      if (parsedEntityId && entityType === "product") {
        await db.ProductMedia.create(
          {
            product_id:    parsedEntityId,
            media_id:      media.id,
            role,
            display_order: displayOrder,
            caption:       req.body.caption || null,
          },
          { transaction },
        );

        if (role === "main") {
          await db.Product.update(
            { featured_image_url: mediaData.url },
            { where: { id: parsedEntityId }, transaction },
          );
          console.log(`[upload] ✅ featured_image_url synced on product ${parsedEntityId}`);
        }
      }

      // ── Project: create ProjectMedia ─────────────────────────────────────
      if (parsedEntityId && entityType === "project") {
        await db.ProjectMedia.create(
          {
            project_id:    parsedEntityId, // UUID string
            media_id:      media.id,
            role,
            display_order: displayOrder,
            caption:       req.body.caption || null,
          },
          { transaction },
        );
      }

      return media;
    };

    // ── File uploads ─────────────────────────────────────────────────────────
    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new Error(`Invalid file type: ${file.mimetype}`);
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error(`File too large: ${file.originalname}`);
      }
      if (!file.processedUrl) {
        throw new Error(`Processed URL missing for: ${file.originalname}`);
      }

      const absoluteUrl = file.processedUrl.startsWith("http")
        ? file.processedUrl
        : `${getBaseUrl()}${file.processedUrl.startsWith("/") ? "" : "/"}${file.processedUrl}`;

      const media = await createMediaAndMaybeLink({
        url:         absoluteUrl,
        filename:    file.filename,
        mime_type:   file.mimetype,
        type:        "image",
        size_bytes:  file.size,
        is_external: false,
      });

      uploadedFiles.push(toFileResponse(media, role, parsedEntityId));
    }

    // ── External URL ──────────────────────────────────────────────────────────
    if (externalUrl) {
      if (!externalUrl.startsWith("http://") && !externalUrl.startsWith("https://")) {
        throw new Error("External URL must start with http:// or https://");
      }

      const response = await fetch(externalUrl, { method: "HEAD" });
      if (!response.ok) {
        throw new Error(`Failed to reach external URL: ${response.statusText}`);
      }

      const rawMime   = response.headers.get("content-type") || "";
      const mimeType  = rawMime.split(";")[0].trim();
      const sizeBytes = parseInt(response.headers.get("content-length"), 10) || null;

      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        throw new Error(`Invalid content type at URL: ${mimeType}`);
      }

      const media = await createMediaAndMaybeLink({
        url:         externalUrl,
        filename:    deriveFilenameFromUrl(externalUrl),
        mime_type:   mimeType,
        type:        "image",
        size_bytes:  sizeBytes,
        is_external: true,
      });

      uploadedFiles.push(toFileResponse(media, role, parsedEntityId));
    }

    await transaction.commit();

    return res.status(201).json({
      message: `Successfully processed ${uploadedFiles.length} image(s)`,
      files:   uploadedFiles,
    });

  } catch (err) {
    await transaction.rollback();
    console.error("[upload] error:", err);
    const isClientError = /Invalid|URL|too large|integer/i.test(err.message);
    return res.status(isClientError ? 400 : 500).json({
      message: "Upload failed",
      error:   err.message,
    });
  }
};

// =============================================================================
// attachMediaToProduct
// POST /admin/products/:id/media/attach
// =============================================================================
export const attachMediaToProduct = async (req, res) => {
  const { id: productId } = req.params;

  const parsedProductId = parseInt(productId, 10);
  if (!parsedProductId || isNaN(parsedProductId) || parsedProductId < 1) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  const { featured, gallery = [] } = req.body;

  if (!featured && gallery.length === 0) {
    return res.status(400).json({ message: "No media provided to attach" });
  }

  const product = await db.Product.findByPk(parsedProductId);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const transaction = await db.sequelize.transaction();

  try {
    const productMediaRows  = [];
    let featuredImageUrl    = product.featured_image_url;

    if (featured?.id) {
      await db.Media.update(
        { entity_type: "product", entity_id: parsedProductId },
        { where: { id: featured.id }, transaction },
      );
      productMediaRows.push({
        product_id:    parsedProductId,
        media_id:      featured.id,
        role:          "main",
        display_order: 0,
        caption:       null,
      });
      featuredImageUrl = featured.url;
    }

    for (const [index, img] of gallery.entries()) {
      if (!img?.id) continue;
      await db.Media.update(
        { entity_type: "product", entity_id: parsedProductId },
        { where: { id: img.id }, transaction },
      );
      productMediaRows.push({
        product_id:    parsedProductId,
        media_id:      img.id,
        role:          "gallery",
        display_order: index + 1,
        caption:       null,
      });
    }

    if (productMediaRows.length > 0) {
      await db.ProductMedia.bulkCreate(productMediaRows, { transaction });
    }

    if (featuredImageUrl !== product.featured_image_url) {
      await db.Product.update(
        { featured_image_url: featuredImageUrl },
        { where: { id: parsedProductId }, transaction },
      );
    }

    await transaction.commit();

    console.log(`[attach] ✅ Attached ${productMediaRows.length} media to product ${parsedProductId}`);

    return res.status(200).json({
      message:            "Media attached successfully",
      product_id:         parsedProductId,
      featured_image_url: featuredImageUrl,
      attached:           productMediaRows.length,
    });

  } catch (err) {
    await transaction.rollback();
    console.error("[attach] error:", err);
    return res.status(500).json({ message: "Failed to attach media", error: err.message });
  }
};

// =============================================================================
// attachMediaToProject
// POST /admin/projects/:id/media/attach
// =============================================================================
export const attachMediaToProject = async (req, res) => {
  const projectId = req.params.id; // UUID string

  const { gallery = [] } = req.body;

  if (gallery.length === 0) {
    return res.status(400).json({ message: "No media provided to attach" });
  }

  const project = await db.Project.findByPk(projectId);
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  const transaction = await db.sequelize.transaction();

  try {
    const rows = [];

    for (const [index, img] of gallery.entries()) {
      if (!img?.id) continue;

      await db.Media.update(
        { entity_type: "project", entity_id: projectId },
        { where: { id: img.id }, transaction },
      );

      rows.push({
        project_id:    projectId,
        media_id:      img.id,
        role:          "gallery",
        display_order: index,
        caption:       img.caption || null,
      });
    }

    if (rows.length) {
      await db.ProjectMedia.bulkCreate(rows, {
        transaction,
        ignoreDuplicates: true,
      });
    }

    await transaction.commit();

    console.log(`[attach] ✅ Attached ${rows.length} media to project ${projectId}`);

    return res.status(200).json({
      message:  "Media attached successfully",
      attached: rows.length,
    });

  } catch (err) {
    await transaction.rollback();
    console.error("[attachMediaToProject] error:", err);
    return res.status(500).json({ message: "Failed to attach media", error: err.message });
  }
};