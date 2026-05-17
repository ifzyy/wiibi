import React from 'react';
import { Settings2 } from 'lucide-react';

const CategoryBar = ({ categories, activeCategory, onCategoryChange, onManageClick }) => (
  <div className="max-w-7xl mx-auto px-6 mb-16">
    <div className="flex items-end border-b border-stone-100 gap-0 overflow-x-auto">

      {/* Category tabs */}
      <div className="flex items-end gap-0 flex-1 min-w-0 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`shrink-0 pb-4 px-1 mr-7 text-[13px] font-bold transition-all relative whitespace-nowrap
              ${activeCategory === cat
                ? "text-amber-500"
                : "text-[#606060] hover:text-amber-400"
              }`}
          >
            {cat}
            {activeCategory === cat && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-amber-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Manage button */}
      <button
        onClick={onManageClick}
        className="shrink-0 mb-3 ml-4 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-stone-50 hover:bg-amber-50 border border-stone-200 hover:border-amber-200 text-stone-400 hover:text-amber-500 text-[11.5px] font-bold transition-all group/mgr whitespace-nowrap"
      >
        <Settings2 size={12} className="group-hover/mgr:rotate-90 transition-transform duration-300" />
        Manage
      </button>
    </div>
  </div>
);

export default CategoryBar;