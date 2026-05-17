/**
 * homepageApi.js
 *
 * Every network call for the homepage editor lives here.
 * Components never import axios directly — they call these functions.
 *
 * Backend contract:
 *  GET    /api/public/pages/home
 *  PUT    /admin/sections/:id          body: { content, is_visible }
 *  POST   /admin/upload                FormData OR { externalUrl, altText, entityType }
 *  PATCH  /admin/sections/:id/media    body: { media: [{mediaId, role, displayOrder}], reset }
 *  DELETE /admin/sections/:id
 *
 * Allowed media roles (must match adminController.js allowedRoles):
 *   hero | background | gallery | cta | stats-icon | featured | thumbnail | mobile-hero
 */

import axios from "axios";
import api from "../../../utils/api";
// ─── Axios instance ───────────────────────────────────────────────────────────


export const API = api;


// ─── Media role constants ─────────────────────────────────────────────────────

/**
 * Typed constants for every allowed media role.
 * Keeps string literals out of component code so a rename is one-line.
 */
export const ROLE = /** @type {const} */ ({
  HERO:       "hero",
  BACKGROUND: "background",
  CTA:        "cta",
  GALLERY:    "gallery",
  FEATURED:   "featured",
  THUMBNAIL:  "thumbnail",
  STATS_ICON: "stats-icon",
  MOBILE_HERO:"mobile-hero",
});

// ─── API functions ────────────────────────────────────────────────────────────

/** Fetch the full homepage payload from the public API. */
export const fetchHomePage = () =>
  API.get("/public/pages/home").then((r) => r.data);

/**
 * Persist text/visibility changes for a single section.
 * Controller only reads `content` + `is_visible` — nothing else.
 */
export const saveSection = (sectionId, content, is_visible = true) =>
  API.put(`/admin/sections/${sectionId}`, { content, is_visible });

/**
 * Upload a local File to the server.
 * @returns {Promise<{ id: string, url: string, alt_text: string }>}
 */
export const uploadImageFile = async (file, entityType = "homepage") => {
  const form = new FormData();
  form.append("images", file);
  form.append("entityType", entityType);
  const res = await API.post("/admin/upload", form);
  const record = res.data.files?.[0];
  if (!record?.id) throw new Error("Upload succeeded but no media ID was returned.");
  return record;
};

/**
 * Register an external image URL as a Media record.
 * Uses the same upload endpoint with `externalUrl` body param.
 * @returns {Promise<{ id: string, url: string, alt_text: string }>}
 */
export const saveExternalImageUrl = async (url, altText = "External image") => {
  const res = await API.post("/admin/upload", {
    externalUrl: url,
    altText,
    entityType: "homepage",
  });
  const record = res.data.files?.[0];
  if (!record?.id) throw new Error("No media ID returned for external URL.");
  return record;
};

/**
 * Attach a media record to a section with the given role.
 * `reset: true` removes any existing media for that role first.
 */
export const attachMediaToSection = (sectionId, mediaId, role, displayOrder = 0) =>
  API.patch(`/admin/sections/${sectionId}/media`, {
    media: [{ mediaId, role, displayOrder }],
    reset: true,
  });

/** Permanently remove a section from the database. */
export const removeSectionFromServer = (sectionId) =>
  API.delete(`/admin/sections/${sectionId}`);
