/**
 * aboutApi.js
 *
 * All network calls for the about page editor.
 *
 * Backend contract:
 *  READ   GET  /api/public/pages/about
 *           → { page, sections[{ id, type, content, media[] }] }
 *
 *  SAVE   PUT  /admin/sections/:id
 *           body → { content: {}, is_visible: bool }
 *
 *  UPLOAD POST /admin/upload             (re-used from homepageApi)
 *  MEDIA  PATCH /admin/sections/:id/media
 *
 * Re-uses the shared API axios instance — auth headers configured once.
 */


import { API } from "../../HomePageEditor/api/homepageApi";
export const fetchAboutPage = () =>
  API.get("/public/pages/about").then((r) => r.data);

/**
 * Persist text/visibility for one section.
 * Controller only reads `content` + `is_visible`.
 */
export const saveSection = (sectionId, content, is_visible = true) =>
  API.put(`/admin/sections/${sectionId}`, { content, is_visible });