import { useState, useRef, useEffect } from "react";

// Map backend type values → display labels
const TYPE_LABEL = {
  project:    "Project",
  case_study: "Case Study",
};

export default function ProjectCard({ project, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Backend: type is 'project' | 'case_study'
  const typeLabel = TYPE_LABEL[project.type] ?? project.type;
  const isProject = project.type === "project";
  // Use first gallery image as thumbnail
  const thumbUrl  = project.galleryImages?.[0]?.url ?? null;

  return (
    <div className="bg-white p-4 rounded-xl overflow-visible flex flex-col h-full">
      {/* Thumbnail */}
      <div className="relative bg-gray-100 rounded-xl h-40 mb-2.5 overflow-visible flex items-center justify-center flex-shrink-0">
        {thumbUrl
          ? <img src={thumbUrl} alt={project.title} className="w-full h-full object-cover rounded-xl absolute inset-0" />
          : <div className="flex items-center justify-center w-full h-full"><ImageIcon /></div>
        }

        {/* visibility badge */}
        {!project.is_visible && (
          <span className="absolute bottom-2 left-2 bg-black/55 text-white text-xs font-semibold rounded px-1.5 py-0.5 tracking-wide">Hidden</span>
        )}

        {/* 3-dot Menu */}
        <div ref={menuRef} className="absolute top-2 right-2">
          <button className="bg-white/88 backdrop-blur-sm border-none rounded-md w-7 h-7 cursor-pointer flex items-center justify-center" onClick={() => setMenuOpen((v) => !v)}>
            <DotsIcon />
          </button>
          {menuOpen && (
            <div className="absolute top-8 right-0 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[110px] z-10 overflow-hidden">
              <button
                className="block w-full bg-none border-none px-4 py-2.5 text-left text-sm cursor-pointer text-gray-800 font-inherit hover:bg-gray-50"
                onClick={() => { setMenuOpen(false); onEdit(); }}
              >
                Edit
              </button>
              <button
                className="block w-full bg-none border-none px-4 py-2.5 text-left text-sm cursor-pointer text-red-500 font-inherit hover:bg-gray-50"
                onClick={() => { setMenuOpen(false); onDelete(); }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="flex justify-between items-end gap-2 px-0.5 flex-grow">
        <div>
          <span className="text-xs font-semibold text-[#F5A623] mb-0.5 block">{typeLabel}</span>
          <p className="text-sm font-bold text-gray-900 my-0.5">{project.title}</p>
          <p className="text-xs text-gray-400 m-0">{project.year ?? "—"}</p>
        </div>
        <button className="bg-none border-none text-xs text-gray-500 cursor-pointer flex items-center p-0 font-medium border-b border-gray-300 pb-0.5 mb-1 flex-shrink-0 hover:text-gray-700 transition-colors" onClick={onEdit}>
          {isProject ? "See more photos" : "Learn more"}
          <ArrowIcon />
        </button>
      </div>
    </div>
  );
}

function ImageIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="3" y="3" width="22" height="22" rx="4" stroke="#ccc" strokeWidth="1.5"/>
      <circle cx="10" cy="11" r="2" fill="#ccc"/>
      <path d="M3 20l6-5 4 4 3-3 9 8" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="3"  r="1.2" fill="#555" />
      <circle cx="8" cy="8"  r="1.2" fill="#555" />
      <circle cx="8" cy="13" r="1.2" fill="#555" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-1">
      <path d="M2 10L10 2M10 2H4M10 2V8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

