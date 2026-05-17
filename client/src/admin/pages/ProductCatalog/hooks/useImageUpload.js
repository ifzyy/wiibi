import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { API_BASE } from "../constants";
import api from "../../../../utils/api";

// ─────────────────────────────────────────────────────────────────────────────
// uploadImageRequest
//
// Low-level HTTP helper. Used by both useImageUpload and GalleryManager.
//
// When entityId is null (new product flow):
//   → entityType defaults to "general" — image stored as unattached
//   → caller must run attachToProduct after the product is created
//
// When entityId is a valid UUID (edit flow):
//   → entityType = "product", immediate ProductMedia linking happens server-side
// ─────────────────────────────────────────────────────────────────────────────
export const uploadImageRequest = async (
  fileOrUrl,
  token,
  { role = "main", entityId = null } = {}
) => {
  console.log("Uploading image with params:", { fileOrUrl, role, entityId });
  try {
    const formData = new FormData();

    if (typeof fileOrUrl === "string") {
      formData.append("externalUrl", fileOrUrl);
    } else {
      formData.append("images", fileOrUrl);
    }

    formData.append("role", role);

    if (entityId) {
      formData.append("entityType", "product");
      formData.append("entity_id", entityId);
    } else {
      formData.append("entityType", "general");
    }

    formData.append(
      "altText",
      typeof fileOrUrl === "string" ? "Product image" : fileOrUrl.name
    );

  const res = await api.post(`/admin/upload`, formData, {
  headers: {
    "Content-Type": "multipart/form-data"
  }
});

    console.log("UPLOAD SUCCESS:", res.data);

    return res.data.files || null;
  } catch (error) {
    console.error("UPLOAD FAILED:",error);

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error message:", error.message);
    }

    throw error; // ✅ CRITICAL FIX
  }
};
// ─────────────────────────────────────────────────────────────────────────────
// useImageUpload
//
// Manages upload lifecycle for a SINGLE image slot (featured image).
//
// Props:
//   token            — Bearer token
//   currentImageUrl  — pre-existing URL (edit mode)
//   role             — "main" | "gallery"
//   entityId         — product UUID when editing; null when creating
//   onUploadComplete(media) — called with { id, url, role, ... } on success
//   onClear()               — called when image is removed
// ─────────────────────────────────────────────────────────────────────────────
export const useImageUpload = ({
  token,
  currentImageUrl = "",
  role = "main",
  entityId = null,
  onUploadComplete,
  onClear,
}) => {
  const [previewSrc, setPreviewSrc] = useState(currentImageUrl);
  const [uploading,  setUploading]  = useState(false);

  // Keep preview in sync when currentImageUrl changes (e.g. drawer re-opens)
  useEffect(() => { setPreviewSrc(currentImageUrl || ""); }, [currentImageUrl]);

  const upload = async (fileOrUrl) => {
    setUploading(true);
    try {
      // Instant blob preview so the UI feels snappy before the network resolves
      if (fileOrUrl instanceof File) {
        setPreviewSrc(URL.createObjectURL(fileOrUrl));
      }

      const media = await uploadImageRequest(fileOrUrl, token, { role, entityId });
      if (!media) throw new Error("Server returned no media record");

      setPreviewSrc(media.url); // swap blob for real server URL
      onUploadComplete(media);
      toast.success(role === "main" ? "Featured image ready ✓" : "Gallery image added ✓");
    } catch (err) {
      console.log(err)
      toast.error(err.response?.data?.error || err.message || "Upload failed");
      setPreviewSrc(currentImageUrl || ""); // revert on failure
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