/**
 * contactApi.js
 *
 * All network calls for the contact page editor.
 *
 * Backend contract (mirrors homepage pattern):
 *  READ   GET  /api/public/pages/contact
 *           → { page, sections[{ id, type, content, media[] }] }
 *
 *  SAVE   PUT  /admin/sections/:id
 *           body → { content: {}, is_visible: bool }
 *
 *  FAQS   GET  /api/public/faqs          → FAQ[]
 *         PUT  /admin/faqs/:id           body → { question, answer }
 *
 * Re-uses the shared API instance and ROLE constants from homepageApi —
 * no need to re-declare axios config or role strings.
 */

import { API } from "../../HomePageEditor/api/homepageApi";

// ─── Page ─────────────────────────────────────────────────────────────────────

export const fetchContactPage = () =>
  API.get("/public/pages/contact").then((r) => r.data);

/**
 * Persist text/visibility for one section.
 * Controller only reads `content` + `is_visible`.
 */
export const saveSection = (sectionId, content, is_visible = true) =>
  API.put(`/admin/sections/${sectionId}`, { content, is_visible });

// ─── FAQs ─────────────────────────────────────────────────────────────────────

export const fetchFaqs = () =>
  API.get("/public/faqs").then((r) => r.data);

export const saveFaq = (faqId, question, answer) =>
  API.put(`/admin/faqs/${faqId}`, { question, answer });