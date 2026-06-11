/**
 * homepageApi.js
 *
 * Every network call for the homepage editor lives here.
 * Components never import api directly — they call these functions.
 *
 * Backend contract:
 *  GET    /api/public/pages/home
 *  PUT    /admin/sections/:id          body: { content, is_visible }
 *  POST   /admin/upload                FormData OR { externalUrl, altText, entityType }
 *  PATCH  /admin/sections/:id/media    body: { media: [{mediaId, role, displayOrder}], reset }
 *  DELETE /admin/sections/:id
 */

import api from "../../../utils/api";
import { uploadFile, uploadExternalUrl } from "../../../../utils/uploadApi";

export const API = api;

// ─── Media role constants ─────────────────────────────────────────────────────
export const ROLE = /** @type {const} */ ({
  HERO:        "hero",
  BACKGROUND:  "background",
  CTA:         "cta",
  GALLERY:     "gallery",
  FEATURED:    "featured",
  THUMBNAIL:   "thumbnail",
  STATS_ICON:  "stats-icon",
  MOBILE_HERO: "mobile-hero",
});

// ─── API functions ────────────────────────────────────────────────────────────

export const fetchHomePage = () =>
  API.get("/public/pages/home").then((r) => r.data);

export const saveSection = (sectionId, content, is_visible = true) =>
  API.put(`/admin/sections/${sectionId}`, { content, is_visible });

/**
 * Upload a local File to the server.
 * @returns {Promise<{ id: string, url: string, alt_text: string }>}
 */
export const uploadImageFile = (file, entityType = "homepage") =>
  uploadFile(file, { entityType, role: "gallery" });

/**
 * Register an external image URL as a Media record.
 * @returns {Promise<{ id: string, url: string, alt_text: string }>}
 */
export const saveExternalImageUrl = (url, altText = "External image") =>
  uploadExternalUrl(url, { entityType: "homepage", altText });

/**
 * Attach a media record to a section with the given role.
 * reset: true removes any existing media for that role first.
 */
export const attachMediaToSection = (sectionId, mediaId, role, displayOrder = 0) =>
  API.patch(`/admin/sections/${sectionId}/media`, {
    media: [{ mediaId, role, displayOrder }],
    reset: true,
  });

export const removeSectionFromServer = (sectionId) =>
  API.delete(`/admin/sections/${sectionId}`);
