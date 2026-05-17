import React, { useState, useEffect } from "react";
import { ChevronRight, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

const ProjectsPage = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/public/projects`, {
          params: { limit: 20 },
        });
        setProjects(response.data.projects || []);
      } catch (err) {
        console.error("Failed to load projects:", err);
        setError("Unable to load projects. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const tabs = ["All", "Projects", "Case Studies"];

  const filteredProjects = projects.filter((project) => {
    if (activeTab === "All") return true;
    if (activeTab === "Projects") return project.type === "project";
    if (activeTab === "Case Studies") return project.type === "case_study";
    return true;
  });

  // Adaptive image grid based on image count
  const ImageGrid = ({ images = [], title }) => {
    const count = Math.min(images.length, 4);

    const imgProps = (index, alt = "") => ({
      src: images[index]?.url || `https://via.placeholder.com/800x600?text=No+Image`,
      alt: alt || title,
      className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-700",
    });

    // 0 images — placeholder
    if (count === 0) {
      return (
        <div className="aspect-[16/9] bg-stone-100 rounded-2xl overflow-hidden flex items-center justify-center mb-8">
          <span className="text-gray-400 text-sm font-medium">No images</span>
        </div>
      );
    }

    // 1 image — full width landscape
    if (count === 1) {
      return (
        <div className="aspect-[16/9] bg-stone-50 rounded-2xl overflow-hidden mb-8">
          <img {...imgProps(0, title)} />
        </div>
      );
    }

    // 2 images — side by side equal halves
    if (count === 2) {
      return (
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="aspect-[4/3] bg-stone-50 rounded-2xl overflow-hidden">
            <img {...imgProps(0, title)} />
          </div>
          <div className="aspect-[4/3] bg-stone-50 rounded-2xl overflow-hidden">
            <img {...imgProps(1)} />
          </div>
        </div>
      );
    }

    // 3 images — one large left, two stacked right
    if (count === 3) {
      return (
        <div className="grid grid-cols-12 gap-3 mb-8">
          <div className="col-span-8 aspect-[4/3] bg-stone-50 rounded-2xl overflow-hidden">
            <img {...imgProps(0, title)} />
          </div>
          <div className="col-span-4 flex flex-col gap-3">
            <div className="flex-1 bg-stone-50 rounded-2xl overflow-hidden min-h-0">
              <img {...imgProps(1)} />
            </div>
            <div className="flex-1 bg-stone-50 rounded-2xl overflow-hidden min-h-0">
              <img {...imgProps(2)} />
            </div>
          </div>
        </div>
      );
    }

    // 4 images — one large left, three on right (one tall + two small side by side)
    return (
      <div className="grid grid-cols-12 gap-3 mb-8">
        <div className="col-span-8 aspect-[4/3] bg-stone-50 rounded-2xl overflow-hidden">
          <img {...imgProps(0, title)} />
        </div>
        <div className="col-span-4 flex flex-col gap-3">
          <div className="flex-1 bg-stone-50 rounded-2xl overflow-hidden min-h-0">
            <img {...imgProps(1)} />
          </div>
          <div className="flex gap-3 h-1/3">
            <div className="flex-1 bg-stone-50 rounded-xl overflow-hidden">
              <img {...imgProps(2)} />
            </div>
            <div className="flex-1 bg-stone-50 rounded-xl overflow-hidden">
              <img {...imgProps(3)} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FFAA14] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-xl font-bold mb-2">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-white min-h-screen">
      {/* BREADCRUMB */}
      <nav className="max-w-7xl mx-auto px-6 pt-12 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
        <a href="/" className="hover:text-[#FFAA14] transition-colors">
          Home
        </a>
        <ChevronRight size={10} strokeWidth={3} />
        <span className="text-[#FFAA14]">Projects and Case Studies</span>
      </nav>

      {/* HEADER */}
      <header className="max-w-7xl mx-auto px-6 mt-8 mb-10">
        <p className="text-[#FFAA14] font-bold text-xs uppercase tracking-widest mb-3">
          Our Works
        </p>
        <h1 className="text-4xl font-black text-[#2C2E2D]">
          Projects and Case Studies
        </h1>
      </header>

      <div className="border-[0.5px] border-[#D9D9D9]"></div>

      {/* TABS */}
      <section className="max-w-7xl mx-auto px-6 my-16">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-bold transition-all relative ${
                activeTab === tab
                  ? "text-[#FFAA14]"
                  : "text-gray-500 hover:text-amber-600"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FFAA14] animate-in fade-in duration-300" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* PROJECTS GRID */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        {filteredProjects.length === 0 ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center px-8 py-16 max-w-md">
         
              <h3 className="text-xl font-bold text-gray-900 mb-3">No Projects Found</h3>
              <p className="text-gray-600 font-medium mb-6 leading-relaxed">
                There are no projects available.
              </p>
            
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-16">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="group cursor-pointer"
                onClick={() => navigate(`/projects/${project.slug}`)}
              >
                <ImageGrid
                  images={project.galleryImages || []}
                  title={project.title}
                />

                {/* Project Info */}
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#FFAA14] block mb-2">
                      {project.type === "case_study" ? "Case Study" : "Project"}
                    </span>
                    <h3 className="text-2xl font-black text-black mb-1 group-hover:text-amber-600 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-sm font-medium text-gray-500">
                      {project.year}
                    </p>
                  </div>

                  <div className="border-b border-gray-300 pb-1">
                    <span className="flex items-center gap-2 text-xs font-black text-[#606060] group-hover:text-amber-600 transition-colors">
                      Learn more
                      <ArrowUpRight
                        size={14}
                        className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                      />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default ProjectsPage;