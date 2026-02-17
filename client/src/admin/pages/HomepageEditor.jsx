import React, { useEffect, useState, useRef } from "react";
import { api } from "../utils/api.js";
import heroFlower from "../../assets/hero-flower.svg";
import { Zap } from "lucide-react";
import { toast } from "react-toastify";

const HomePageEditor = ({ token, onHasChanges, onSaveRef }) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const originalRef = useRef(null);
  const pageId = "page-home";

  // 1. DATA FETCHING
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      onHasChanges(false);
      try {
        const res = await api.get(`/admin/pages/${pageId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Backend returns either data.sections or data.PageSections
        const secs = res.data.PageSections || res.data.sections || [];
        const sortedSecs = [...secs].sort((a, b) => a.order - b.order);

        setSections(sortedSecs);
        // Store baseline for change tracking
        originalRef.current = JSON.stringify(sortedSecs);
        console.log(res);
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Failed to load page content.");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, [token]);

  // 2. THE SAVE FUNCTION (Attached to Dashboard Ref)
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
      toast.success("🚀 Homepage pushed live!");
    } catch (err) {
      console.error(err);
      toast.error("Save failed. Check your connection.");
    }
  };

  useEffect(() => {
    if (onSaveRef) onSaveRef.current = handleSave;
  }, [sections]);

  // 3. UPDATER LOGIC
  const update = (type, path, value) => {
    setSections((prev) => {
      const updated = prev.map((s) => {
        if (s.section_type === type || s.type === type) {
          const newContent = JSON.parse(JSON.stringify(s.content)); // Deep clone
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

  // Helper to get section data for rendering
  const getSection = (type) =>
    sections.find((s) => s.section_type === type || s.type === type) || {
      content: {},
    };

  if (loading)
    return (
      <div className="p-20 text-center font-black italic text-[#FFAA14 ] -400 uppercase tracking-widest">
        Opening Home Studio...
      </div>
    );

  const hero = getSection("hero");
  const stats = getSection("stats");
  const blogTeaser = getSection("blog-teaser");
  const faqTeaser = getSection("faq-teaser");
  const cta = getSection("cta");

  return (
    <div className="min-h-screen overflow-auto bg-white pb-20">
      {/* SECTION 1: HERO */}
      <section className="min-h-[85vh] flex items-center justify-center px-6 py-10 border-b  border-stone-50 -100">
        <div className="w-full max-w-screen-2xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-[0.9] lg:pr-12">
            <input
              value={hero.content.subtitle || ""}
              onChange={(e) => update("hero", "subtitle", e.target.value)}
              className="text-[#FFAA14] font-semibold uppercase tracking-wider text-sm mb-6 bg-transparent hover:bg-amber-50 outline-none w-full"
            />
            <textarea
              value={hero.content.title || ""}
              onChange={(e) => update("hero", "title", e.target.value)}
              className="text-[#1A1102] text-5xl xl:text-7xl font-bold leading-tight mb-8 bg-transparent hover:bg-[#FFAA14 ] -50 outline-none w-full resize-none overflow-hidden"
              rows={2}
            />
            <textarea
              value={hero.content.main_support_text || ""}
              onChange={(e) =>
                update("hero", "main_support_text", e.target.value)
              }
              className="text-[#606060] text-lg xl:text-xl font-medium max-w-xl mb-10 leading-relaxed bg-transparent hover:bg-[#FFAA14 ] -50 outline-none w-full resize-none overflow-hidden"
              rows={3}
            />
            <div className="flex items-center gap-4 mb-10">
              <button className="bg-[#1A1102] px-8 py-4 text-white font-bold rounded-md opacity-50 cursor-not-allowed">
                View our packages
              </button>
              <img src={heroFlower} className="w-8 h-8" alt="decor" />
            </div>
            <textarea
              value={hero.content.second_support_text || ""}
              onChange={(e) =>
                update("hero", "second_support_text", e.target.value)
              }
              className="font-light text-[#606060] text-[17px] max-w-[260px] bg-transparent hover:bg-[#FFAA14 ] -50 outline-none w-full resize-none"
            />
          </div>

          {/* Hero Image Editor */}
          <div className="flex-[1.1] w-full aspect-[4/3] bg-[#FFAA14 ] -100 rounded-sm overflow-hidden relative group">
            <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center">
              <p className="text-[#FFAA14 ] -400 font-bold mb-4 uppercase text-xs tracking-widest">
                Hero Image ID
              </p>
              <input
                value={hero.content.image_url || "solar-hero-01"}
                onChange={(e) => update("hero", "image_url", e.target.value)}
                className="bg-white border  border-stone-50 -200 px-4 py-2 rounded-lg font-mono text-xs w-full max-w-xs text-center outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: CALCULATOR BAR */}
      <div className="w-full border-b  border-stone-50 -100 flex flex-col md:flex-row bg-white">
        <div className="flex-1 p-8 lg:p-12 border-r  border-stone-50 -100">
          <div className="flex items-center gap-4 mb-2">
            <input
              value={hero.content.question_text || ""}
              onChange={(e) => update("hero", "question_text", e.target.value)}
              className="text-xl font-bold uppercase tracking-tighter bg-transparent hover:bg-[#FFAA14 ] -50 outline-none"
            />
            <span className="text-[#FFAA14] font-bold">›››</span>
          </div>
          <input
            value={hero.content.confidence_text || ""}
            onChange={(e) => update("hero", "confidence_text", e.target.value)}
            className="text-gray-500 font-medium bg-transparent hover:bg-[#FFAA14 ] -50 outline-none w-full"
          />
        </div>
        <div className="flex-1 p-8 lg:p-12 flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-gray  mb-2 block uppercase">
              Live Preview Amount
            </span>
            <h4 className="text-4xl font-bold">₦125,000</h4>
          </div>
          <div className="text-[#FFAA14 ] -300 italic text-[10px]">
            Logic is static
          </div>
        </div>
        <div className="w-[120px] bg-[#FFAA14] flex items-center justify-center">
          <Zap size={32} color="white" fill="white" />
        </div>
      </div>

      {/* SECTION 3: STATS GRID */}
      <section className="container mx-auto flex flex-col lg:flex-row py-20 border-b  border-stone-50 -100">
        <div className="lg:w-1/3 p-8 border-r  border-stone-50 -100">
          <input
            value={stats.content.title || ""}
            onChange={(e) => update("stats", "title", e.target.value)}
            className="text-[#FFAA14] text-sm font-semibold uppercase tracking-wide mb-4 bg-transparent outline-none w-full"
          />
          <textarea
            value={stats.content.heading || ""}
            onChange={(e) => update("stats", "heading", e.target.value)}
            className="text-4xl font-bold text-gray  mb-6 bg-transparent outline-none w-full resize-none"
          />
          <textarea
            value={stats.content.paragraph_text || ""}
            onChange={(e) => update("stats", "paragraph_text", e.target.value)}
            className="text-gray-600 leading-relaxed bg-transparent outline-none w-full resize-none"
            rows={4}
          />
        </div>

        <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2">
          {stats.content.stats?.map((stat, i) => (
            <div
              key={i}
              className="p-10 border-b  border-stone-50 -100 hover:bg-[#FFAA14 ] -50/50 transition-colors"
            >
              <input
                value={stat.value}
                onChange={(e) => {
                  const newStats = [...stats.content.stats];
                  newStats[i].value = e.target.value;
                  update("stats", "stats", newStats);
                }}
                className="text-5xl font-bold text-[#FFAA14] bg-transparent outline-none w-full mb-2"
              />
              <input
                value={stat.label}
                onChange={(e) => {
                  const newStats = [...stats.content.stats];
                  newStats[i].label = e.target.value;
                  update("stats", "stats", newStats);
                }}
                className="text-lg font-semibold text-gray  mb-2 block bg-transparent outline-none w-full"
              />
              <textarea
                value={stat.description}
                onChange={(e) => {
                  const newStats = [...stats.content.stats];
                  newStats[i].description = e.target.value;
                  update("stats", "stats", newStats);
                }}
                className="text-gray-600 text-sm bg-transparent outline-none w-full resize-none"
              />
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: BLOG TEASER */}
      <section className="bg-white my-12 border-y  border-stone-50 -100">
        <div className="container mx-auto flex flex-col lg:flex-row min-h-[500px]">
          <div className="lg:w-1/3 p-8 lg:p-16 border-r  border-stone-50 -100">
            <input
              value={blogTeaser.content.title || ""}
              onChange={(e) => update("blog-teaser", "title", e.target.value)}
              className="text-[#FFAA14] text-sm font-semibold uppercase tracking-wide mb-2 bg-transparent outline-none w-full"
            />
            <textarea
              value={blogTeaser.content.heading || ""}
              onChange={(e) => update("blog-teaser", "heading", e.target.value)}
              className="text-4xl font-bold text-gray  mb-6 bg-transparent outline-none w-full resize-none"
            />
            <textarea
              value={blogTeaser.content.sub_heading || ""}
              onChange={(e) =>
                update("blog-teaser", "sub_heading", e.target.value)
              }
              className="text-gray-600 leading-relaxed bg-transparent outline-none w-full mb-8"
            />
          </div>
          <div className="lg:w-2/3 bg-[#FFAA14 ] -50 flex items-center justify-center italic text-[#FFAA14 ] -300">
            Blog Feed Preview (Manage posts in Blog tab)
          </div>
        </div>
      </section>

      {/* SECTION 5: FAQ TEASER */}
      <section className="bg-white border-b  border-stone-50 -100">
        <div className="container mx-auto flex flex-col lg:flex-row">
          <div className="lg:w-1/3 p-8 lg:p-16 border-r  border-stone-50 -100">
            <input
              value={faqTeaser.content.title || ""}
              onChange={(e) => update("faq-teaser", "title", e.target.value)}
              className="text-[#FFAA14] text-sm font-semibold uppercase tracking-wide mb-4 bg-transparent outline-none w-full"
            />
            <textarea
              value={faqTeaser.content.heading || ""}
              onChange={(e) => update("faq-teaser", "heading", e.target.value)}
              className="text-4xl font-bold text-gray  mb-6 bg-transparent outline-none w-full resize-none"
            />
          </div>
          <div className="lg:w-2/3">
            {faqTeaser.content.faqs?.map((faq, i) => (
              <div
                key={i}
                className="border-b  border-stone-50 -100 p-8 lg:p-12 hover:bg-[#FFAA14 ] -50/30 transition-all"
              >
                <input
                  value={faq.question}
                  onChange={(e) => {
                    const newFaqs = [...faqTeaser.content.faqs];
                    newFaqs[i].question = e.target.value;
                    update("faq-teaser", "faqs", newFaqs);
                  }}
                  className="text-xl font-bold text-[#FFAA14 ] -800 bg-transparent outline-none w-full mb-4"
                />
                <textarea
                  value={faq.answer}
                  onChange={(e) => {
                    const newFaqs = [...faqTeaser.content.faqs];
                    newFaqs[i].answer = e.target.value;
                    update("faq-teaser", "faqs", newFaqs);
                  }}
                  className="text-[#FFAA14 ] -500 text-base leading-relaxed bg-transparent outline-none w-full resize-none"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: CTA */}
      <section className="bg-white py-20">
        <div className="container mx-auto flex flex-col lg:flex-row border  border-stone-50 -100 rounded-[3rem] overflow-hidden">
          <div className="lg:w-2/3 bg-[#FFAA14 ] -50 flex flex-col items-center justify-center p-12">
            <p className="text-[#FFAA14 ] -400 font-black text-[10px] uppercase mb-2">
              CTA Image Asset ID
            </p>
            <input
              value={cta.content.image_url || ""}
              onChange={(e) => update("cta", "image_url", e.target.value)}
              className="bg-white border  border-stone-50 -200 px-4 py-2 rounded-lg font-mono text-xs w-64 text-center outline-none"
            />
          </div>
          <div className="lg:w-1/3 p-12 lg:p-20 flex flex-col justify-center">
            <input
              value={cta.content.title || ""}
              onChange={(e) => update("cta", "title", e.target.value)}
              className="text-[#FFAA14] text-sm font-semibold uppercase tracking-wider mb-8 bg-transparent outline-none"
            />
            <input
              value={cta.content.heading_one || ""}
              onChange={(e) => update("cta", "heading_one", e.target.value)}
              className="text-4xl font-medium text-[#FFAA14 ] -400 bg-transparent outline-none"
            />
            <input
              value={cta.content.heading_two || ""}
              onChange={(e) => update("cta", "heading_two", e.target.value)}
              className="text-4xl font-bold text-[#FFAA14 ]   mb-10 bg-transparent outline-none"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePageEditor;
