import { useState, useEffect, useRef } from "react";
import { Icon, I } from "../utils/icons.jsx";

export const EditableText = ({
  value,
  onChange,
  as: Tag = "span",
  multiline = false,
  className = "",
  placeholder = "Click to edit…",
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onChange(draft);
  };

  const handleKeyDown = (e) => {
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      commit();
    }
    if (e.key === "Escape") {
      setDraft(value);
      setEditing(false);
    }
  };

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.select?.();
    }
  }, [editing]);

  if (editing) {
    const shared = {
      ref,
      value: draft ?? "",
      onChange: (e) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: handleKeyDown,
      placeholder,
      className: `edit-active-field w-full bg-amber-50 border-2 border-amber-400 rounded-sm outline-none`,
      style: {
        font: "inherit",
        color: "inherit",
        padding: "1px 5px",
        lineHeight: "inherit",
        letterSpacing: "inherit",
        fontWeight: "inherit",
        fontSize: "inherit",
        resize: "none",
      },
    };
    return multiline ? (
      <textarea
        {...shared}
        rows={Math.max(2, (draft || "").split("\n").length + 1)}
      />
    ) : (
      <input {...shared} type="text" />
    );
  }

  return (
    <Tag
      className={`editable-idle group/et relative cursor-text rounded-sm transition-all ${className}`}
      onClick={() => setEditing(true)}
      title="Click to edit"
    >
      {value || (
        <span className="opacity-25 italic font-normal text-sm">
          {placeholder}
        </span>
      )}
    </Tag>
  );
};

export const EditableImage = ({ src, alt = "", onChange, className = "" }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(src);
  const fallback =
    "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400";

  useEffect(() => {
    setDraft(src);
  }, [src]);

  const commit = () => {
    setEditing(false);
    if (draft !== src) onChange(draft);
  };

  return (
    <div className="relative group/ei">
      <img
        src={src || fallback}
        alt={alt}
        className={className}
        onError={(e) => {
          e.target.src = fallback;
        }}
      />
      <button
        onClick={() => setEditing(true)}
        className="absolute top-2 right-2 opacity-0 group-hover/ei:opacity-100 transition-all
          bg-white/95 hover:bg-amber-50 border border-amber-200 text-amber-700
          text-xs px-2.5 py-1.5 rounded-lg font-semibold
          flex items-center gap-1.5 shadow-lg z-10"
      >
        <Icon d={I.image} size={11} />
        Change image
      </button>
      {editing && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center z-20 p-5 rounded">
          <p className="text-white/70 text-[10px] uppercase tracking-widest font-bold mb-3">
            Paste image URL
          </p>
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            className="w-full px-3 py-2.5 rounded-lg text-sm mb-3 bg-white text-gray  placeholder-gray-400 border-0 outline-none shadow-lg"
            placeholder="https://images.unsplash.com/…"
          />
          <div className="flex gap-2">
            <button
              onClick={commit}
              className="bg-amber-400 hover:bg-amber-300 text-black px-5 py-2 rounded-lg text-xs font-black transition-all"
            >
              Apply
            </button>
            <button
              onClick={() => setEditing(false)}
              className="bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-lg text-xs font-medium transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
