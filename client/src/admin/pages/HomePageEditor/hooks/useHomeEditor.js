/**
 * useHomeEditor.js
 *
 * Centralises all editor state and mutations for the homepage editor.
 * Components call these functions — they never touch the API directly.
 *
 * Returns:
 *  data, loading, error         — fetch state
 *  hasChanges, saving           — save state
 *  toast, clearToast            — notifications
 *  updateContent                — update a flat field in section.content
 *  updateStat                   — update stats[i][field]
 *  updateFaq                    — update faqs[i][field]
 *  updatePost                   — update posts[i][field]
 *  handleMediaSuccess           — sync new image URL after upload
 *  handleDeleteSection          — delete a section via API then remove locally
 *  handleSave                   — PUT all dirty sections
 *  getSection                   — find a section by type (safe empty shell fallback)
 *  getMediaUrl                  — resolve a media URL by role from a section
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchHomePage,
  saveSection,
  removeSectionFromServer,
} from "../api/homepageApi";

export function useHomeEditor() {
  // ── Core state ──────────────────────────────────────────────────────────────
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState(null); // { message, type }

  /**
   * Set of section IDs whose content has changed since the last save.
   * Only these sections are sent to the server on publish — avoids
   * unnecessary PUT requests for untouched sections.
   */
  const dirtyIds = useRef(new Set());

  // ── Fetch ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const payload = await fetchHomePage();
        setData(payload);
        if (payload.page?.meta_title) document.title = payload.page.meta_title;
      } catch (err) {
        console.error("Page fetch error:", err);
        setError(err.response?.data?.message || "Failed to load page content.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Mutation helpers ────────────────────────────────────────────────────────

  /**
   * Optimistically update a flat field in section.content by section type.
   * Marks the section dirty so it gets included in the next save.
   *
   * @param {string} sectionType  - e.g. "hero", "cta"
   * @param {string} field        - key inside section.content
   * @param {string} value        - new innerHTML / string value
   */
  const updateContent = useCallback((sectionType, field, value) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) => {
        if (sec.type !== sectionType) return sec;
        dirtyIds.current.add(sec.id);
        return { ...sec, content: { ...sec.content, [field]: value } };
      }),
    }));
    setHasChanges(true);
  }, []);

  /** Update one item inside stats.content.stats[] by array index. */
  const updateStat = useCallback((index, field, value) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) => {
        if (sec.type !== "stats") return sec;
        dirtyIds.current.add(sec.id);
        return {
          ...sec,
          content: {
            ...sec.content,
            stats: sec.content.stats.map((s, i) =>
              i === index ? { ...s, [field]: value } : s
            ),
          },
        };
      }),
    }));
    setHasChanges(true);
  }, []);

  /** Update one item inside faq-teaser.content.faqs[] by array index. */
  const updateFaq = useCallback((index, field, value) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) => {
        if (sec.type !== "faq-teaser") return sec;
        dirtyIds.current.add(sec.id);
        return {
          ...sec,
          content: {
            ...sec.content,
            faqs: sec.content.faqs.map((f, i) =>
              i === index ? { ...f, [field]: value } : f
            ),
          },
        };
      }),
    }));
    setHasChanges(true);
  }, []);

  /** Update one item inside blog-teaser.content.posts[] by array index. */
  const updatePost = useCallback((index, field, value) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) => {
        if (sec.type !== "blog-teaser") return sec;
        dirtyIds.current.add(sec.id);
        return {
          ...sec,
          content: {
            ...sec.content,
            posts: sec.content.posts.map((p, i) =>
              i === index ? { ...p, [field]: value } : p
            ),
          },
        };
      }),
    }));
    setHasChanges(true);
  }, []);

  /**
   * After ImageEditor uploads + attaches a media record on the server,
   * sync the new URL into local state immediately so the UI updates
   * without a full re-fetch. No dirty flag — server already persisted it.
   *
   * @param {string} sectionType
   * @param {string} role         - ROLE constant
   * @param {string} newUrl
   */
  const handleMediaSuccess = useCallback((sectionType, role, newUrl) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) => {
        if (sec.type !== sectionType) return sec;
        const existing = sec.media?.find((m) => m.role === role);
        const updatedMedia = existing
          ? sec.media.map((m) => (m.role === role ? { ...m, url: newUrl } : m))
          : [...(sec.media || []), { url: newUrl, role, display_order: 0 }];
        return { ...sec, media: updatedMedia };
      }),
    }));
    notify("Image saved ✓");
  }, []);

  // ── Delete section ──────────────────────────────────────────────────────────

  const handleDeleteSection = useCallback(
    async (sectionType) => {
      const sec = data?.sections.find((s) => s.type === sectionType);
      if (!sec?.id) return;
      try {
        await removeSectionFromServer(sec.id);
        setData((prev) => ({
          ...prev,
          sections: prev.sections.filter((s) => s.type !== sectionType),
        }));
        dirtyIds.current.delete(sec.id);
        notify(`"${sectionType}" removed`);
      } catch (err) {
        notify(err.response?.data?.message || "Failed to remove section.", "error");
      }
    },
    [data]
  );

  // ── Save ────────────────────────────────────────────────────────────────────

  /** PUT only the sections that have been edited since the last save. */
  const handleSave = async () => {
    if (!hasChanges || saving) return;
    setSaving(true);
    try {
      const dirty = data.sections.filter((s) => dirtyIds.current.has(s.id));
      await Promise.all(
        dirty.map((sec) => saveSection(sec.id, sec.content, sec.is_visible ?? true))
      );
      dirtyIds.current.clear();
      setHasChanges(false);
      notify("Changes published ✓");
    } catch (err) {
      notify(err.response?.data?.message || "Save failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /** Find a section by type. Returns a safe empty shell if not found. */
  const getSection = (type) =>
    data?.sections.find((s) => s.type === type) || {
      content: {},
      media: [],
      id: null,
    };

  /**
   * Resolve a media URL from a section's media array by role.
   * Falls back to first available URL, then null.
   */
  const getMediaUrl = (section, role) =>
    section.media?.find((m) => m.role === role)?.url ||
    section.media?.[0]?.url ||
    null;

  // ── Toast ───────────────────────────────────────────────────────────────────

  const notify    = (message, type = "success") => setToast({ message, type });
  const clearToast = () => setToast(null);

  // ── Return ──────────────────────────────────────────────────────────────────

  return {
    // State
    data,
    loading,
    error,
    hasChanges,
    saving,
    toast,
    clearToast,
    // Mutations
    updateContent,
    updateStat,
    updateFaq,
    updatePost,
    handleMediaSuccess,
    handleDeleteSection,
    handleSave,
    // Utilities
    getSection,
    getMediaUrl,
  };
}
