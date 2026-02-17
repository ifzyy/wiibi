import React, { useEffect, useState } from "react";
import axios from "axios";
import { Leaf, ArrowUpRight, ChevronRight } from "lucide-react";

const AboutPage = () => {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/public/pages/about",
        );
        setPageData(response.data);
      } catch (error) {
        console.error("Error fetching about page data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="p-20 text-center font-black italic">
        Wiibi is loading...
      </div>
    );
  if (!pageData)
    return <div className="p-20 text-center font-bold">Page not found.</div>;

  const section = pageData.sections.find((s) => s.type === "about_hero");
  const { brand_info, hero_section, pillars, staff_grid } = section.content;

  return (
    <main className="bg-white selection:bg-amber-100">
      {/* 1. MINIMALIST BREADCRUMB HEADER */}
      <header className="max-w-7xl mx-auto px-6 pt-16 pb-12 border-b  border-stone-50 -50">
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#FFAA14 ] -400 mb-6">
          <span className="hover:text-[#FFAA14 ]   cursor-pointer transition-colors">
            Home
          </span>
          <ChevronRight size={10} strokeWidth={3} />
          <span className="text-amber-500">{brand_info.main_heading}</span>
        </nav>
        <span className="text-amber-500 font-bold text-[11px] uppercase tracking-[0.3em] block mb-3">
          {brand_info.sub_heading}
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-[#FFAA14 ]   tracking-tight">
          {brand_info.main_heading}
        </h1>
      </header>

      {/* 2. HIVE OF INNOVATION HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-16">
          <div className="space-y-1">
            <h2 className="text-[#FDB927] text-4xl font-black tracking-tight">
              {brand_info.brand_name}
            </h2>
            <p className="text-[#FFAA14 ] -400 text-[10px] font-black uppercase tracking-[0.2em]">
              {brand_info.location}
            </p>
          </div>
          <h2 className="text-5xl md:text-8xl font-black text-[#FFAA14 ]   tracking-tighter leading-[0.9]">
            <span className="text-[#FFAA14 ] -200">Hive of</span>{" "}
            <br className="hidden md:block" /> Innovation
          </h2>
        </div>

        {/* Large Placeholder for Hero Image */}
        <div className="w-full aspect-[21/9] bg-[#FFAA14 ] -50 rounded-[2.5rem] overflow-hidden border  border-stone-50 -100 shadow-sm relative group">
          <div className="absolute inset-0 bg-gradient-to-t from-[#FFAA14 ]  /10 to-transparent" />
          <div className="w-full h-full flex items-center justify-center text-[#FFAA14 ] -200 font-black italic text-xl uppercase tracking-widest">
            [{hero_section.main_image}]
          </div>
        </div>
      </section>

      {/* 3. VALUE PILLARS (The "Hands On" & "We Care" Layout) */}
      <section className="max-w-7xl mx-auto px-6 py-32 space-y-48">
        {pillars.map((pillar, index) => {
          const isWeCare = pillar.main_heading === "We Care";

          return (
            <div
              key={index}
              className={`flex flex-col md:flex-row items-center gap-20 transition-all duration-700 ${pillar.bg_color ? "p-16 rounded-[4rem] border  border-stone-50 -50" : ""}`}
              style={{ backgroundColor: pillar.bg_color || "transparent" }}
            >
              {/* Image Container */}
              <div
                className={`flex-1 w-full aspect-[4/3] rounded-[2rem] overflow-hidden shadow-sm border  border-stone-50 -100/50 bg-white ${index % 2 !== 0 ? "md:order-2" : ""}`}
              >
                <div className="w-full h-full flex items-center justify-center text-[#FFAA14 ] -200 font-bold tracking-widest uppercase text-xs">
                  [{pillar.main_image}]
                </div>
              </div>

              {/* Content Container */}
              <div className="flex-1 space-y-8">
                {pillar.icon === "leaf-icon" && (
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100/50">
                    <Leaf size={28} fill="currentColor" />
                  </div>
                )}

                <div>
                  <h3 className="text-5xl font-black text-[#FFAA14 ]   tracking-tight mb-4">
                    {pillar.main_heading}
                  </h3>

                  {/* Large Stylized Secondary Text */}
                  {pillar.sub_headings && (
                    <div className="flex flex-col text-5xl font-black text-[#FFAA14 ] -100 leading-tight mb-8">
                      {pillar.sub_headings.map((sh, i) => (
                        <span
                          key={i}
                          className="hover:text-[#FFAA14 ] -200 transition-colors cursor-default"
                        >
                          {sh}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-[#FFAA14 ] -500 text-lg leading-relaxed max-w-sm">
                    {pillar.support_text}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* 4. LEADERSHIP / STAFF GRID */}
      <section className="max-w-7xl mx-auto px-6 py-32">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-16">
          {staff_grid.map((staff, i) => (
            <div key={i} className="group cursor-pointer">
              <div className="aspect-square bg-[#FFAA14 ] -50 rounded-[2rem] mb-6 overflow-hidden border  border-stone-50 -100 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-[#FFAA14 ] -200/50 group-hover:-translate-y-2">
                <div className="w-full h-full flex items-center justify-center text-[#FFAA14 ] -200 uppercase font-black tracking-tighter text-xs">
                  {staff.image}
                </div>
              </div>
              <h5 className="font-black text-[#FFAA14 ]   text-xl mb-1 tracking-tight">
                {staff.name}
              </h5>
              <p className="text-[#FFAA14 ] -400 text-xs font-black uppercase tracking-widest">
                {staff.role}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default AboutPage;
