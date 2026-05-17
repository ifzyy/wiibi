import { useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { API_BASE } from "../constants";

// ─────────────────────────────────────────────────────────────────────────────
// Media staging model
//
// A "staged" media item is a Media record that has been uploaded and saved to
// the DB but NOT yet linked to any product (entity_id = null).
//
// Shape:
//   {
//     id:   "uuid",        // Media.id from the server
//     url:  "https://...", // served URL
//     role: "main" | "gallery",
//   }
//
// On new products:   items accumulate here until the product is created.
// On existing products: the attach call fires immediately after upload,
//                        but we still use the same hook for symmetry.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useProductMedia
 *
 * @param {string}      token      — Bearer token for API calls
 * @param {string|null} productId  — null when creating a new product
 *
 * Returns:
 *   pendingFeatured  { id, url } | null   — staged featured image (new products)
 *   pendingGallery   [{ id, url }]        — staged gallery images  (new products)
 *   stageFeatured(media)  — called by ImageUploadField when a "main" upload completes
 *   stageGallery(media)   — called by GalleryManager when a "gallery" upload completes
 *   removePendingGallery(mediaId) — removes an item from the staged gallery
 *   clearPending()        — resets staging (called when drawer closes/resets)
 *   attachToProduct(productId) → Promise<void>
 *       — POSTs all staged media to /api/admin/products/:id/media/attach
 *       — called by ProductDrawer immediately after createProduct resolves
 *   hasPendingMedia   boolean — true if there's anything staged
 */
export const useProductMedia = (token, productId = null) => {
  // Staging queue for the "create new product" flow
  const [pendingFeatured, setPendingFeatured] = useState(null);       // { id, url }
  const [pendingGallery,  setPendingGallery]  = useState([]);          // [{ id, url }]

  const authHeaders = { Authorization: `Bearer ${token}` };

  // ── Stage a featured image ───────────────────────────────────────────────
  // Replaces any previous staged featured image (only one allowed).
  const stageFeatured = useCallback((media) => {
    setPendingFeatured({ id: media.id, url: media.url });
  }, []);

  // ── Stage a gallery image ────────────────────────────────────────────────
  const stageGallery = useCallback((media) => {
    setPendingGallery((prev) => [...prev, { id: media.id, url: media.url }]);
  }, []);

  // ── Remove a gallery item from the staging queue ─────────────────────────
  // For new products: item hasn't been linked yet, so we just drop it locally.
  // The Media row on the server stays (orphan cleanup is a background job concern).
  const removePendingGallery = useCallback((mediaId) => {
    setPendingGallery((prev) => prev.filter((img) => img.id !== mediaId));
  }, []);

  // ── Clear all staging state ──────────────────────────────────────────────
  const clearPending = useCallback(() => {
    setPendingFeatured(null);
    setPendingGallery([]);
  }, []);

  // ── Attach staged media to a newly created product ───────────────────────
  //
  // Called by ProductDrawer in this sequence:
  //   const created = await createProduct(form)    ← step A
  //   await attachToProduct(created.id)            ← step B  (this function)
  //
  // If nothing is staged, resolves immediately with no network call.
  const attachToProduct = useCallback(async (targetProductId) => {
    if (!pendingFeatured && pendingGallery.length === 0) return;

    try {
      await axios.post(
        `${API_BASE}/admin/products/${targetProductId}/media/attach`,
        { featured: pendingFeatured, gallery: pendingGallery },
        { headers: { ...authHeaders, "Content-Type": "application/json" } }
      );
      clearPending();
    } catch (err) {
      // Non-fatal: the product was created. Images can be attached via edit drawer.
      toast.error(
        "Product created, but image attachment failed. Open the product to retry."
      );
      console.error("attachToProduct error:", err);
    }
  }, [pendingFeatured, pendingGallery, token, clearPending]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasPendingMedia = !!(pendingFeatured || pendingGallery.length > 0);

  return {
    pendingFeatured,
    pendingGallery,
    stageFeatured,
    stageGallery,
    removePendingGallery,
    clearPending,
    attachToProduct,
    hasPendingMedia,
  };
};