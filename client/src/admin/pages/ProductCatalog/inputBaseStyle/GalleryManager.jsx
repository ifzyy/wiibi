import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { COLORS, RADIUS } from "../constants";
import { uploadImageRequest } from "../hooks/useImageUpload";
import { Icon, Spinner } from "./Primitives";

// ─────────────────────────────────────────────────────────────────────────────
// GalleryThumb — single image tile with order badge + remove button
// ─────────────────────────────────────────────────────────────────────────────
const GalleryThumb = React.memo(({ img, index, onRemove, isPending }) => (
  <div style={{ position: "relative" }}>
    <img
      src={img.url}
      alt={`Gallery image ${index + 1}`}
      style={{
        width: 72, height: 72,
        objectFit: "cover",
        borderRadius: RADIUS.md,
        border: `2px solid ${isPending ? COLORS.amber : COLORS.border}`,
        display: "block",
        opacity: isPending ? 0.85 : 1,
        transition: "border-color 0.2s, opacity 0.2s",
      }}
      onError={(e) => (e.target.style.display = "none")}
    />

    {/* Order badge */}
    <div
      aria-hidden="true"
      style={{
        position: "absolute", top: -5, left: -5,
        width: 18, height: 18,
        background: isPending ? COLORS.amber : COLORS.purple,
        borderRadius: "50%",
        border: "1.5px solid #fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.2s",
      }}
    >
      <span style={{ color: isPending ? COLORS.ink : COLORS.white, fontSize: 9, fontWeight: 800 }}>
        {index + 1}
      </span>
    </div>

    {/* Pending badge — shown when not yet linked to a product */}
    {isPending && (
      <div
        aria-label="Staged — will be saved with the product"
        style={{
          position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)",
          background: COLORS.amber,
          borderRadius: 3,
          padding: "1px 5px",
          border: "1.5px solid #fff",
          whiteSpace: "nowrap",
        }}
      >
        <p style={{ color: COLORS.ink, fontSize: 7, fontWeight: 800, margin: 0 }}>STAGED</p>
      </div>
    )}

    {/* Remove button */}
    <button
      type="button"
      onClick={() => onRemove(img.id)}
      aria-label={`Remove gallery image ${index + 1}`}
      style={{
        position: "absolute", top: -5, right: -5,
        width: 18, height: 18,
        background: COLORS.danger,
        borderRadius: "50%",
        border: "1.5px solid #fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <Icon name="x" size={9} style={{ color: COLORS.white }} />
    </button>
  </div>
));
GalleryThumb.displayName = "GalleryThumb";

// ─────────────────────────────────────────────────────────────────────────────
// GalleryManager
//
// Works in TWO modes, transparently to the user:
//
// A) EDIT mode  (entityId is a valid product UUID)
//    Upload → backend creates Media + ProductMedia immediately.
//    onAdd(media) is called so the parent can reflect the new image.
//    onRemove(mediaId) is called so the parent can update its state.
//
// B) CREATE mode  (entityId is null)
//    Upload → backend creates Media with entity_id = null ("general").
//    onAdd(media) is called so useProductMedia can stage the item.
//    onRemove(mediaId) is called so useProductMedia can un-stage it.
//    Images display with an amber "STAGED" badge until the product is saved.
//
// Props:
//   token      — Bearer token
//   entityId   — product UUID | null (null = new product, stage mode)
//   items      — [{ id, url }]  the current displayed list (controlled)
//                In edit mode: existing ProductMedia gallery rows.
//                In create mode: items staged via useProductMedia.
//   onAdd(media)      — called when a new image is successfully uploaded
//   onRemove(mediaId) — called when an image is removed
// ─────────────────────────────────────────────────────────────────────────────
export const GalleryManager = ({ token, entityId, items = [], onAdd, onRemove }) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const isCreateMode = !entityId;

  const handleAdd = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      // In create mode: entityId = null → backend stores as "general" / unattached
      // In edit mode:   entityId present → backend creates ProductMedia immediately
      const media = await uploadImageRequest(file, token, {
        role:     "gallery",
        entityId: entityId || null,
      });

      if (!media) throw new Error("No media record returned");

      onAdd(media);
      toast.success("Gallery image added ✓");
    } catch (err) {
      toast.error(err.response?.data?.error || "Gallery upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Image grid */}
      {items.length > 0 && (
        <div
          role="list"
          aria-label="Gallery images"
          style={{ display: "flex", flexWrap: "wrap", gap: 10 }}
        >
          {items.map((img, idx) => (
            <div key={img.id || idx} role="listitem">
              <GalleryThumb
                img={img}
                index={idx}
                isPending={isCreateMode}
                onRemove={onRemove}
              />
            </div>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => e.target.files?.[0] && handleAdd(e.target.files[0])}
      />

      {/* Add button */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        style={{
          padding: "9px 14px",
          border: `1.5px dashed ${COLORS.borderMid}`,
          borderRadius: RADIUS.md,
          background: COLORS.white,
          color: COLORS.textSec,
          fontSize: 12,
          fontWeight: 600,
          cursor: uploading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          transition: "border-color 0.2s",
        }}
      >
        {uploading
          ? <><Spinner size={14} color={COLORS.purple} /> Uploading…</>
          : <><Icon name="plus" size={13} style={{ color: COLORS.purple }} /> Add gallery image</>
        }
      </button>

      {/* Contextual count + hint */}
      {items.length > 0 && (
        <p style={{ color: COLORS.textMuted, fontSize: 11, margin: 0 }}>
          {items.length} gallery image{items.length !== 1 ? "s" : ""}
          {isCreateMode && (
            <span style={{ color: COLORS.amber, fontWeight: 700 }}>
              {" "}· will be linked when you save
            </span>
          )}
        </p>
      )}
    </div>
  );
};