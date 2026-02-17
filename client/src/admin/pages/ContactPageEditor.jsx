import React, { useEffect, useState, useRef } from "react";
import { api } from "../utils/api.js";
import { ChevronRight, Plus, MapPin } from "lucide-react";
import { toast } from "react-toastify";

const ContactPageEditor = ({ token, onHasChanges, onSaveRef }) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const originalRef = useRef(null);
  const pageId = "page-contact";

  // 1. DATA FETCHING
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
        toast.error("Failed to load Contact page content.");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, [token]);

  // 2. SAVE LOGIC
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
      toast.success("🚀 Contact page pushed live!");
    } catch (err) {
      console.error(err);
      toast.error("Save failed.");
    }
  };

  useEffect(() => {
    if (onSaveRef) onSaveRef.current = handleSave;
  }, [sections]);

  // 3. UNIVERSAL UPDATER
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

      const hasChanged = JSON.stringify(updated) !== originalRef.current;
      onHasChanges(hasChanged);
      return updated;
    });
  };

  // Helper to get section
  const getSection = (type) =>
    sections.find((s) => s.section_type === type || s.type === type) || {
      content: {
        header: {},
        visit_info: { map_data: {} },
        connect_info: { contact_methods: [] },
      },
    };

  if (loading)
    return (
      <div className="p-20 text-center font-black italic text-[#FFAA14 ] -400 uppercase tracking-widest">
        Opening Contact Studio...
      </div>
    );

  const main = getSection("main");
  const { header, visit_info, connect_info } = main.content;

  return (
    <main className="bg-white min-h-screen pb-32">
      {/* 1. HEADER SECTION */}
      <header className="max-w-7xl mx-auto px-6 pt-16 pb-12 border-b  border-stone-50 -100">
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#FFAA14 ] -400 mb-6">
          <span>Home</span> <ChevronRight size={10} />
          <span className="text-amber-500">Contact</span>
        </nav>

        <input
          value={header.sub_heading || ""}
          onChange={(e) => update("main", "header.sub_heading", e.target.value)}
          className="text-amber-500 font-bold text-[11px] uppercase tracking-[0.3em] block mb-3 bg-transparent hover:bg-amber-50 outline-none w-full"
        />
        <input
          value={header.main_heading || ""}
          onChange={(e) =>
            update("main", "header.main_heading", e.target.value)
          }
          className="text-4xl md:text-5xl font-black text-[#FFAA14 ]   tracking-tight bg-transparent hover:bg-[#FFAA14 ] -50 outline-none w-full"
        />
      </header>

      {/* 2. CONNECT & VISIT SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <textarea
          value={header.display_title || ""}
          onChange={(e) =>
            update("main", "header.display_title", e.target.value)
          }
          className="text-4xl font-black text-[#FFAA14 ]   mb-16 tracking-tight bg-transparent hover:bg-[#FFAA14 ] -50 outline-none w-full resize-none overflow-hidden"
          rows={1}
        />

        <div className="grid lg:grid-cols-12 gap-16">
          {/* Left: Connect Info */}
          <div className="lg:col-span-3 space-y-10">
            <div>
              <input
                value={connect_info.section_title || ""}
                onChange={(e) =>
                  update("main", "connect_info.section_title", e.target.value)
                }
                className="text-xl font-black text-[#FFAA14 ]   mb-6 bg-transparent outline-none w-full"
              />

              {connect_info.contact_methods?.map((method, i) => (
                <div
                  key={i}
                  className="mb-8 last:mb-0 border-l-2  border-stone-50 -50 pl-4"
                >
                  <input
                    value={method.label || ""}
                    onChange={(e) => {
                      const newMethods = [...connect_info.contact_methods];
                      newMethods[i].label = e.target.value;
                      update(
                        "main",
                        "connect_info.contact_methods",
                        newMethods,
                      );
                    }}
                    className="text-amber-500 text-[11px] font-black uppercase tracking-widest bg-transparent outline-none w-full mb-2"
                  />
                  <div className="space-y-1">
                    {method.values?.map((val, idx) => (
                      <input
                        key={idx}
                        value={val || ""}
                        onChange={(e) => {
                          const newMethods = [...connect_info.contact_methods];
                          newMethods[i].values[idx] = e.target.value;
                          update(
                            "main",
                            "connect_info.contact_methods",
                            newMethods,
                          );
                        }}
                        className="text-[#FFAA14 ]   font-black text-sm block bg-transparent hover:bg-[#FFAA14 ] -50 outline-none w-full"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Visit Info & Map */}
          <div className="lg:col-span-9">
            <input
              value={visit_info.section_title || ""}
              onChange={(e) =>
                update("main", "visit_info.section_title", e.target.value)
              }
              className="text-xl font-black text-[#FFAA14 ]   mb-2 bg-transparent outline-none w-full"
            />
            <input
              value={visit_info.address || ""}
              onChange={(e) =>
                update("main", "visit_info.address", e.target.value)
              }
              className="text-[#FFAA14 ] -400 text-xs font-black uppercase tracking-widest mb-8 bg-transparent outline-none w-full"
            />

            <div className="w-full aspect-video bg-[#FFAA14 ] -50 rounded-[2.5rem] border  border-stone-50 -100 overflow-hidden relative group">
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <MapPin size={40} className="text-[#FFAA14 ] -200 mb-4" />
                <span className="text-[#FFAA14 ] -300 font-black text-[10px] uppercase tracking-widest">
                  Map Asset ID
                </span>
                <input
                  value={visit_info.map_data?.main_image || ""}
                  onChange={(e) =>
                    update(
                      "main",
                      "visit_info.map_data.main_image",
                      e.target.value,
                    )
                  }
                  className="bg-white border  border-stone-50 -200 px-3 py-1 rounded mt-2 text-xs font-mono outline-none text-center"
                />
              </div>

              <div className="absolute bottom-10 left-10 bg-white p-4 rounded-2xl shadow-xl border  border-stone-50 -50">
                <p className="text-[10px] font-black uppercase text-[#FFAA14 ] -400 mb-1">
                  Marker Location Name
                </p>
                <input
                  value={visit_info.map_data?.center_location || ""}
                  onChange={(e) =>
                    update(
                      "main",
                      "visit_info.map_data.center_location",
                      e.target.value,
                    )
                  }
                  className="text-sm font-black text-[#FFAA14 ]   bg-transparent outline-none w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FAQ SECTION (Static Preview) */}
      <section className="max-w-7xl mx-auto px-6 py-32 border-t  border-stone-50 -100">
        <div className="grid lg:grid-cols-2 gap-20">
          <div>
            <span className="text-amber-500 font-bold text-[11px] uppercase tracking-[0.3em] block mb-4">
              FAQ Preview
            </span>
            <h2 className="text-5xl font-black text-[#FFAA14 ]   tracking-tighter leading-tight">
              Global FAQ <br /> Management
            </h2>
            <p className="text-[#FFAA14 ] -400 mt-6 max-w-sm">
              Edit these in the "Settings" tab to update all pages
              simultaneously.
            </p>
          </div>
          <div className="divide-y divide-[#FFAA14 ] -100 opacity-30 select-none">
            {[1, 2, 3].map((i) => (
              <div key={i} className="py-8 flex items-center justify-between">
                <div className="h-4 w-48 bg-[#FFAA14 ] -200 rounded" />
                <Plus size={20} className="text-[#FFAA14 ] -300" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default ContactPageEditor;
