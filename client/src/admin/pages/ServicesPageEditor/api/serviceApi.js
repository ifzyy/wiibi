/**
 * servicesApi.js
 *
 * All network calls for the services page editor.
 *
 * Backend contract:
 *  READ   GET  /api/public/pages/services
 *           → { page, sections[{ id, type, order, content, media[] }] }
 *
 *  SAVE   PUT  /admin/sections/:id
 *           body → { content: {}, is_visible: bool }
 *
 * Re-uses the shared API axios instance — auth headers configured once.
 */
import { API } from "../../HomePageEditor/api/homepageApi";

export const fetchServicesPage = () =>
  API.get("/public/pages/services").then((r) => r.data);

/**
 * Persist text/visibility for one section.
 * Controller only reads `content` + `is_visible`.
 */
export const saveSection = (sectionId, content, is_visible = true) =>
  API.put(`/admin/sections/${sectionId}`, { content, is_visible });