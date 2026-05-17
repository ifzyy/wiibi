import React from 'react';
import { RefreshCw, Save, Loader2 } from 'lucide-react';

const SaveBar = ({ dirty, saving, onSave, onDiscard }) => (
  <div
    className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
      ${dirty ? "translate-y-0 opacity-100" : "translate-y-28 opacity-0 pointer-events-none"}`}
  >
    <div className="flex items-center gap-3 px-2 py-2 bg-[#0C0901] rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)] border border-white/[0.06]">
      <div className="flex items-center gap-2 px-3">
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-white text-[13px] font-semibold whitespace-nowrap">Unsaved changes</span>
      </div>
      
      <div className="w-px h-5 bg-white/10" />
      
      <button
        onClick={onDiscard}
        disabled={saving}
        className="flex items-center gap-1.5 px-3 py-2 text-stone-400 hover:text-white text-[13px] font-bold transition-colors rounded-xl hover:bg-white/5 disabled:opacity-40"
      >
        <RefreshCw size={12} className={saving ? "animate-spin" : ""} /> Discard
      </button>
      
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2 bg-amber-400 hover:bg-amber-500 disabled:opacity-60 text-[#0C0901] text-[13px] font-black rounded-xl transition-colors shadow-sm shadow-amber-600/20"
      >
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  </div>
);

export default SaveBar;