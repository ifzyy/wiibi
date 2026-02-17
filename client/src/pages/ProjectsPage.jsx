import React, { useState } from "react";
import { ChevronRight, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
const ProjectsPage = () => {
  const [activeTab, setActiveTab] = useState("All");
  const navigate = useNavigate;
  // Mock Data based on your image
  const projects = [
    {
      id: 1,
      type: "Projects",
      title: "Joes Bar",
      year: "2025",
      images: [
        "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800", // Main
        "https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?w=400", // Side top
        "https://images.unsplash.com/photo-1516997121675-4c2d04f0cb1f?w=400", // Side bottom left
        "https://images.unsplash.com/photo-1550966842-3ca5ad5b90ca?w=400", // Side bottom right
      ],
      linkText: "learn more",
    },
    {
      id: 2,
      type: "Case Study",
      title: "Horse bikes production Plant",
      year: "2025",
      images: [
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800", // Main
        "https://images.unsplash.com/photo-1565608876127-130029bc952f?w=400", // Side top
        "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400", // Side bottom left
        "https://images.unsplash.com/photo-1485081666428-269a767462d2?w=400", // Side bottom right
      ],
      linkText: "Learn more",
    },
  ];

  const tabs = ["All", "Projects", "Case Studies"];

  return (
    <main className="bg-white min-h-screen">
      {/* --- BREADCRUMB --- */}
      <nav className="max-w-7xl mx-auto px-6 pt-12 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#FFAA14 ] -400">
        <a href="/" className="hover:text-[#FFAA14 ]   transition-colors">
          Home
        </a>
        <ChevronRight size={10} strokeWidth={3} />
        <span className="text-amber-500">Projects and Case studies</span>
      </nav>

      {/* --- HEADER --- */}
      <header className="max-w-7xl mx-auto px-6 mt-8 mb-20">
        <p className="text-amber-500 font-bold text-xs uppercase tracking-widest mb-3">
          Our Works
        </p>
        <h1 className="text-4xl font-black text-[#FFAA14 ]  ">
          Projects and Case Studies
        </h1>
      </header>

      {/* --- TABS --- */}
      <section className="max-w-7xl mx-auto px-6 mb-16 border-b  border-stone-50 -100">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-bold transition-all relative ${
                activeTab === tab
                  ? "text-[#FFAA14 ]  "
                  : "text-[#FFAA14 ] -400 hover:text-[#FFAA14 ] -600"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 animate-in fade-in duration-300" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* --- PROJECTS LIST --- */}
      <section className="max-w-7xl mx-auto px-6 pb-24 grid lg:grid-cols-2 gap-16">
        {projects.map((item) => (
          <div key={item.id} className="group">
            {/* Image Masonry Grid */}
            <div className="grid grid-cols-12 gap-3 mb-8">
              {/* Large Main Image */}
              <div className="col-span-8 aspect-[4/3] bg-[#FFAA14 ] -50 rounded-2xl overflow-hidden border  border-stone-50 -100">
                <img
                  src={item.images[0]}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* Right Side Column */}
              <div className="col-span-4 flex flex-col gap-3">
                <div className="flex-1 bg-[#FFAA14 ] -50 rounded-2xl overflow-hidden border  border-stone-50 -100">
                  <img
                    src={item.images[1]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-3 h-1/3">
                  <div className="flex-1 bg-[#FFAA14 ] -50 rounded-xl overflow-hidden border  border-stone-50 -100">
                    <img
                      src={item.images[2]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 bg-[#FFAA14 ] -50 rounded-xl overflow-hidden border  border-stone-50 -100">
                    <img
                      src={item.images[3]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Content Info */}
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 block mb-2">
                  {item.type}
                </span>
                <h3 className="text-2xl font-black text-[#FFAA14 ]   mb-1">
                  {item.title}
                </h3>
                <p className="text-sm font-medium text-[#FFAA14 ] -400">
                  {item.year}
                </p>
              </div>

              <div className="border-b  border-stone-50 -300 pb-1">
                <a
                  href="/project/detail"
                  className="flex items-center gap-2 text-xs font-black text-[#FFAA14 ]   group/link"
                >
                  {item.linkText}
                  <ArrowUpRight
                    size={14}
                    className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform"
                  />
                </a>
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
};

export default ProjectsPage;
