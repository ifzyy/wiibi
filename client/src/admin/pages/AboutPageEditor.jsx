import React, { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import { ChevronRight, Leaf } from 'lucide-react';

const AboutPageEditor = ({ token, onHasChanges, onSaveRef }) => {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
const [originalData, setOriginalData] = useState(null);
 // 1. On Fetch: Store both current and a backup for comparison
  useEffect(() => {
    const load = async () => {
      const res = await api.get('/admin/pages/page-about');
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
  return (
    <div className="bg-white min-h-full">
      {/* UX TRICK: These inputs look like regular text 
          until you click/hover them.
      */}
      <div className="max-w-7xl mx-auto px-6 pt-16">
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-400 mb-6">
          <span>Home</span> <ChevronRight size={10} />
          <span className="text-amber-500">About Us</span>
        </nav>

        {/* EDITABLE SUB-HEADING */}
        <input 
          value={brand_info.sub_heading}
          onChange={(e) => update('brand_info.sub_heading', e.target.value)}
          className="w-full text-amber-500 font-bold text-[11px] uppercase tracking-[0.3em] bg-transparent hover:bg-amber-50 border-none outline-none cursor-text"
        />

        {/* EDITABLE MAIN HEADING */}
        <textarea 
          value={brand_info.main_heading}
          onChange={(e) => update('brand_info.main_heading', e.target.value)}
          rows={1}
          className="w-full text-5xl font-black text-stone-900 tracking-tight bg-transparent hover:bg-stone-50 border-none outline-none resize-none overflow-hidden"
        />
      </div>

      {/* 4. PILLARS SECTION (WE CARE / HANDS ON) */}
      <div className="max-w-7xl mx-auto px-6 py-24 space-y-20">
        {pillars.map((pillar, i) => (
          <div key={i} className="flex gap-10 items-center">
             <div className="flex-1 aspect-video bg-stone-100 rounded-[2rem] flex items-center justify-center relative group">
                <span className="text-stone-300 font-black">[{pillar.main_image}]</span>
                {/* Overlay for Image Edit */}
                <input 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  title="Change Image ID"
                  onChange={(e) => update(`pillars.${i}.main_image`, e.target.value)}
                />
             </div>
             <div className="flex-1">
                <input 
                  value={pillar.main_heading}
                  onChange={(e) => update(`pillars.${i}.main_heading`, e.target.value)}
                  className="text-4xl font-black mb-4 w-full bg-transparent hover:bg-stone-50 outline-none"
                />
                <textarea 
                  value={pillar.support_text}
                  onChange={(e) => update(`pillars.${i}.support_text`, e.target.value)}
                  className="text-stone-500 text-lg w-full bg-transparent hover:bg-stone-50 outline-none h-32"
                />
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default AboutPageEditor