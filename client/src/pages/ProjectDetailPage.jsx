import { useState, useEffect } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import SafeHtml from "../components/SafeHtml.jsx";

// Use the configured API base — hardcoding localhost breaks the production build.
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ProjectDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/public/projects/${slug}`);
        setProject(res.data);
      } catch (err) {
        console.error("Failed to load project:", err);
        setError("Project not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#FFAA14] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-red-500 font-bold">{error || "Project not found."}</p>
      </div>
    );
  }

  const galleryImages = project.galleryImages || [];
  const isCase = project.type === "case_study";

  return (
    <>
      {/* ── Rich text styles ───────────────────────────────────────────── */}
      <style>{`
        .rich-text p { margin-bottom: 1rem; line-height: 1.75; }
        .rich-text h1, .rich-text h2, .rich-text h3 {
          font-weight: 800; color: #111; margin: 1.5rem 0 0.75rem;
        }
        .rich-text h1 { font-size: 1.5rem; }
        .rich-text h2 { font-size: 1.25rem; }
        .rich-text h3 { font-size: 1.1rem; }
        .rich-text ul {
          list-style: disc; padding-left: 1.5rem; margin-bottom: 1rem;
        }
        .rich-text ol {
          list-style: decimal; padding-left: 1.5rem; margin-bottom: 1rem;
        }
        .rich-text li { margin-bottom: 0.4rem; line-height: 1.7; }
        .rich-text strong { font-weight: 700; color: #111; }
        .rich-text em { font-style: italic; }
        .rich-text u { text-decoration: underline; }
        .rich-text s { text-decoration: line-through; }
        .rich-text a { color: #FFAA14; text-decoration: underline; }

        /* hide scrollbar on gallery */
        .gallery-scroll::-webkit-scrollbar { display: none; }
        .gallery-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <main className="bg-white min-h-screen pb-24">

        {/* ── BREADCRUMB ─────────────────────────────────────────────── */}
        <nav className="max-w-5xl mx-auto px-6 pt-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
          <a href="/" className="hover:text-[#FFAA14] transition-colors">Home</a>
          <span>›</span>
          <a href="/projects" className="hover:text-[#FFAA14] transition-colors">
            Projects and Case Studies
          </a>
          <span>›</span>
          <span className="text-[#FFAA14] truncate max-w-[180px]">{project.title}</span>
        </nav>

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <header className="max-w-5xl mx-auto px-6 pt-8 pb-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-[#FFAA14] transition-colors mb-8 text-sm font-semibold"
          >
            <ArrowLeft size={15} /> Back to Projects
          </button>

          <span className="text-[10px] font-black uppercase tracking-widest text-[#FFAA14] block mb-3">
            {isCase ? "Case Study" : "Project"}
          </span>
          <h1 className="text-4xl font-black text-gray-900 leading-tight mb-3">
            {project.title}
          </h1>
          <p className="text-base font-semibold text-gray-400">{project.year}</p>
        </header>

        {/* ── HORIZONTAL GALLERY ─────────────────────────────────────── */}
        {galleryImages.length > 0 && (
          <section className="mb-16 overflow-x-auto gallery-scroll">
            <div className="flex gap-5 px-6" style={{ width: "max-content" }}>
              {galleryImages.map((img, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl overflow-hidden bg-stone-100 flex-shrink-0"
                  style={{ width: 420, aspectRatio: "4/3" }}
                >
                  <img
                    src={img.url}
                    alt={img.alt_text || `${project.title} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── CONTENT SECTIONS ───────────────────────────────────────── */}
        <article className="max-w-3xl mx-auto px-6">

          {project.overview && (
            <Section title="Overview" content={project.overview} />
          )}

          {project.problem && (
            <Section title="The Problem" content={project.problem} />
          )}

          {project.solution && (
            <Section title="Wiibi Energy's Solution" content={project.solution} />
          )}

          {project.results && (
            <Section title="Results & Impact" content={project.results} />
          )}

          {project.conclusion && (
            <Section
              title="Conclusion"
              content={project.conclusion}
              last
            />
          )}

        </article>

        {/* ── CTA ────────────────────────────────────────────────────── */}
        <footer className="max-w-3xl mx-auto px-6 mt-20">
          <div className="bg-stone-50 rounded-3xl p-12 text-center border border-stone-100">
            <h3 className="text-2xl font-black text-gray-900 mb-3">
              Ready to power your business?
            </h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
              Join Wiibi Energy and dozens of other Nigerian firms switching to
              reliable solar energy.
            </p>
            <a
              href="/quote"
              className="inline-flex items-center gap-2 bg-[#FFAA14] text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[#e59912] transition-colors"
            >
              Get a Free Quote <ArrowUpRight size={14} />
            </a>
          </div>
        </footer>

      </main>
    </>
  );
};

// ── Section component ─────────────────────────────────────────────────────────
function Section({ title, content, last = false }) {
  return (
    <section className={`py-12 ${last ? "border-t border-stone-100" : "border-b border-stone-100"}`}>
      <h2 className="text-xl font-black text-[#ffaa14] mb-5">{title}</h2>
      <SafeHtml
        className="rich-text text-gray-600 text-base leading-relaxed"
        html={content}
      />
    </section>
  );
}

export default ProjectDetailPage;