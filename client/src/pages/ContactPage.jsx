import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ChevronRight, ArrowUpRight, Plus, ChevronLeft } from 'lucide-react';

const ContactPage = () => {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/public/pages/contact');
        setPageData(response.data);
      } catch (error) {
        console.error("Error fetching contact data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-20 text-center font-black">Loading Contact...</div>;
  if (!pageData) return <div className="p-20 text-center">Page not found.</div>;

  const section = pageData.sections.find(s => s.type === 'main');
  const { header, visit_info, connect_info } = section.content;

  return (
    <main className="bg-white min-h-screen">
      {/* 1. HEADER SECTION */}
      <header className="max-w-7xl mx-auto px-6 pt-16 pb-12 border-b border-stone-100">
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-400 mb-6">
          <span>Home</span>
          <ChevronRight size={10} strokeWidth={3} />
          <span className="text-amber-500">{header.main_heading}</span>
        </nav>
        <span className="text-amber-500 font-bold text-[11px] uppercase tracking-[0.3em] block mb-3">
          {header.sub_heading}
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-stone-900 tracking-tight">
          {header.main_heading}
        </h1>
      </header>

      {/* 2. CONNECT & VISIT SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-black text-stone-900 mb-16 tracking-tight">
          {header.display_title}
        </h2>

        <div className="grid lg:grid-cols-12 gap-16">
          {/* Left: Connect Info */}
          <div className="lg:col-span-3 space-y-10">
            <div>
              <h3 className="text-xl font-black text-stone-900 mb-6">{connect_info.section_title}</h3>
              {connect_info.contact_methods.map((method, i) => (
                <div key={i} className="space-y-4">
                  <p className="text-amber-500 text-[11px] font-black uppercase tracking-widest">
                    {method.label}
                  </p>
                  <div className="space-y-2">
                    {method.values.map((val, idx) => (
                      <p key={idx} className="text-stone-900 font-black text-sm">{val}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Visit Info & Map */}
          <div className="lg:col-span-9">
            <h3 className="text-xl font-black text-stone-900 mb-4">{visit_info.section_title}</h3>
            <p className="text-stone-400 text-xs font-black uppercase tracking-widest mb-8">
              {visit_info.address}
            </p>
            
            {/* Map Placeholder */}
            <div className="w-full aspect-video bg-stone-50 rounded-[2.5rem] border border-stone-100 overflow-hidden relative group">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-stone-200 font-black italic uppercase tracking-widest">
                        [{visit_info.map_data.main_image}]
                    </div>
                </div>
                {/* Simulated Map Markers UI */}
                <div className="absolute bottom-10 left-10 bg-white p-4 rounded-2xl shadow-xl border border-stone-50">
                    <p className="text-[10px] font-black uppercase text-stone-400 mb-1">Center</p>
                    <p className="text-sm font-black text-stone-900">{visit_info.map_data.center_location}</p>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FAQ SECTION (Matching Screenshot image_433684) */}
      <section className="max-w-7xl mx-auto px-6 py-32 border-t border-stone-100">
        <div className="grid lg:grid-cols-2 gap-20">
          <div>
            <span className="text-amber-500 font-bold text-[11px] uppercase tracking-[0.3em] block mb-4">
              Frequently asked questions
            </span>
            <h2 className="text-5xl font-black text-stone-900 tracking-tighter leading-tight">
              Questions we have <br /> been asked
            </h2>
          </div>

          <div className="divide-y divide-stone-100">
            {[
              "How is performance monitored?",
              "How do your services delivery work ?",
              "What platforms and devices are compatible with Wiibi products?",
              "Can I get a payment plan for your products",
              "Do your products have warranty?"
            ].map((q, i) => (
              <div key={i} className="py-8 flex items-center justify-between group cursor-pointer">
                <p className="text-lg font-bold text-stone-800 group-hover:text-amber-500 transition-colors">
                  {q}
                </p>
                <Plus size={20} className="text-stone-300 group-hover:text-amber-500" />
              </div>
            ))}
            
            {/* Pagination/Scroll UI from screenshot */}
            <div className="pt-10 flex items-center justify-between">
                <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-stone-900" />
                    <div className="w-2 h-2 rounded-full bg-stone-200" />
                    <div className="w-2 h-2 rounded-full bg-stone-200" />
                </div>
                <div className="flex gap-4">
                    <button className="w-10 h-10 rounded-full border border-stone-100 flex items-center justify-center text-stone-300 hover:border-stone-900 hover:text-stone-900 transition-all">
                        <ChevronLeft size={18} />
                    </button>
                    <button className="w-10 h-10 rounded-full border border-stone-100 flex items-center justify-center text-stone-300 hover:border-stone-900 hover:text-stone-900 transition-all">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
};


export default ContactPage;