/**
 * uploadApi.js — shared upload utility
 *
 * Single source of truth for all POST /admin/upload calls across the app.
 * Replaces duplicated FormData logic in:
 *   - useImageUpload.js (ProductCatalog)
 *   - useProductSubmit.js
 *   - homepageApi.js (HomePageEditor)
 *
 * Returned record shape:
 *   { id, url, filename, alt_text, entity_type, entity_id, is_external, role }
 */

import api from "./api";

// ─────────────────────────────────────────────────────────────────────────────
// uploadFile
//
// Uploads a single File object to the server and returns the Media record.
//
// Options:
//   entityType  — "general" | "product" | "homepage" | etc. (default: "general")
//   role        — "main" | "gallery" (default: "gallery")
//   entityId    — integer or UUID string when linking during upload (default: null)
//   altText     — accessibility text stored on the Media row
// ─────────────────────────────────────────────────────────────────────────────
export const uploadFile = async (
  file,
  { entityType = "general", role = "gallery", entityId = null, altText = "" } = {}
) => {
  const form = new FormData();
  form.append("images",     file);
  form.append("entityType", entityType);
  form.append("role",       role);
  if (entityId != null)    form.append("entity_id", String(entityId));
  form.append("altText",    altText || file.name);

  const { data } = await api.post("/admin/upload", form, {
    // Let the browser set Content-Type + multipart boundary automatically.
    // The api instance has a default 'application/json' header; we clear it here.
    headers:          { "Content-Type": undefined },
    transformRequest: [(d) => d],
  });

  const record = data.files?.[0];
  if (!record?.id) throw new Error("Upload succeeded but no media record was returned");
  return record;
};

// ─────────────────────────────────────────────────────────────────────────────
// uploadExternalUrl
//
// Registers an external image URL as a Media record (no file I/O on the server).
// ─────────────────────────────────────────────────────────────────────────────
export const uploadExternalUrl = async (
  url,
  { entityType = "general", role = "gallery", altText = "External image" } = {}
) => {
  const { data } = await api.post("/admin/upload", {
    externalUrl: url,
    entityType,
    role,
    altText,
  });

  const record = data.files?.[0];
  if (!record?.id) throw new Error("No media record returned for external URL");
  return record;
};

// ─────────────────────────────────────────────────────────────────────────────
// uploadFileOrUrl
//
// Convenience wrapper — accepts either a File or a URL string.
// Used by hooks that support both input modes in a single code path.
// ─────────────────────────────────────────────────────────────────────────────
export const uploadFileOrUrl = (fileOrUrl, options = {}) =>
  typeof fileOrUrl === "string"
    ? uploadExternalUrl(fileOrUrl, options)
    : uploadFile(fileOrUrl, options);
