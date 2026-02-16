import React, { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import { ChevronRight, ChevronLeft, Plus, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';

const ContactPageEditor = ({ token, onHasChanges, onSaveRef }) => {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [originalData, setOriginalData] = useState(null);
// 1. On Fetch: Store both current and a backup for comparison
  useEffect(() => {
    const load = async () => {
      const res = await api.get('/admin/pages/page-contact',{
        headers:{
            Authorization: `Bearer ${token}`
        }
      });
      setData(res.data);
      setOriginalData(JSON.stringify(res.data)); // The reference point
    };
    load();
  }, []);

  // 2. The Save Function: What handleSave() in Dashboard triggers
  const handleSave = async () => {
    try {
      // Loop sections and PUT to API
      await api.put('/admin/sections/...', data); 
      
      // Sync the originalData so the "Has Changes" dot goes away
      setOriginalData(JSON.stringify(data));
      onHasChanges(false); 
      toast.success("Live site updated!");
    } catch (err) { toast.error("Save failed"); }
  };

  // 3. The "Useful Thing": Attach handleSave to the Dashboard's Ref
  // This is how the TopBar button actually finds this function
  useEffect(() => {
    if (onSaveRef) onSaveRef.current = handleSave;
  }, [data]); // Re-bind whenever data changes

  // 4. The Change Tracker
  const updateContent = (newContent) => {
    setData(newContent);
    // If current data is different from backup, light up the yellow dot
    const isDirty = JSON.stringify(newContent) !== originalData;
    onHasChanges(isDirty);
  };

  if (loading) return <div className="p-20 text-center font-black italic text-stone-400">Opening Contact Studio...</div>;

  const section = pageData.sections.find(s => s.type === 'main');
  const { header, visit_info, connect_info } = section.content;

  return (
    <main className="bg-white min-h-screen pb-32">
      {/* 1. HEADER SECTION */}
      <header className="max-w-7xl mx-auto px-6 pt-16 pb-12 border-b border-stone-100">
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-400 mb-6">
          <span>Home</span>
          <ChevronRight size={10} strokeWidth={3} />
          <span className="text-amber-500">Contact</span>
        </nav>
        
        <input 
          value={header.sub_heading}
          onChange={(e) => update('header.sub_heading', e.target.value)}
          className="text-amber-500 font-bold text-[11px] uppercase tracking-[0.3em] block mb-3 bg-transparent hover:bg-amber-50 outline-none w-full"
        />
        <input 
          value={header.main_heading}
          onChange={(e) => update('header.main_heading', e.target.value)}
          className="text-4xl md:text-5xl font-black text-stone-900 tracking-tight bg-transparent hover:bg-stone-50 outline-none w-full"
        />
      </header>

      {/* 2. CONNECT & VISIT SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <textarea 
          value={header.display_title}
          onChange={(e) => update('header.display_title', e.target.value)}
          className="text-4xl font-black text-stone-900 mb-16 tracking-tight bg-transparent hover:bg-stone-50 outline-none w-full resize-none overflow-hidden"
          rows={1}
        />

        <div className="grid lg:grid-cols-12 gap-16">
          {/* Left: Connect Info */}
          <div className="lg:col-span-3 space-y-10">
            <div>
              <input 
                value={connect_info.section_title}
                onChange={(e) => update('connect_info.section_title', e.target.value)}
                className="text-xl font-black text-stone-900 mb-6 bg-transparent hover:bg-stone-50 outline-none w-full"
              />
              
              {connect_info.contact_methods.map((method, i) => (
                <div key={i} className="mb-8 last:mb-0">
                  <input 
                    value={method.label}
                    onChange={(e) => {
                        const newMethods = [...connect_info.contact_methods];
                        newMethods[i].label = e.target.value;
                        update('connect_info.contact_methods', newMethods);
                    }}
                    className="text-amber-500 text-[11px] font-black uppercase tracking-widest bg-transparent outline-none w-full mb-4"
                  />
                  <div className="space-y-2">
                    {method.values.map((val, idx) => (
                      <input 
                        key={idx}
                        value={val}
                        onChange={(e) => {
                            const newMethods = [...connect_info.contact_methods];
                            newMethods[i].values[idx] = e.target.value;
                            update('connect_info.contact_methods', newMethods);
                        }}
                        className="text-stone-900 font-black text-sm block bg-transparent hover:bg-stone-50 outline-none w-full"
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
                value={visit_info.section_title}
                onChange={(e) => update('visit_info.section_title', e.target.value)}
                className="text-xl font-black text-stone-900 mb-4 bg-transparent outline-none w-full"
            />
            <input 
                value={visit_info.address}
                onChange={(e) => update('visit_info.address', e.target.value)}
                className="text-stone-400 text-xs font-black uppercase tracking-widest mb-8 bg-transparent outline-none w-full"
            />
            
            {/* Map Editor UI */}
            <div className="w-full aspect-video bg-stone-50 rounded-[2.5rem] border border-stone-100 overflow-hidden relative group">
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-100/50">
                    <MapPin size={40} className="text-stone-200 mb-4" />
                    <div className="text-stone-300 font-black text-xs uppercase tracking-widest">
                        Map Media ID: 
                    </div>
                    <input 
                        value={visit_info.map_data.main_image}
                        onChange={(e) => update('visit_info.map_data.main_image', e.target.value)}
                        className="bg-white border border-stone-200 px-3 py-1 rounded mt-2 text-xs font-mono outline-none"
                    />
                </div>
                
                {/* Simulated Map Marker Overlay */}
                <div className="absolute bottom-10 left-10 bg-white p-4 rounded-2xl shadow-xl border border-stone-50 z-10">
                    <p className="text-[10px] font-black uppercase text-stone-400 mb-1">Center</p>
                    <input 
                        value={visit_info.map_data.center_location}
                        onChange={(e) => update('visit_info.map_data.center_location', e.target.value)}
                        className="text-sm font-black text-stone-900 bg-transparent outline-none"
                    />
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FAQ SECTION (Preview) */}
      <section className="max-w-7xl mx-auto px-6 py-32 border-t border-stone-100">
        <div className="grid lg:grid-cols-2 gap-20">
          <div>
            <span className="text-amber-500 font-bold text-[11px] uppercase tracking-[0.3em] block mb-4">
              Frequently asked questions
            </span>
            <h2 className="text-5xl font-black text-stone-900 tracking-tighter leading-tight">
              Manage FAQs in <br /> Settings Tab
            </h2>
            <p className="text-stone-400 mt-6 max-w-sm">FAQ content is shared across pages and can be edited globally to maintain consistency.</p>
          </div>

          <div className="divide-y divide-stone-100 opacity-40 grayscale pointer-events-none">
            {["Question 1", "Question 2", "Question 3"].map((q, i) => (
              <div key={i} className="py-8 flex items-center justify-between">
                <p className="text-lg font-bold text-stone-800">{q}</p>
                <Plus size={20} className="text-stone-300" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default ContactPageEditor;