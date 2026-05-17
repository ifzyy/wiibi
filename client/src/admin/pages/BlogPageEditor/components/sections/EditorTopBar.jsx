import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Eye } from 'lucide-react';

const EditorTopBar = ({ dirty }) => {
  const navigate = useNavigate();
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-11 bg-[#0C0901] border-b border-white/[0.05]">
      <div className="flex items-center gap-3 text-[11px]">
        <div className="flex items-center gap-2 font-black uppercase tracking-widest text-amber-400">
          <Sparkles size={11} />
          <span>Page Editor</span>
        </div>
        <div className="w-px h-3.5 bg-white/10" />
        <span className="text-stone-500 font-medium">Click any text to edit inline</span>
      </div>
      
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/blog")}
          className="flex items-center gap-1.5 text-[11px] text-stone-500 hover:text-white font-bold transition-colors"
        >
          <Eye size={11} /> Preview
        </button>
        
        <div className={`flex items-center gap-1.5 text-[11px] font-bold ${dirty ? "text-amber-400" : "text-stone-600"}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${dirty ? "bg-amber-400 animate-pulse" : "bg-emerald-500"}`} />
          {dirty ? "Unsaved" : "Saved"}
        </div>
      </div>
    </div>
  );
};

export default EditorTopBar;