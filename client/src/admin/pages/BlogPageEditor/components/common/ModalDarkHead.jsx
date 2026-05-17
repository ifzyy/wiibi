import React from 'react';
import { X } from 'lucide-react';

const ModalDarkHead = ({ icon: Icon, title, subtitle, onClose }) => (
  <div className="relative bg-[#0C0901] px-7 pt-7 pb-6 overflow-hidden select-none">
    {/* Rings deco */}
    <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 pointer-events-none">
      {[80, 120, 160, 200, 240].map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full border border-amber-400/[0.07]"
          style={{ width: s, height: s, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
        />
      ))}
    </div>
    
    <div className="relative flex items-start justify-between gap-4">
      <div className="flex items-start gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-amber-400/12 border border-amber-400/20 flex items-center justify-center shrink-0">
          <Icon size={19} className="text-amber-400" />
        </div>
        <div>
          <h2 className="text-white font-black text-[15px] leading-tight">{title}</h2>
          {subtitle && <p className="text-stone-500 text-[11.5px] mt-1 leading-relaxed">{subtitle}</p>}
        </div>
      </div>
      
      <button
        onClick={onClose}
        className="shrink-0 w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-stone-500 hover:text-white transition-all"
      >
        <X size={14} />
      </button>
    </div>
  </div>
);

export default ModalDarkHead;