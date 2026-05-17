import { useState } from "react";
import ProjectsList from "./ProjectEditor/ProjectList";
import ProjectEditorPage from "./ProjectEditor/ProjectEditorPage";

export default function ProjectsManager() {
  const [view, setView] = useState("list");
  const [editingProject, setEditingProject] = useState(null);

  if (view === "editor") {
    return (
      <ProjectEditorPage
        project={editingProject}
        onBack={() => setView("list")}
      />
    );
  }

  return (
    <ProjectsList
      onNewProject={() => { setEditingProject(null); setView("editor"); }}
      onEditProject={(p) => { setEditingProject(p); setView("editor"); }}
    />
  );
}