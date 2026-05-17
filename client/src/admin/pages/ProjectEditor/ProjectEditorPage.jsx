import { useEffect, useCallback, useState } from "react";
import ProjectEditor from "./ProjectEditor";
import { api } from "../../../utils/api.js";

export default function ProjectEditorPage({ project = null, onBack, onHasChanges, onSaveRef }) {
  const [saving, setSaving] = useState(false);

  const handlePublish = useCallback(async (data) => {
    if (saving) return;
    setSaving(true);

    try {
      // ── Step 1: Create or update the project row ──────────────────────
      const payload = {
        title:      data.title,
        year:       data.year,
        tags:       data.tags,
        type:       project?.type || "project",
        overview:   data.overview   || null,
        problem:    data.problem    || null,
        solution:   data.solution   || null,
        results:    data.results    || null,
        conclusion: data.conclusion || null,
      };

      let savedProject;
      if (project?.id) {
        const res = await api.put(`/admin/projects/${project.id}`, payload);
        savedProject = res.data;
      } else {
        const res = await api.post("/admin/projects", payload);
        savedProject = res.data;
      }

      // ── Step 2: Upload new images (ones with a real _file object) ─────
      const newFiles = (data.files || []).filter((f) => f._file);

      for (const fileObj of newFiles) {
        const form = new FormData();
        form.append("images",     fileObj._file);
        form.append("entityType", "project");
        form.append("entity_id",  savedProject.id); // UUID — ProjectMedia row created immediately
        form.append("role",       "gallery");

        await api.post("/admin/upload", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      if (onHasChanges) onHasChanges(false);
      if (onBack) onBack();
    } catch (err) {
      console.error("[handlePublish] error:", err);
      alert(err?.response?.data?.message || "Failed to save project. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [saving, project, onHasChanges, onBack]);

  useEffect(() => {
    if (onSaveRef) onSaveRef.current = handlePublish;
    return () => { if (onSaveRef) onSaveRef.current = null; };
  }, [onSaveRef, handlePublish]);

  useEffect(() => {
    if (onHasChanges) onHasChanges(true);
    return () => { if (onHasChanges) onHasChanges(false); };
  }, [onHasChanges]);

  return (
    <ProjectEditor
      initialData={project ?? {}}
      onBack={onBack}
      onPublish={handlePublish}
      saving={saving}
    />
  );
}