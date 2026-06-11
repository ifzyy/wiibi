// =============================================================================
// useProductSubmit.js
//
// Owns the ENTIRE save flow — upload images, create/update product, attach media.
//
// ─── Image slot shapes ────────────────────────────────────────────────────────
//   null
//   { type: "staged",   file: File,   preview: blobUrl }   ← new, not uploaded yet
//   { type: "existing", url: string,  mediaId: number|null } ← already on server
//
// ─── Component image shape (form.components[i].image) ────────────────────────
//   null | undefined     → no image
//   File object          → staged, needs upload before payload is built
//   string (URL)         → already uploaded / existing, pass through as-is
//
// ─── CREATE flow ──────────────────────────────────────────────────────────────
//   1. Upload staged main_image          POST /admin/upload  role:"main"
//   2. Upload staged other_images        POST /admin/upload  role:"gallery"
//   3. Upload staged marketing_images    POST /admin/upload  role:"gallery"
//   4. Upload staged component images    POST /admin/upload  role:"gallery"
//   5. POST /admin/products              → returns flat product { id, ... }
//   6. POST /admin/products/:id/media/attach
//
// ─── EDIT flow ────────────────────────────────────────────────────────────────
//   1–4. Same — entity_id = product.id so linking is immediate on upload
//   5. PATCH /admin/products/:id
//   6. POST /admin/products/:id/media/attach  only if new files were staged
//
// Returns: { submitting, error, setError, handleSubmit }
// =============================================================================

import { useState } from "react";
import api          from "../../../../utils/api";
import { uploadFile } from "../../../../utils/uploadApi";

// uploadMany — parallel, preserves order, skips null/non-File slots
const uploadMany = (files, role, entityType, entityId) =>
  Promise.all(
    files.map(f =>
      f instanceof File
        ? uploadFile(f, { role, entityType, entityId })
        : Promise.resolve(null)
    )
  );

// ─────────────────────────────────────────────────────────────────────────────
// uploadComponentImages
//
// For each component, if image is a File → upload and return the url string.
// If image is already a string (existing URL) → pass through unchanged.
// Returns a string[] parallel to form.components[].
// ─────────────────────────────────────────────────────────────────────────────
const uploadComponentImages = async (components, entityType, entityId) => {
  return Promise.all(
    (components ?? []).map(async (comp) => {
      if (comp.image instanceof File) {
        const result = await uploadFile(comp.image, { role: "gallery", entityType, entityId });
        return result?.url ?? null;
      }
      return typeof comp.image === "string" ? comp.image : null;
    })
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// buildProductPayload
//
// componentImageUrls — string[] parallel to form.components[], already uploaded.
// ─────────────────────────────────────────────────────────────────────────────
const buildProductPayload = (form, featuredUrl, componentImageUrls = []) => ({
  // ── Core ─────────────────────────────────────────────────────────────
  listing_type:      form.listing_type?.toLowerCase() ?? "single",
  name:              form.name.trim(),
  category:          form.category?.trim()            || null,
  brand:             form.brand?.trim()               || null,
  sku:               form.sku?.trim()                 || null,

  // ── Pricing & stock ──────────────────────────────────────────────────
  price:             Number(form.price),
  sale_price:        form.sale_price ? Number(form.sale_price) : null,
  stock:             Number(form.stock)               ?? 0,
  // "" = no override → product uses the global delivery fee from Settings
  delivery_fee:      form.delivery_fee !== "" && form.delivery_fee != null
                       ? Number(form.delivery_fee)
                       : null,

  // ── Flags ────────────────────────────────────────────────────────────
  is_visible:        form.is_visible  ?? true,
  is_featured:       form.is_featured ?? false,

  // ── Content ──────────────────────────────────────────────────────────
  short_description: form.short_description?.trim()  || null,
  caption:           form.caption?.trim()            || null,
  description:       form.description?.trim()        || null,

  // ── Powered devices (package compatibility) ───────────────────────────
  powered_devices:   form.powered_devices             ?? null,

  // ── Taxonomy / warranty ──────────────────────────────────────────────
  tags:              form.tags ?? [],
  warranty_duration: form.warranty_enabled && Number(form.warranty) > 0
                       ? `${Number(form.warranty)} year${Number(form.warranty) !== 1 ? "s" : ""}`
                       : null,

  // ── Solar calculator matching ────────────────────────────────────────
  // Numbers are coerced here; the server validates shape per type and
  // rejects zero/missing values with a clear message.
  solar_component_type: form.solar_component_type || null,
  solar_specs: (() => {
    const t = form.solar_component_type;
    const s = form.solar_specs || {};
    if (!t)                        return null;
    if (t === "inverter")          return { kva:    Number(s.kva)    || 0 };
    if (t === "battery")           return { ah:     Number(s.ah)     || 0, chemistry: s.chemistry || "lithium" };
    if (t === "solar-panel")       return { watts:  Number(s.watts)  || 0 };
    if (t === "charge-controller") return { ampere: Number(s.ampere) || 0 };
    return null;
  })(),

  // ── Specs → [{ label, value }] ───────────────────────────────────────
  // Form stores { title, info } — map to DB shape here
  specifications:    (form.specs ?? [])
                       .filter(s => s.title || s.info)
                       .map(s => ({ label: s.title || "", value: s.info || "" })),

  // ── Components (package only) ─────────────────────────────────────────
  // DB columns on ProductComponent: name, qty, image (TEXT url), description, specs, sort_order
  // brand and price are form-only display fields — NOT sent to the DB
  components: form.listing_type?.toLowerCase() === "package"
    ? (form.components ?? [])
        .filter(c => c.name?.trim())
        .map((c, i) => ({
          name:        c.name.trim(),
          qty:         Number(c.quantity) || 1,          // form field is "quantity"
          image:       componentImageUrls[i] ?? null,    // resolved URL, never a File
          description: c.description?.trim()    || null,
          // Specs: form stores { title, info } — map to { label, value }
          specs: Array.isArray(c.specs) && c.specs.length > 0
            ? c.specs
                .filter(s => s.title || s.info)
                .map(s => ({ label: s.title || "", value: s.info || "" }))
            : null,
          sort_order: i,
        }))
    : [],

  // ── Image ─────────────────────────────────────────────────────────────
  featured_image_url: featuredUrl ?? null,
});

// =============================================================================
// useProductSubmit
// =============================================================================
export const useProductSubmit = ({ form, product, onSave, onClose }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  const isEdit = !!product;

  const validate = () => {
    if (!form.name?.trim())              return "Product name is required.";
    if (!form.category?.trim())          return "Category is required.";
    if (!form.price || +form.price <= 0) return "A valid price is required.";
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setError("");
    setSubmitting(true);

    try {
      const existingId = isEdit ? product.id : null;
      const entityType = existingId != null ? "product" : "general";

      // ═══════════════════════════════════════════════════════════════════
      // STEP 1 — Upload main image
      // ═══════════════════════════════════════════════════════════════════
      let featuredMedia = null;

      if (form.main_image?.type === "staged") {
        featuredMedia = await uploadFile(
          form.main_image.file, { role: "main", entityType, entityId: existingId },
        );
        console.log("✅ Main image uploaded:", featuredMedia?.url);
      } else if (form.main_image?.type === "existing") {
        featuredMedia = { url: form.main_image.url, id: null };
      } else if (isEdit && product.featured_image_url) {
        featuredMedia = { url: product.featured_image_url, id: null };
      }

      // ═══════════════════════════════════════════════════════════════════
      // STEP 2 — Upload staged gallery images
      // ═══════════════════════════════════════════════════════════════════
      const stagedGallery = form.other_images
        .filter(img => img?.type === "staged")
        .map(img => img.file);

      const galleryMedia = await uploadMany(
        stagedGallery, "gallery", entityType, existingId,
      );

      // ═══════════════════════════════════════════════════════════════════
      // STEP 3 — Upload staged marketing images (paired with specs[])
      // ═══════════════════════════════════════════════════════════════════
      const stagedMarketing = (form.marketing_images ?? []).map(img =>
        img?.type === "staged" ? img.file : null
      );

      const marketingMedia = await uploadMany(
        stagedMarketing, "gallery", entityType, existingId,
      );

      // ═══════════════════════════════════════════════════════════════════
      // STEP 4 — Upload component images
      //
      // Each component.image is either a File (staged) or a string URL
      // (existing/already uploaded). uploadComponentImages resolves both
      // and returns a string[] of URLs safe to put in the JSON payload.
      // ═══════════════════════════════════════════════════════════════════
      const isPackage = form.listing_type?.toLowerCase() === "package";
      let componentImageUrls = [];

      if (isPackage && form.components?.length) {
        console.log("📦 Uploading component images...");
        componentImageUrls = await uploadComponentImages(
          form.components, entityType, existingId,
        );
        console.log("✅ Component image URLs:", componentImageUrls);
      }

      // ═══════════════════════════════════════════════════════════════════
      // STEP 5 — Create or update the product row
      // ═══════════════════════════════════════════════════════════════════
      const featuredUrl = featuredMedia?.url ?? null;
      const payload     = buildProductPayload(form, featuredUrl, componentImageUrls);

      console.log("📤 Sending product payload:", JSON.stringify(payload, null, 2));
      console.log("📤 Warranty payload ->", {
        warranty_enabled: form.warranty_enabled,
        warranty: form.warranty,
        warranty_duration: payload.warranty_duration,
      });

      const { data: savedProduct } = await (
        isEdit
          ? api.patch(`/admin/products/${product.id}`, payload)
          : api.post("/admin/products", payload)
      );

      const productId = savedProduct.id;
      console.log(`✅ Product ${isEdit ? "updated" : "created"} — id:`, productId);

      // ═══════════════════════════════════════════════════════════════════
      // STEP 6 — Attach media to product (CREATE mode only)
      // ═══════════════════════════════════════════════════════════════════
      if (!isEdit) {
        const allNewGallery = [
          ...galleryMedia.filter(Boolean),
          ...marketingMedia.filter(Boolean),
        ];

        const hasFeatured = !!featuredMedia?.id;
        const hasGallery  = allNewGallery.length > 0;

        if (hasFeatured || hasGallery) {
          try {
            const { data: attachResult } = await api.post(
              `/admin/products/${productId}/media/attach`,
              {
                featured: hasFeatured
                  ? { id: featuredMedia.id, url: featuredMedia.url }
                  : null,
                gallery: allNewGallery.map(m => ({ id: m.id, url: m.url })),
              }
            );
            console.log("✅ Media attached:", attachResult);
          } catch (attachErr) {
            console.warn(
              "⚠️ Media attach failed (product saved OK):",
              attachErr?.response?.data ?? attachErr.message,
            );
          }
        }
      } else {
        console.log("ℹ️ Edit mode — media linked during upload, skipping attach");
      }

      await onSave?.(savedProduct, isEdit);
      onClose?.();

    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error   ||
        err?.message                 ||
        "Something went wrong. Please try again.";
      console.error("❌ Product save error:", err);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return { submitting, error, setError, handleSubmit };
};