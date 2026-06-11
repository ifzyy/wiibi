import {
  uploadMedia,
  attachToProduct,
  attachToProject,
  ALLOWED_ENTITY_TYPES,
} from "../services/upload.service.js";

// =============================================================================
// POST /admin/upload
// =============================================================================
export const uploadFiles = async (req, res) => {
  const files       = req.files || [];
  const externalUrl = req.body.externalUrl?.trim();

  if (files.length === 0 && !externalUrl) {
    return res.status(400).json({ message: "No file uploaded and no external URL provided" });
  }

  const entityType = (req.body.entityType || "general").trim().toLowerCase();
  if (!ALLOWED_ENTITY_TYPES.includes(entityType)) {
    return res.status(400).json({
      message: `Invalid entityType. Allowed: ${ALLOWED_ENTITY_TYPES.join(", ")}`,
    });
  }

  const rawEntityId    = req.body.entity_id?.trim();
  const isProjectType  = entityType === "project";
  const parsedEntityId = rawEntityId
    ? isProjectType
      ? rawEntityId
      : parseInt(rawEntityId, 10) || null
    : null;

  if (rawEntityId && !parsedEntityId) {
    return res.status(400).json({ message: "entity_id must be a valid ID" });
  }

  const role         = ["main", "gallery"].includes(req.body.role) ? req.body.role : "gallery";
  const displayOrder = Number(req.body.display_order) || 0;
  const altText      = req.body.altText?.trim() || "Uploaded image";
  const caption      = req.body.caption || null;

  try {
    const results = await uploadMedia(files, externalUrl || null, {
      entityType,
      entityId:     parsedEntityId,
      role,
      displayOrder,
      altText,
      caption,
      userId:       req.user?.id || null,
    });

    return res.status(201).json({
      message: `Successfully processed ${results.length} image(s)`,
      files:   results,
    });
  } catch (err) {
    const status = err.status || (/Invalid|URL|too large|integer/i.test(err.message) ? 400 : 500);
    return res.status(status).json({ message: "Upload failed", error: err.message });
  }
};

// =============================================================================
// POST /admin/products/:id/media/attach
// =============================================================================
export const attachMediaToProduct = async (req, res) => {
  const productId = parseInt(req.params.id, 10);
  if (!productId || isNaN(productId) || productId < 1) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  const { featured, gallery = [] } = req.body;
  if (!featured && gallery.length === 0) {
    return res.status(400).json({ message: "No media provided to attach" });
  }

  try {
    const result = await attachToProduct(productId, { featured, gallery });
    return res.status(200).json({
      message:            "Media attached successfully",
      product_id:         productId,
      featured_image_url: result.featured_image_url,
      attached:           result.attached,
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: "Failed to attach media", error: err.message });
  }
};

// =============================================================================
// POST /admin/projects/:id/media/attach
// =============================================================================
export const attachMediaToProject = async (req, res) => {
  const projectId = req.params.id;
  const { gallery = [] } = req.body;

  if (gallery.length === 0) {
    return res.status(400).json({ message: "No media provided to attach" });
  }

  try {
    const result = await attachToProject(projectId, { gallery });
    return res.status(200).json({
      message:  "Media attached successfully",
      attached: result.attached,
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: "Failed to attach media", error: err.message });
  }
};
