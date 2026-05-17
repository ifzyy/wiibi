/**
 * useAboutEditor.js
 *
 * All editor state and mutations for the about page.
 *
 * The about page has one section ("about_hero") with this content shape:
 *
 *  content: {
 *    brand_info: {
 *      sub_heading, main_heading, brand_name, location
 *    },
 *    hero_section: {
 *      display_title, main_image_url
 *    },
 *    pillars: [
 *      { main_heading, sub_headings[], support_text, main_image_url },
 *      { main_heading, support_text, main_image_url, bg_color, icon }
 *    ],
 *    staff_header: {
 *      main_heading, sub_headings[], support_text
 *    },
 *    staff_grid: [
 *      { name, role, image_url }
 *    ]
 *  }
 *
 * Returns:
 *  data, loading, error            — fetch state
 *  hasChanges, saving              — save state
 *  toast, clearToast               — notifications
 *  updateContent                   — update nested dot-path in section.content
 *  updatePillar                    — update pillars[index][field]
 *  updateStaffMember               — update staff_grid[index][field]
 *  handleMediaSuccess              — sync new image URL after upload
 *  handleSave                      — PUT dirty sections
 *  getSection                      — find section by type
 *  getMediaUrl                     — resolve media URL by role
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAboutPage, saveSection } from "../api/aboutApi";

export function useAboutEditor() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState(null);

  /** Section IDs whose content has changed since last save. */
  const dirtyIds = useRef(new Set());

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const payload = await fetchAboutPage();
        setData(payload);
        if (payload.page?.meta_title) document.title = payload.page.meta_title;
      } catch (err) {
        console.error("About page fetch error:", err);
        setError(err.response?.data?.message || "Failed to load about page.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Shared section updater ─────────────────────────────────────────────────

  /**
   * Base helper that replaces a section's entire content block.
   * All other mutations call this after preparing the new content.
   */
  const applyContentUpdate = (sectionType, newContent) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) => {
        if (sec.type !== sectionType) return sec;
        dirtyIds.current.add(sec.id);
        return { ...sec, content: newContent };
      }),
    }));
    setHasChanges(true);
  };

  // ── Mutations ──────────────────────────────────────────────────────────────

  /**
   * Update any flat or nested field via dot-path.
   *
   * Examples:
   *   updateContent("about_hero", "brand_info.sub_heading", "New value")
   *   updateContent("about_hero", "hero_section.display_title", "New title")
   */
  const updateContent = useCallback((sectionType, dotPath, value) => {
    setData((prev) => {
      const sec = prev.sections.find((s) => s.type === sectionType);
      if (!sec) return prev;

      const newContent = structuredClone(sec.content);
      const keys = dotPath.split(".");
      let cursor = newContent;
      for (let i = 0; i < keys.length - 1; i++) {
        cursor[keys[i]] = cursor[keys[i]] ?? {};
        cursor = cursor[keys[i]];
      }
      cursor[keys[keys.length - 1]] = value;

      dirtyIds.current.add(sec.id);
      return {
        ...prev,
        sections: prev.sections.map((s) =>
          s.type === sectionType ? { ...s, content: newContent } : s
        ),
      };
    });
    setHasChanges(true);
  }, []);

  /**
   * Update a single field on a pillar by index.
   *
   * @param {number}  index  0 = Hands On, 1 = We Care
   * @param {string}  field  e.g. "main_heading", "support_text", "main_image_url"
   * @param {*}       value
   */
  const updatePillar = useCallback((index, field, value) => {
    setData((prev) => {
      const sec = prev.sections.find((s) => s.type === "about_hero");
      if (!sec) return prev;

      const newContent = structuredClone(sec.content);
      newContent.pillars[index] = { ...newContent.pillars[index], [field]: value };

      dirtyIds.current.add(sec.id);
      return {
        ...prev,
        sections: prev.sections.map((s) =>
          s.type === "about_hero" ? { ...s, content: newContent } : s
        ),
      };
    });
    setHasChanges(true);
  }, []);

  /**
   * Update a single field on a staff member by index.
   *
   * @param {number} index
   * @param {string} field  "name" | "role" | "image_url"
   * @param {*}      value
   */
  const updateStaffMember = useCallback((index, field, value) => {
    setData((prev) => {
      const sec = prev.sections.find((s) => s.type === "about_hero");
      if (!sec) return prev;

      const newContent = structuredClone(sec.content);
      newContent.staff_grid[index] = {
        ...newContent.staff_grid[index],
        [field]: value,
      };

      dirtyIds.current.add(sec.id);
      return {
        ...prev,
        sections: prev.sections.map((s) =>
          s.type === "about_hero" ? { ...s, content: newContent } : s
        ),
      };
    });
    setHasChanges(true);
  }, []);

  /**
   * After ImageEditor uploads + attaches a media record, sync the new URL
   * into local state. No dirty flag needed — server already persisted it.
   *
   * For about page, images live inside content fields (e.g. main_image_url)
   * rather than a separate media array, so we use updateContent / updatePillar.
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

  // ── Save ───────────────────────────────────────────────────────────────────

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
  const addStaffMember = useCallback(() => {
  setData((prev) => {
    const sec = prev.sections.find((s) => s.type === "about_hero");
    if (!sec) return prev;
    const newContent = structuredClone(sec.content);
    newContent.staff_grid = [
      ...newContent.staff_grid,
      { name: "New Member", role: "Title", image_url: null },
    ];
    dirtyIds.current.add(sec.id);
    return {
      ...prev,
      sections: prev.sections.map((s) =>
        s.type === "about_hero" ? { ...s, content: newContent } : s
      ),
    };
  });
  setHasChanges(true);
}, []);

const removeStaffMember = useCallback((index) => {
  setData((prev) => {
    const sec = prev.sections.find((s) => s.type === "about_hero");
    if (!sec) return prev;
    const newContent = structuredClone(sec.content);
    newContent.staff_grid = newContent.staff_grid.filter((_, i) => i !== index);
    dirtyIds.current.add(sec.id);
    return {
      ...prev,
      sections: prev.sections.map((s) =>
        s.type === "about_hero" ? { ...s, content: newContent } : s
      ),
    };
  });
  setHasChanges(true);
}, []);

  // ── Utilities ──────────────────────────────────────────────────────────────

  const getSection = (type) =>
    data?.sections.find((s) => s.type === type) || {
      content: {},
      media: [],
      id: null,
    };

  const getMediaUrl = (section, role) =>
    section.media?.find((m) => m.role === role)?.url ||
    section.media?.[0]?.url ||
    null;

  // ── Toast ──────────────────────────────────────────────────────────────────

  const notify     = (message, type = "success") => setToast({ message, type });
  const clearToast = () => setToast(null);

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    data,
    loading,
    error,
    hasChanges,
    saving,
    toast,
    clearToast,
    updateContent,
    updatePillar,
    updateStaffMember,
    handleMediaSuccess,
    handleSave,
    getSection,
    getMediaUrl,
    addStaffMember,
    removeStaffMember,
  };
}