import React, { useEffect, useState, useRef } from "react";
import { api } from "../utils/api.js";
import { ChevronRight, Zap, Users, ArrowUpRight } from "lucide-react";
import { toast } from "react-toastify";

const AboutPageEditor = ({ token, onHasChanges, onSaveRef }) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const originalRef = useRef(null);
  const pageId = "page-about";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      onHasChanges(false);
      try {
        const res = await api.get(`/admin/pages/${pageId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const secs = res.data.PageSections || res.data.sections || [];
        const sortedSecs = [...secs].sort((a, b) => a.order - b.order);
        setSections(sortedSecs);
        originalRef.current = JSON.stringify(sortedSecs);
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Failed to load About page.");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [token]);

  const handleSave = async () => {
    try {
      await Promise.all(
        sections.map((sec) =>
          api.put(
            `/admin/sections/${sec.id}`,
            { content: sec.content, is_visible: sec.is_visible },
            { headers: { Authorization: `Bearer ${token}` } },
          ),
        ),
      );
      originalRef.current = JSON.stringify(sections);
      onHasChanges(false);
      toast.success("🚀 About page updated!");
    } catch (err) {
      toast.error("Save failed.");
    }
  };

  useEffect(() => {
    if (onSaveRef) onSaveRef.current = handleSave;
  }, [sections]);

  const update = (type, path, value) => {
    setSections((prev) => {
      const updated = prev.map((s) => {
        if (s.section_type === type || s.type === type) {
          const newContent = JSON.parse(JSON.stringify(s.content));
          const keys = path.split(".");
          let current = newContent;
          for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
          }
          current[keys[keys.length - 1]] = value;
          return { ...s, content: newContent };
        }
        return s;
      });
      onHasChanges(JSON.stringify(updated) !== originalRef.current);
      return updated;
    });
  };

  const getSection = (type) =>
    sections.find((s) => s.section_type === type || s.type === type) || {
      content: {
        brand_info: {},
        hero_section: {},
        pillars: [],
        staff_grid: [],
      },
    };

  if (loading)
    return (
      <div className="p-20 text-center font-black italic text-[#FFAA14 ] -400 uppercase tracking-widest">
        Opening About Studio...
      </div>
    );

  const brandInfo = getSection("about_hero");

  return (
    <div className="bg-white min-h-screen pb-24">
      {/* 1. TOP BRAND INFO */}
      <div className="max-w-7xl mx-auto px-6 pt-16">
        <input
          value={brandInfo.content.brand_info.sub_heading || ""}
          onChange={(e) =>
            update("about_hero", "brand_info.sub_heading", e.target.value)
          }
          className="w-full text-amber-500 font-bold text-[11px] uppercase tracking-[0.3em] bg-transparent hover:bg-amber-50 border-none outline-none mb-4"
          placeholder="SUBHEADING"
        />
        <textarea
          value={brandInfo.content.brand_info.main_heading || ""}
          onChange={(e) =>
            update("about_hero", "brand_info.main_heading", e.target.value)
          }
          rows={1}
          className="w-full text-5xl font-black text-[#FFAA14 ]   tracking-tight bg-transparent hover:bg-[#FFAA14 ] -50 border-none outline-none resize-none overflow-hidden"
          placeholder="Main Heading"
        />
      </div>

      {/* 2. HIVE OF INNOVATION HERO */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-16">
          <div className="space-y-1">
            <input
              value={brandInfo.content.brand_info.brand_name || ""}
              onChange={(e) =>
                update("about_hero", "brand_info.brand_name", e.target.value)
              }
              className="text-[#FDB927] text-4xl font-black tracking-tight bg-transparent hover:bg-amber-50 outline-none w-full"
            />
            <input
              value={brandInfo.content.brand_info.location || ""}
              onChange={(e) =>
                update("about_hero", "brand_info.location", e.target.value)
              }
              className="text-[#FFAA14 ] -400 text-[10px] font-black uppercase tracking-[0.2em] bg-transparent hover:bg-[#FFAA14 ] -50 outline-none w-full"
            />
          </div>
          <div className="text-right">
            <input
              value={
                brandInfo.content.hero_section?.heading_accent || "Hive of"
              }
              onChange={(e) =>
                update(
                  "about_hero",
                  "hero_section.heading_accent",
                  e.target.value,
                )
              }
              className="text-5xl md:text-8xl font-black text-[#FFAA14 ] -200 tracking-tighter leading-[0.9] bg-transparent text-right outline-none"
            />
            <br />
            <input
              value={
                brandInfo.content.hero_section?.heading_main || "Innovation"
              }
              onChange={(e) =>
                update(
                  "about_hero",
                  "hero_section.heading_main",
                  e.target.value,
                )
              }
              className="text-5xl md:text-8xl font-black text-[#FFAA14 ]   tracking-tighter leading-[0.9] bg-transparent text-right outline-none"
            />
          </div>
        </div>

        <div className="w-full aspect-[21/9] bg-[#FFAA14 ] -50 rounded-[2.5rem] overflow-hidden border  border-stone-50 -100 relative group">
          <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center">
            <p className="text-[#FFAA14 ] -300 font-bold mb-4 uppercase text-xs tracking-widest">
              Main Hero Image ID
            </p>
            <input
              value={brandInfo.content.hero_section.main_image || ""}
              onChange={(e) =>
                update("about_hero", "hero_section.main_image", e.target.value)
              }
              className="bg-white border  border-stone-50 -200 px-4 py-2 rounded-lg font-mono text-xs w-full max-w-xs text-center outline-none"
            />
          </div>
        </div>
      </section>

      {/* 3. PILLARS SECTION */}
      <div className="max-w-7xl mx-auto px-6 py-24 space-y-20">
        <h3 className="text-[#FFAA14 ]   font-black text-2xl mb-10">
          Our Pillars
        </h3>
        {brandInfo.content.pillars?.map((pillar, i) => (
          <div
            key={i}
            className="flex flex-col lg:flex-row gap-10 items-center border-b  border-stone-50 -50 pb-20 last:border-0"
          >
            <div className="flex-1 w-full aspect-video bg-[#FFAA14 ] -100 rounded-[2rem] flex flex-col items-center justify-center relative p-6">
              <p className="text-[#FFAA14 ] -400 font-mono text-[10px] uppercase mb-2">
                Image ID
              </p>
              <input
                value={pillar.main_image || ""}
                onChange={(e) => {
                  const newPillars = [...brandInfo.content.pillars];
                  newPillars[i].main_image = e.target.value;
                  update("about_hero", "pillars", newPillars);
                }}
                className="bg-white border  border-stone-50 -200 px-4 py-2 rounded-lg font-mono text-xs w-full max-w-xs text-center outline-none"
              />
            </div>
            <div className="flex-1 w-full">
              <input
                value={pillar.main_heading || ""}
                onChange={(e) => {
                  const newPillars = [...brandInfo.content.pillars];
                  newPillars[i].main_heading = e.target.value;
                  update("about_hero", "pillars", newPillars);
                }}
                className="text-4xl font-black mb-4 w-full bg-transparent hover:bg-[#FFAA14 ] -50 outline-none"
              />
              <textarea
                value={pillar.support_text || ""}
                onChange={(e) => {
                  const newPillars = [...brandInfo.content.pillars];
                  newPillars[i].support_text = e.target.value;
                  update("about_hero", "pillars", newPillars);
                }}
                className="text-[#FFAA14 ] -500 text-lg w-full bg-transparent hover:bg-[#FFAA14 ] -50 outline-none h-32 resize-none"
              />
            </div>
          </div>
        ))}
      </div>

      {/* 4. LEADERSHIP / STAFF GRID */}
      <section className="max-w-7xl mx-auto px-6 py-32 border-t  border-stone-50 -100">
        <div className="grid md:grid-cols-2 gap-12 mb-24 items-end">
          <div>
            <h2 className="text-4xl font-black text-[#FFAA14 ]   tracking-tight mb-2">
              Our Leadership
            </h2>
            <div className="flex flex-col text-4xl font-black text-[#FFAA14 ] -100 leading-none">
              <span>Visionaries</span>
              <span>Focused</span>
            </div>
          </div>
          <textarea
            value={brandInfo.content.staff_intro_text || ""}
            onChange={(e) =>
              update("about_hero", "staff_intro_text", e.target.value)
            }
            className="text-[#FFAA14 ] -400 text-sm leading-relaxed max-w-xs justify-self-end text-right bg-transparent outline-none resize-none"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-16">
          {brandInfo.content.staff_grid?.map((staff, i) => (
            <div key={i} className="group">
              <div className="aspect-square bg-[#FFAA14 ] -50 rounded-[2rem] mb-6 flex flex-col items-center justify-center p-4 border  border-stone-50 -100">
                <p className="text-[#FFAA14 ] -300 font-mono text-[9px] uppercase mb-2">
                  Staff Image ID
                </p>
                <input
                  value={staff.image || ""}
                  onChange={(e) => {
                    const newGrid = [...brandInfo.content.staff_grid];
                    newGrid[i].image = e.target.value;
                    update("about_hero", "staff_grid", newGrid);
                  }}
                  className="bg-white border  border-stone-50 -200 px-3 py-1 rounded-md font-mono text-[10px] w-full text-center outline-none"
                />
              </div>
              <input
                value={staff.name || ""}
                onChange={(e) => {
                  const newGrid = [...brandInfo.content.staff_grid];
                  newGrid[i].name = e.target.value;
                  update("about_hero", "staff_grid", newGrid);
                }}
                className="font-black text-[#FFAA14 ]   text-xl mb-1 tracking-tight w-full bg-transparent outline-none"
              />
              <input
                value={staff.role || ""}
                onChange={(e) => {
                  const newGrid = [...brandInfo.content.staff_grid];
                  newGrid[i].role = e.target.value;
                  update("about_hero", "staff_grid", newGrid);
                }}
                className="text-[#FFAA14 ] -400 text-xs font-black uppercase tracking-widest w-full bg-transparent outline-none"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AboutPageEditor;
