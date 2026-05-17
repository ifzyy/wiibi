import { useState, useEffect, useCallback } from "react";
import ProjectCard from "./components/ProjectCard";
import TabBar from "./components/TabBar";
import { api } from "../../utils/api.js";

const TABS = ["All", "Projects", "Case Studies"];

// Map tab label → backend type value
const TAB_TYPE = {
  "Projects":     "project",
  "Case Studies": "case_study",
};

export default function ProjectsList({ onNewProject, onEditProject }) {
  const [activeTab,  setActiveTab]  = useState("All");
  const [projects,   setProjects]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState("");
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchProjects = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (search.trim())            params.search = search.trim();
      if (activeTab !== "All")      params.type   = TAB_TYPE[activeTab];

      const res = await api.get("/admin/projects", { params });
      setProjects(res.data.projects || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      setError("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => { fetchProjects(1); }, [fetchProjects]);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    try {
      await api.delete(`/admin/projects/${id}`);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch {
      alert("Failed to delete project.");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-[#F5F5F3] px-10 py-8 font-[DM_Sans,sans-serif]">
      {/* Header */}
      <div className="flex justify-between items-start mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Projects</h1>
          <p className="text-sm text-gray-400">
            {loading ? "Loading…" : `${pagination.total} project${pagination.total !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          className="flex items-center gap-1.5 bg-[#F5A623] hover:bg-[#e09710] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shrink-0"
          onClick={onNewProject}
        >
          <span className="text-lg leading-none">+</span> New Project
        </button>
      </div>

      {/* Tab Bar + Search */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-6 gap-4">
        <TabBar tabs={TABS} active={activeTab} onChange={(tab) => { setActiveTab(tab); }} />
        <input
          className="w-56 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400"
          placeholder="Search projects…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* States */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Spinner /> <span className="text-gray-400 text-sm">Loading projects…</span>
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <p className="text-red-500 text-sm">{error}</p>
          <button
            className="bg-[#F5A623] hover:bg-[#e09710] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            onClick={() => fetchProjects(1)}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-400 text-sm">No projects found.</p>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && projects.length > 0 && (
        <div className="grid grid-cols-3 gap-6 items-stretch">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={() => onEditProject(project)}
              onDelete={() => handleDelete(project.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.pages > 1 && (
        <div className="flex justify-center gap-1.5 mt-8">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                p === pagination.page
                  ? "bg-[#F5A623] border-[#F5A623] text-white font-bold"
                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-400"
              }`}
              onClick={() => fetchProjects(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className="w-5 h-5 rounded-full border-2 border-[#F5A623] border-t-transparent animate-spin inline-block" />
  );
}