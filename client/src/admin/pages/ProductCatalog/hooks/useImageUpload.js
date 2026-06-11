import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { uploadFileOrUrl } from "../../../../utils/uploadApi";

// ─────────────────────────────────────────────────────────────────────────────
// useImageUpload
//
// Manages upload lifecycle for a SINGLE image slot (featured image or gallery).
//
// Props:
//   currentImageUrl  — pre-existing URL (edit mode)
//   role             — "main" | "gallery"
//   entityId         — product ID when editing; null when creating
//   onUploadComplete(media) — called with { id, url, role, ... } on success
//   onClear()               — called when image is removed
// ─────────────────────────────────────────────────────────────────────────────
export const useImageUpload = ({
  currentImageUrl = "",
  role = "main",
  entityId = null,
  onUploadComplete,
  onClear,
}) => {
  const [previewSrc, setPreviewSrc] = useState(currentImageUrl);
  const [uploading,  setUploading]  = useState(false);

  useEffect(() => { setPreviewSrc(currentImageUrl || ""); }, [currentImageUrl]);

  const upload = async (fileOrUrl) => {
    setUploading(true);

    // Instant blob preview for files so the UI feels snappy before the network resolves
    if (fileOrUrl instanceof File) {
      setPreviewSrc(URL.createObjectURL(fileOrUrl));
    }

    try {
      const entityType = entityId != null ? "product" : "general";
      const media = await uploadFileOrUrl(fileOrUrl, { role, entityType, entityId });

      setPreviewSrc(media.url);
      onUploadComplete(media);
      toast.success(role === "main" ? "Featured image ready ✓" : "Gallery image added ✓");
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Upload failed");
      setPreviewSrc(currentImageUrl || "");
    } finally {
      setUploading(false);
    }
  };

  const clear = () => {
    setPreviewSrc("");
    onClear();
  };

  return { previewSrc, uploading, upload, clear };
};
