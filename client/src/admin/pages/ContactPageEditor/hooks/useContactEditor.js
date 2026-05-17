/**
 * useContactEditor.js
 *
 * All editor state and mutations for the contact page.
 * Follows the exact same pattern as useHomeEditor — new pages just
 * get a new hook; the shared primitives never change.
 *
 * Returns:
 *  data, faqs, loading, error      — fetch state
 *  hasChanges, saving              — save state
 *  toast, clearToast               — notifications
 *  updateContent                   — update nested path in section.content
 *  updateFaq                       — update faq[id][field]
 *  handleSave                      — PUT all dirty sections + dirty FAQs
 *  getSection                      — find section by type (safe empty fallback)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchContactPage,
  fetchFaqs,
  saveSection,
  saveFaq,
} from "../api/contactApi";

export function useContactEditor() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [data, setData]             = useState(null);
  const [faqs, setFaqs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState(null);

  /**
   * Track which section IDs and FAQ IDs need to be saved.
   * Only dirty records are sent to the server on publish.
   */
  const dirtySectionIds = useRef(new Set());
  const dirtyFaqIds     = useRef(new Set());

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [pagePayload, faqList] = await Promise.all([
          fetchContactPage(),
          fetchFaqs(),
        ]);
        setData(pagePayload);
        setFaqs(faqList);
        if (pagePayload.page?.meta_title) document.title = pagePayload.page.meta_title;
      } catch (err) {
        console.error("Contact page fetch error:", err);
        setError(err.response?.data?.message || "Failed to load contact page.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Content mutations ──────────────────────────────────────────────────────

  /**
   * Update a deeply nested field in section.content using a dot-path.
   *
   * Example: updateContent("main", "header.sub_heading", "New value")
   * walks section.content.header.sub_heading and sets it.
   *
   * @param {string} sectionType
   * @param {string} dotPath       dot-separated key path
   * @param {*}      value
   */
  const updateContent = useCallback((sectionType, dotPath, value) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) => {
        if (sec.type !== sectionType) return sec;

        dirtySectionIds.current.add(sec.id);

        // Deep-clone and set the nested key
        const newContent = structuredClone(sec.content);
        const keys = dotPath.split(".");
        let cursor = newContent;
        for (let i = 0; i < keys.length - 1; i++) {
          cursor[keys[i]] = cursor[keys[i]] ?? {};
          cursor = cursor[keys[i]];
        }
        cursor[keys[keys.length - 1]] = value;

        return { ...sec, content: newContent };
      }),
    }));
    setHasChanges(true);
  }, []);

  /**
   * Update a single FAQ field.
   * FAQs are tracked separately and saved with their own endpoint.
   *
   * @param {number|string} faqId
   * @param {"question"|"answer"} field
   * @param {string} value
   */
  const updateFaq = useCallback((faqId, field, value) => {
    setFaqs((prev) =>
      prev.map((faq) =>
        faq.id === faqId ? { ...faq, [field]: value } : faq
      )
    );
    dirtyFaqIds.current.add(faqId);
    setHasChanges(true);
  }, []);

  // ── Save ───────────────────────────────────────────────────────────────────

  /**
   * PUT only dirty sections and dirty FAQs in one parallel batch.
   * Clears dirty sets on success.
   */
  const handleSave = async () => {
    if (!hasChanges || saving) return;
    setSaving(true);
    try {
      const sectionSaves = data.sections
        .filter((s) => dirtySectionIds.current.has(s.id))
        .map((sec) => saveSection(sec.id, sec.content, sec.is_visible ?? true));

      const faqSaves = faqs
        .filter((f) => dirtyFaqIds.current.has(f.id))
        .map((faq) => saveFaq(faq.id, faq.question, faq.answer));

      await Promise.all([...sectionSaves, ...faqSaves]);

      dirtySectionIds.current.clear();
      dirtyFaqIds.current.clear();
      setHasChanges(false);
      notify("Changes published ✓");
    } catch (err) {
      notify(err.response?.data?.message || "Save failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Utilities ──────────────────────────────────────────────────────────────

  /** Find a section by type. Returns a safe empty shell if not found. */
  const getSection = (type) =>
    data?.sections.find((s) => s.type === type) || {
      content: {},
      media: [],
      id: null,
    };

  // ── Toast ──────────────────────────────────────────────────────────────────

  const notify    = (message, type = "success") => setToast({ message, type });
  const clearToast = () => setToast(null);

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    data,
    faqs,
    loading,
    error,
    hasChanges,
    saving,
    toast,
    clearToast,
    updateContent,
    updateFaq,
    handleSave,
    getSection,
  };
}