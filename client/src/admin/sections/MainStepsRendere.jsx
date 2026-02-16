import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export const MainStepsRenderer = ({ content, onChange }) => {
  // Destructure with fallbacks to prevent crashes
  const { header = {}, visit_info = {}, connect_info = {} } = content;

  const update = (path, value) => {
    const newContent = { ...content };
    const keys = path.split('.');
    let current = newContent;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    onChange(newContent);
  };

  return (
    <div className="bg-white p-10 lg:p-16">
      {/* 1. Header Portion */}
      <div className="mb-16">
        <input
          value={header.sub_heading || ''}
          onChange={(e) => update('header.sub_heading', e.target.value)}
          placeholder="Subheading (e.g. Get in touch)"
          className="text-amber-500 font-bold text-[11px] uppercase tracking-[0.3em] block mb-3 bg-transparent border-b border-transparent hover:border-amber-200 outline-none w-full"
        />
        <input
          value={header.main_heading || ''}
          onChange={(e) => update('header.main_heading', e.target.value)}
          placeholder="Main Heading"
          className="text-4xl md:text-5xl font-black text-stone-900 tracking-tight bg-transparent border-b border-transparent hover:border-stone-200 outline-none w-full mb-6"
        />
        <textarea
          value={header.display_title || ''}
          onChange={(e) => update('header.display_title', e.target.value)}
          placeholder="Display Title"
          rows={1}
          className="text-3xl font-black text-stone-900 tracking-tight bg-transparent border-b border-transparent hover:border-stone-100 outline-none w-full resize-none"
        />
      </div>

      <div className="grid lg:grid-cols-12 gap-16">
        {/* 2. Connect Info (Phone Numbers) */}
        <div className="lg:col-span-4 space-y-10">
          <input
            value={connect_info.section_title || ''}
            onChange={(e) => update('connect_info.section_title', e.target.value)}
            className="text-xl font-black text-stone-900 bg-transparent border-b border-transparent hover:border-stone-200 outline-none w-full"
          />
          
          {connect_info.contact_methods?.map((method, mIdx) => (
            <div key={mIdx} className="space-y-4 p-4 rounded-2xl bg-stone-50/50 border border-stone-100">
              <input
                value={method.label}
                onChange={(e) => {
                  const newMethods = [...connect_info.contact_methods];
                  newMethods[mIdx].label = e.target.value;
                  update('connect_info.contact_methods', newMethods);
                }}
                className="text-amber-500 text-[11px] font-black uppercase tracking-widest bg-transparent outline-none w-full"
              />
              {method.values.map((val, vIdx) => (
                <input
                  key={vIdx}
                  value={val}
                  onChange={(e) => {
                    const newMethods = [...connect_info.contact_methods];
                    newMethods[mIdx].values[vIdx] = e.target.value;
                    update('connect_info.contact_methods', newMethods);
                  }}
                  className="text-stone-900 font-black text-sm block bg-transparent border-b border-transparent hover:border-amber-200 outline-none w-full"
                />
              ))}
            </div>
          ))}
        </div>

        {/* 3. Visit Info (Map & Address) */}
        <div className="lg:col-span-8">
          <input
            value={visit_info.section_title || ''}
            onChange={(e) => update('visit_info.section_title', e.target.value)}
            className="text-xl font-black text-stone-900 bg-transparent border-b border-transparent hover:border-stone-200 outline-none w-full mb-4"
          />
          <input
            value={visit_info.address || ''}
            onChange={(e) => update('visit_info.address', e.target.value)}
            className="text-stone-400 text-xs font-black uppercase tracking-widest bg-transparent border-b border-transparent hover:border-stone-100 outline-none w-full mb-8"
          />
          
          {/* Map Image Editor */}
          <div className="w-full aspect-video bg-stone-50 rounded-[2.5rem] border border-stone-100 flex items-center justify-center relative group">
             <div className="text-center">
               <p className="text-stone-200 font-black italic uppercase tracking-widest mb-2">
                 [{visit_info.map_data?.main_image}]
               </p>
               <input 
                 className="bg-white border border-stone-200 p-2 text-stone-900 text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" 
                 value={visit_info.map_data?.main_image || ''} 
                 onChange={(e) => update('visit_info.map_data.main_image', e.target.value)}
                 placeholder="Media ID (e.g. media-map-file)"
               />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};