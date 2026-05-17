import React, { useState, useEffect } from 'react';
import { Tag, Plus, X, GripVertical, Check } from 'lucide-react';
import ModalShell from '../common/ModalShell';
import ModalDarkHead from '../common/ModalDarkHead';

const CategoryModal = ({ open, onClose, categories, onSave }) => {
  // categories includes "All" — we only manage the rest
  const editable = categories.filter(c => c !== "All");
  const [draft, setDraft] = useState(editable);
  const [input, setInput] = useState("");
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  useEffect(() => {
    if (open) setDraft(categories.filter(c => c !== "All"));
  }, [open, categories]);

  const add = () => {
    const t = input.trim();
    if (t && !draft.some(d => d.toLowerCase() === t.toLowerCase())) {
      setDraft(p => [...p, t]);
      setInput("");
    }
  };

  const remove = i => setDraft(p => p.filter((_, idx) => idx !== i));

  const onDragStart = i => setDragIdx(i);
  const onDragOver = (e, i) => { e.preventDefault(); setOverIdx(i); };
  
  const onDrop = () => {
    if (dragIdx == null || dragIdx === overIdx) { 
      setDragIdx(null); 
      setOverIdx(null); 
      return; 
    }
    
    const next = [...draft];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(overIdx, 0, moved);
    setDraft(next);
    setDragIdx(null); 
    setOverIdx(null);
  };

  return (
    <ModalShell open={open} onClose={onClose} maxW="max-w-[520px]">
      <ModalDarkHead
        icon={Tag}
        title="Manage Categories"
        subtitle="Drag to reorder · Hover to remove · Press Enter to add"
        onClose={onClose}
      />

      <div className="px-7 py-5 space-y-5">
        {/* Add row */}
        <div className="flex gap-2.5">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && add()}
            placeholder="New category name…"
            className="flex-1 px-4 py-2.5 text-[13px] font-medium bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-amber-400 focus:bg-amber-50/40 transition-all placeholder:text-stone-300"
          />
          
          <button
            onClick={add}
            disabled={!input.trim()}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-35 disabled:cursor-not-allowed text-[#0C0901] text-[13px] font-black rounded-xl transition-colors flex items-center gap-1.5 shadow-sm shadow-amber-200"
          >
            <Plus size={13} strokeWidth={3} /> Add
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 text-[11px] text-stone-300 font-bold uppercase tracking-widest">
          <div className="flex-1 h-px bg-stone-100" />
          <span>{draft.length + 1} categories</span>
          <div className="flex-1 h-px bg-stone-100" />
        </div>

        {/* List */}
        <div className="space-y-1.5 max-h-[260px] overflow-y-auto -mx-1 px-1">
          {/* "All" — locked */}
          <div className="flex items-center gap-3 px-3.5 py-2.5 bg-amber-50/70 border border-amber-100 rounded-2xl">
            <GripVertical size={14} className="text-amber-200" />
            <span className="flex-1 text-[13px] font-black text-amber-500">All</span>
            <span className="text-[10px] bg-amber-100 text-amber-500 font-black uppercase tracking-widest px-2 py-0.5 rounded-lg">Locked</span>
          </div>

          {draft.length === 0 && (
            <div className="py-10 text-center text-[13px] text-stone-300 font-medium">
              No categories yet — add one above
            </div>
          )}

          {draft.map((cat, i) => (
            <div
              key={cat + i}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragOver={e => onDragOver(e, i)}
              onDrop={onDrop}
              onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border transition-all cursor-grab active:cursor-grabbing group/row
                ${overIdx === i
                  ? "border-amber-300 bg-amber-50 shadow-md shadow-amber-100"
                  : "border-stone-100 bg-white hover:border-stone-200 hover:shadow-sm"
                }`}
            >
              <GripVertical size={14} className="text-stone-300 group-hover/row:text-stone-400 transition-colors shrink-0" />
              <span className="flex-1 text-[13px] font-bold text-[#0C0901] truncate">{cat}</span>
              
              <button
                onClick={() => remove(i)}
                className="opacity-0 group-hover/row:opacity-100 w-6 h-6 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 transition-all hover:scale-110"
              >
                <X size={11} strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-7 pb-6 flex gap-2.5">
        <button
          onClick={onClose}
          className="flex-1 py-3 text-[13px] font-bold text-stone-500 bg-stone-50 hover:bg-stone-100 rounded-2xl transition-colors"
        >
          Cancel
        </button>
        
        <button
          onClick={() => { onSave(["All", ...draft]); onClose(); }}
          className="flex-1 py-3 text-[13px] font-black text-[#0C0901] bg-amber-400 hover:bg-amber-500 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-sm shadow-amber-200"
        >
          <Check size={14} strokeWidth={3} /> Save Categories
        </button>
      </div>
    </ModalShell>
  );
};

export default CategoryModal;