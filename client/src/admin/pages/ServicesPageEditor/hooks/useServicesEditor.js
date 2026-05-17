/**
 * useServicesEditor.js
 *
 * All editor state and mutations for the services page.
 *
 * The services page has three sections, each with its own content shape:
 *
 *  "hero" section:
 *    content: { title, subtitle }
 *
 *  "main" section:
 *    content: {
 *      main_steps: [{ main_heading, support_text, image_url }]
 *    }
 *
 *  "contact_process" section:
 *    content: {
 *      header:          { sub_heading, main_heading }
 *      process_steps:   [{ step_number, heading, support_text }]
 *      form_settings:   { submit_button_text, fields: [{ label, type, placeholder }] }
 *    }
 *
 * Returns:
 *  data, loading, error            — fetch state
 *  hasChanges, saving              — save state
 *  toast, clearToast               — notifications
 *  updateContent                   — update a dot-path inside a section's content
 *  updateMainStep                  — update main_steps[index][field]
 *  updateProcessStep               — update process_steps[index][field]
 *  updateFormField                 — update form_settings.fields[index][field]
 *  updateSubmitButtonText          — update form submit button label
 *  handleMediaSuccess              — sync new image URL after upload
 *  handleSave                      — PUT all dirty sections
 *  getSection                      — find section by type
 *  getMediaUrl                     — resolve media URL by role
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchServicesPage, saveSection } from "../api/serviceApi";

export function useServicesEditor() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState(null);

  /** Only sections whose content has changed since last save will be PUT. */
  const dirtyIds = useRef(new Set());

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const payload = await fetchServicesPage();
        setData(payload);
        if (payload.page?.meta_title) document.title = payload.page.meta_title;
      } catch (err) {
        console.error("Services page fetch error:", err);
        setError(err.response?.data?.message || "Failed to load services page.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Base updater ───────────────────────────────────────────────────────────

  /**
   * Replace a section's content block immutably.
   * All specific mutations call this after preparing newContent.
   */
  const applyUpdate = useCallback((sectionType, newContent) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) => {
        if (sec.type !== sectionType) return sec;
        dirtyIds.current.add(sec.id);
        return { ...sec, content: newContent };
      }),
    }));
    setHasChanges(true);
  }, []);

  // ── Generic dot-path update ────────────────────────────────────────────────

  /**
   * Update any flat or nested field via dot-path string.
   * Used for simple scalar fields like hero.title, header.sub_heading, etc.
   *
   * @param {string} sectionType   e.g. "hero", "contact_process"
   * @param {string} dotPath       e.g. "header.sub_heading"
   * @param {*}      value
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

  // ── Array item mutations ───────────────────────────────────────────────────

  /**
   * Update a single field on a main_steps item.
   * @param {number} index
   * @param {string} field  "main_heading" | "support_text" | "image_url"
   * @param {*}      value
   */
  const updateMainStep = useCallback((index, field, value) => {
    setData((prev) => {
      const sec = prev.sections.find((s) => s.type === "main");
      if (!sec) return prev;
      const newContent = structuredClone(sec.content);
      newContent.main_steps[index] = { ...newContent.main_steps[index], [field]: value };
      dirtyIds.current.add(sec.id);
      return {
        ...prev,
        sections: prev.sections.map((s) =>
          s.type === "main" ? { ...s, content: newContent } : s
        ),
      };
    });
    setHasChanges(true);
  }, []);

  /**
   * Update a single field on a process_steps item.
   * @param {number} index
   * @param {string} field  "heading" | "support_text" | "step_number"
   * @param {*}      value
   */
  const updateProcessStep = useCallback((index, field, value) => {
    setData((prev) => {
      const sec = prev.sections.find((s) => s.type === "contact_process");
      if (!sec) return prev;
      const newContent = structuredClone(sec.content);
      newContent.process_steps[index] = {
        ...newContent.process_steps[index],
        [field]: value,
      };
      dirtyIds.current.add(sec.id);
      return {
        ...prev,
        sections: prev.sections.map((s) =>
          s.type === "contact_process" ? { ...s, content: newContent } : s
        ),
      };
    });
    setHasChanges(true);
  }, []);

  /**
   * Update a single field on a form field definition.
   * @param {number} index
   * @param {string} field  "label" | "placeholder" | "type"
   * @param {*}      value
   */
  const updateFormField = useCallback((index, field, value) => {
    setData((prev) => {
      const sec = prev.sections.find((s) => s.type === "contact_process");
      if (!sec) return prev;
      const newContent = structuredClone(sec.content);
      newContent.form_settings.fields[index] = {
        ...newContent.form_settings.fields[index],
        [field]: value,
      };
      dirtyIds.current.add(sec.id);
      return {
        ...prev,
        sections: prev.sections.map((s) =>
          s.type === "contact_process" ? { ...s, content: newContent } : s
        ),
      };
    });
    setHasChanges(true);
  }, []);

  /** Update the form submit button text. */
  const updateSubmitButtonText = useCallback((value) => {
    updateContent("contact_process", "form_settings.submit_button_text", value);
  }, [updateContent]);

  // ── Media sync ─────────────────────────────────────────────────────────────

  /**
   * After ImageEditor uploads + attaches, sync new URL into local state.
   * No dirty flag — server already persisted the media attachment.
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
    updateMainStep,
    updateProcessStep,
    updateFormField,
    updateSubmitButtonText,
    handleMediaSuccess,
    handleSave,
    getSection,
    getMediaUrl,
  };
}