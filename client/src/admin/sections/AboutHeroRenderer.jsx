import React from "react";
import { ChevronRight } from "lucide-react";

export const AboutHeroRenderer = ({ content, onChange }) => {
  const { brand_info, hero_section } = content;

  const update = (path, value) => {
    const newContent = { ...content };
    const keys = path.split(".");
    let current = newContent;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    onChange(newContent);
  };

  return (
    <div className="bg-white">
      {/* 1. BREADCRUMB HEADER */}
      <header className="max-w-7xl mx-auto px-6 pt-16 pb-12 border-b  border-stone-50 -50">
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#FFAA14 ] -400 mb-6">
          <span>Home</span> <ChevronRight size={10} strokeWidth={3} />
          <span className="text-amber-500">{brand_info.main_heading}</span>
        </nav>

        <input
          value={brand_info.sub_heading}
          onChange={(e) => update("brand_info.sub_heading", e.target.value)}
          className="text-amber-500 font-bold text-[11px] uppercase tracking-[0.3em] block mb-3 bg-transparent border-b border-transparent hover:border-amber-200 outline-none w-full"
        />
        <input
          value={brand_info.main_heading}
          onChange={(e) => update("brand_info.main_heading", e.target.value)}
          className="text-4xl md:text-5xl font-black text-[#FFAA14 ]   tracking-tight bg-transparent border-b border-transparent hover: border-stone-50 -200 outline-none w-full"
        />
      </header>

      {/* 2. HIVE SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-16">
          <div className="space-y-1">
            <input
              value={brand_info.brand_name}
              onChange={(e) => update("brand_info.brand_name", e.target.value)}
              className="text-[#FDB927] text-4xl font-black tracking-tight bg-transparent border-b border-transparent hover:border-amber-200 outline-none w-full"
            />
            <input
              value={brand_info.location}
              onChange={(e) => update("brand_info.location", e.target.value)}
              className="text-[#FFAA14 ] -400 text-[10px] font-black uppercase tracking-[0.2em] bg-transparent border-b border-transparent hover: border-stone-50 -200 outline-none w-full"
            />
          </div>
          <h2 className="text-5xl md:text-8xl font-black text-[#FFAA14 ]   tracking-tighter leading-[0.9]">
            <span className="text-[#FFAA14 ] -200">Hive of</span>{" "}
            <br className="hidden md:block" /> Innovation
          </h2>
        </div>

        <div className="w-full aspect-[21/9] bg-[#FFAA14 ] -50 rounded-[2.5rem] overflow-hidden border  border-stone-50 -100 relative group">
          <div className="w-full h-full flex items-center justify-center text-[#FFAA14 ] -200 font-black italic text-xl uppercase tracking-widest">
            <input
              className="bg-white/90 border  border-stone-50 -200 p-2 text-[#FFAA14 ]   text-xs font-sans not-italic rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              value={hero_section.main_image}
              onChange={(e) =>
                update("hero_section.main_image", e.target.value)
              }
            />
            <span className="absolute pointer-events-none">
              [{hero_section.main_image}]
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
