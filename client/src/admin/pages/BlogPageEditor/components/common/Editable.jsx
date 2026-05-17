import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Check, X } from 'lucide-react';

const Editable = ({ value, onChange, tag: Tag = "span", className = "", multiline = false }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commit = () => {
    const v = draft.trim();
    if (v) onChange(v);
    setEditing(false);
  };
  
  const cancel = () => { setDraft(value); setEditing(false); };

  if (editing) {
    return (
      <span className="inline-flex items-start gap-2 align-baseline">
        {multiline ? (
          <textarea
            ref={inputRef}
            value={draft}
            rows={2}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === "Escape" && cancel()}
            className={`${className} bg-amber-50 border-b-2 border-amber-400 outline-none resize-none rounded-sm px-1 w-full`}
          />
        ) : (
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
            className={`${className} bg-amber-50 border-b-2 border-amber-400 outline-none rounded-sm px-1`}
            style={{ minWidth: "4ch", width: `${Math.max(draft.length + 3, 8)}ch` }}
          />
        )}
        
        <span className="inline-flex gap-1 mt-0.5 shrink-0">
          <button 
            onClick={commit} 
            className="w-6 h-6 rounded-lg bg-amber-400 hover:bg-amber-500 text-white flex items-center justify-center transition-colors shadow-sm shadow-amber-200"
          >
            <Check size={10} strokeWidth={3} />
          </button>
          
          <button 
            onClick={cancel} 
            className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-400 flex items-center justify-center transition-colors"
          >
            <X size={10} strokeWidth={3} />
          </button>
        </span>
      </span>
    );
  }

  return (
    <Tag
      onClick={() => setEditing(true)}
      className={`${className} group/ed cursor-text inline-flex items-center gap-1.5 hover:opacity-75 transition-opacity`}
      title="Click to edit"
    >
      {value}
      <span className="opacity-0 group-hover/ed:opacity-100 inline-flex items-center justify-center w-5 h-5 rounded-lg bg-amber-100 border border-amber-200/80 text-amber-500 transition-all duration-150 scale-75 group-hover/ed:scale-100 shrink-0">
        <Pencil size={9} strokeWidth={3} />
      </span>
    </Tag>
  );
};

export default Editable;