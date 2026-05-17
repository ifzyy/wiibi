/**
 * StorePageEditor.jsx
 *
 * WYSIWYG admin editor for the Store page.
 *
 * Editable content (5 tabs):
 *   1. Banner Slides   – tag, heading, subtitle, CTA label+link, accent colour,
 *                        bg gradient, banner image (upload → { url, id, ... })
 *   2. Categories      – reorder + rename labels; products still drive what exists
 *   3. Price Presets   – add / remove / reorder ranges
 *   4. Sort Options    – display labels only (backend value keys are fixed)
 *   5. Store Metadata  – sidebar help card copy, grid heading
 *
 * Image upload contract:
 *   EditableImage → ImageEditor → your upload endpoint → { url, id, ... }
 *   handleImageChange reads result.url (or the raw string if returned directly).
 *
 * Save contract:
 *   onSave({ slides, categories, pricePresets, sortOptions, meta })
 *   → parent does PATCH /api/page-sections/sec-store-config
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Save, Plus, Trash2, Eye, EyeOff, GripVertical,
  ChevronDown, ChevronUp, AlertCircle, X, Check,
  Image as ImageIcon, Tag, ArrowLeft, ArrowRight,
  LayoutGrid, SlidersHorizontal, ArrowUpDown,
  RefreshCw, Pencil, GripHorizontal,
} from "lucide-react";
import EditableImage from "../HomePageEditor/components/EditableImage";
import { ROLE } from "../HomePageEditor/api/homepageApi";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const ACCENT_PRESETS = [
  "#FFAA14", "#22d3ee", "#a78bfa", "#4ade80",
  "#f87171", "#fb923c", "#e879f9", "#34d399",
];

const DEFAULT_SLIDE = () => ({
  id:      `slide-${Date.now()}`,
  tag:     "New Slide",
  heading: "Your headline here",
  sub:     "Supporting text that explains the value proposition.",
  cta:     { label: "Shop Now", filter: {} },
  accent:  "#FFAA14",
  bg:      "from-[#0C0901] via-[#1a1200] to-[#2a1f00]",
  image:   null,
  decorators: [
    { size: 220, x: "right-[-40px]", y: "top-[-60px]",    opacity: 0.08, blur: 60 },
    { size: 120, x: "right-[120px]", y: "bottom-[-30px]", opacity: 0.12, blur: 40 },
  ],
});

// ─────────────────────────────────────────────────────────────────────────────
// ARRAY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const clamp   = (n, lo, hi) => Math.min(Math.max(n, lo), hi);
const moveArr = (arr, from, to) => {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(clamp(to, 0, next.length), 0, item);
  return next;
};

// ─────────────────────────────────────────────────────────────────────────────
// BASE UI ATOMS
// ─────────────────────────────────────────────────────────────────────────────

const Field = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
      {label}
      {hint && (
        <span className="text-[10px] font-normal normal-case tracking-normal text-gray-300">
          — {hint}
        </span>
      )}
    </label>
    {children}
  </div>
);

const Input = ({ className = "", ...props }) => (
  <input
    {...props}
    className={`w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] text-gray-800
      focus:outline-none focus:border-[#FFAA14] focus:ring-2 focus:ring-[#FFAA14]/10
      placeholder:text-gray-300 transition-all bg-white ${className}`}
  />
);

const Textarea = ({ className = "", ...props }) => (
  <textarea
    {...props}
    rows={3}
    className={`w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] text-gray-800
      resize-none focus:outline-none focus:border-[#FFAA14] focus:ring-2 focus:ring-[#FFAA14]/10
      placeholder:text-gray-300 transition-all bg-white ${className}`}
  />
);

const InfoBox = ({ children }) => (
  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-[12px]
    text-amber-700 leading-relaxed">
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────

const Toast = ({ message, type = "success", onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3
        px-5 py-3.5 rounded-2xl shadow-2xl text-[13px] font-semibold text-white
        ${type === "error" ? "bg-red-500" : "bg-emerald-500"}`}
      style={{ animation: "toastIn .25s cubic-bezier(.34,1.56,.64,1) both" }}
    >
      {type === "success" ? <Check size={15} /> : <AlertCircle size={15} />}
      {message}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ACCENT COLOUR PICKER
// ─────────────────────────────────────────────────────────────────────────────

const AccentPicker = ({ value, onChange }) => (
  <div className="flex items-center gap-2 flex-wrap">
    {ACCENT_PRESETS.map(c => (
      <button
        key={c}
        onClick={() => onChange(c)}
        title={c}
        className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110"
        style={{
          background:  c,
          borderColor: value === c ? "#111" : "transparent",
          boxShadow:   value === c ? `0 0 0 3px ${c}55` : "none",
        }}
      />
    ))}
    {/* Custom hex */}
    <label className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-1.5 cursor-text">
      <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: value }} />
      <input
        type="text"
        value={value}
        maxLength={7}
        onChange={e => onChange(e.target.value)}
        className="w-16 text-[11px] font-mono focus:outline-none bg-transparent"
        placeholder="#FFAA14"
      />
    </label>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE MINI-PREVIEW
// ─────────────────────────────────────────────────────────────────────────────

const SlidePreview = ({ slide }) => (
  <div
    className={`relative w-full h-28 rounded-xl overflow-hidden bg-gradient-to-r ${slide.bg}`}
    style={{ border: `1.5px solid ${slide.accent}44` }}
  >
    {slide.image && (
      <img
        src={slide.image}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-50"
      />
    )}
    {!slide.image && slide.decorators?.map((d, i) => (
      <div
        key={i}
        className={`absolute rounded-full pointer-events-none ${d.x} ${d.y}`}
        style={{
          width:      d.size * 0.45,
          height:     d.size * 0.45,
          background: slide.accent,
          opacity:    d.opacity,
          filter:     `blur(${d.blur * 0.45}px)`,
        }}
      />
    ))}
    <div className="relative z-10 h-full flex flex-col justify-center px-4">
      <p
        className="text-[8px] font-bold uppercase tracking-[.15em] mb-0.5"
        style={{ color: slide.accent }}
      >
        {slide.tag}
      </p>
      <p className="text-white font-black text-[11px] leading-tight mb-2 whitespace-pre-line line-clamp-2">
        {slide.heading}
      </p>
      <span
        className="inline-flex items-center gap-1 text-[8px] font-bold px-2.5 py-1 rounded-lg w-fit"
        style={{ background: slide.accent, color: "#000" }}
      >
        {slide.cta?.label}
      </span>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE EDITOR PANEL
// ─────────────────────────────────────────────────────────────────────────────

const SlideEditorPanel = ({ slide, index, total, onChange, onDelete, onMove }) => {
  const [open, setOpen] = useState(index === 0);

  const set    = (key, val) => onChange({ ...slide, [key]: val });
  const setCta = (key, val) => onChange({ ...slide, cta: { ...slide.cta, [key]: val } });

  // Server returns { url, id, ... } — read .url; fall back to raw string
  const handleImageChange = (result) => {
    const url = typeof result === "string" ? result : (result?.url ?? null);
    set("image", url);
  };

  return (
    <div
      className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm
        transition-shadow hover:shadow-md"
      style={{ borderLeftColor: slide.accent, borderLeftWidth: 3 }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 bg-gray-50/70 cursor-pointer select-none"
        onClick={() => setOpen(o => !o)}
      >
        <GripVertical size={14} className="text-gray-300 flex-shrink-0" />
        <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: slide.accent }} />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-gray-800 truncate leading-none">
            {slide.heading?.split("\n")[0] || "Untitled Slide"}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">{slide.tag}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onMove(index, index - 1); }}
            disabled={index === 0}
            className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-25 transition-colors"
            title="Move left"
          >
            <ArrowLeft size={12} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onMove(index, index + 1); }}
            disabled={index === total - 1}
            className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-25 transition-colors"
            title="Move right"
          >
            <ArrowRight size={12} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(slide.id); }}
            className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-300 transition-colors"
            title="Delete slide"
          >
            <Trash2 size={12} />
          </button>
          {open
            ? <ChevronUp   size={14} className="text-gray-300 ml-1" />
            : <ChevronDown size={14} className="text-gray-300 ml-1" />
          }
        </div>
      </div>

      {/* Body */}
      {open && (
        <div className="p-5 space-y-5 border-t border-gray-100">
          <SlidePreview slide={slide} />

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tag" hint="tiny label above heading">
              <Input
                value={slide.tag}
                onChange={e => set("tag", e.target.value)}
                placeholder="e.g. New Arrivals"
              />
            </Field>
            <Field label="Accent Colour">
              <AccentPicker value={slide.accent} onChange={v => set("accent", v)} />
            </Field>
          </div>

          <Field label="Heading" hint="\\n = line break">
            <Textarea
              value={slide.heading}
              onChange={e => set("heading", e.target.value)}
              placeholder={"Power your world.\nBuild your future."}
            />
          </Field>

          <Field label="Subtitle">
            <Textarea
              value={slide.sub}
              onChange={e => set("sub", e.target.value)}
              placeholder="Supporting description…"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="CTA Label">
              <Input
                value={slide.cta?.label ?? ""}
                onChange={e => setCta("label", e.target.value)}
                placeholder="Shop Now"
              />
            </Field>
            <Field label="CTA Link" hint="leave blank → use filter">
              <Input
                value={slide.cta?.href ?? ""}
                onChange={e => setCta("href", e.target.value || undefined)}
                placeholder="/calculator"
              />
            </Field>
          </div>

          {/* Filter preset — only shown when no hard href */}
          {!slide.cta?.href && (
            <Field label="Filter Preset (JSON)" hint="passed to setFilters()">
              <Input
                value={JSON.stringify(slide.cta?.filter ?? {})}
                onChange={e => {
                  try { setCta("filter", JSON.parse(e.target.value)); } catch {}
                }}
                placeholder='{"sort":"newest"}  or  {"is_featured":"true"}'
                className="font-mono text-[11px]"
              />
            </Field>
          )}

          <Field label="Background Gradient" hint="Tailwind bg-gradient classes">
            <Input
              value={slide.bg}
              onChange={e => set("bg", e.target.value)}
              className="font-mono text-[11px]"
              placeholder="from-[#0C0901] via-[#1a1200] to-[#2a1f00]"
            />
          </Field>

          {/* Banner image */}
          <Field label="Banner Image" hint="overrides gradient when set">
            <div className="relative h-32 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
              <EditableImage
                src={slide.image}
                alt={slide.tag}
                sectionId={`banner-slide-${slide.id}`}
                role={ROLE.HERO}
                onUrlChange={handleImageChange}
                className="w-full h-full object-cover"
                emptyLabel="Upload Banner Image"
              />
              {slide.image && (
                <button
                  onClick={() => set("image", null)}
                  title="Remove image"
                  className="absolute top-2 left-2 bg-white/90 p-1.5 rounded-full shadow
                    hover:bg-red-50 hover:text-red-500 text-gray-400 transition-colors"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </Field>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY ROW
// ─────────────────────────────────────────────────────────────────────────────

const CategoryRow = ({ cat, index, total, onChange, onDelete, onMove }) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  return (
    <div className="flex items-center gap-3 group px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
      <GripHorizontal size={14} className="text-gray-300 flex-shrink-0 cursor-grab" />

      {/* Position */}
      <span className="text-[10px] font-bold text-gray-300 w-5 text-center flex-shrink-0 tabular-nums">
        {index + 1}
      </span>

      {/* Slug badge (read-only) */}
      <span className="text-[11px] font-mono text-gray-400 bg-gray-100 px-2 py-1
        rounded-lg flex-shrink-0 min-w-[80px] max-w-[120px] truncate">
        {cat.slug}
      </span>

      {/* Label (inline-editable) */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={cat.label}
            onChange={e => onChange({ ...cat, label: e.target.value })}
            onBlur={() => setEditing(false)}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === "Escape") setEditing(false);
            }}
            placeholder="Display label (blank = auto)"
            className="w-full text-[13px] font-semibold text-gray-800 bg-white
              border border-[#FFAA14] rounded-lg px-2.5 py-1
              focus:outline-none focus:ring-2 focus:ring-[#FFAA14]/15"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-700
              hover:text-[#FFAA14] transition-colors w-full text-left group/lbl"
          >
            {cat.label
              ? cat.label
              : <span className="text-gray-300 italic text-[12px]">auto (click to rename)</span>
            }
            <Pencil
              size={11}
              className="text-gray-300 group-hover/lbl:text-[#FFAA14] transition-colors flex-shrink-0"
            />
          </button>
        )}
      </div>

      {/* Reorder + delete (visible on row hover) */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={() => onMove(index, index - 1)}
          disabled={index === 0}
          className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-25 transition-colors"
          title="Move up"
        >
          <ChevronUp size={12} />
        </button>
        <button
          onClick={() => onMove(index, index + 1)}
          disabled={index === total - 1}
          className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-25 transition-colors"
          title="Move down"
        >
          <ChevronDown size={12} />
        </button>
        <button
          onClick={() => onDelete(cat.slug)}
          title="Remove from config"
          className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-300 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES EDITOR
// ─────────────────────────────────────────────────────────────────────────────

const CategoriesEditor = ({ categories, onChange }) => {
  const [newSlug, setNewSlug] = useState("");

  const add = () => {
    const slug = newSlug.trim().toLowerCase().replace(/\s+/g, "-");
    if (!slug || categories.some(c => c.slug === slug)) return;
    onChange([...categories, { slug, label: "" }]);
    setNewSlug("");
  };

  const update = (updated) =>
    onChange(categories.map(c => c.slug === updated.slug ? updated : c));
  const remove = (slug) =>
    onChange(categories.filter(c => c.slug !== slug));
  const move = (from, to) =>
    onChange(moveArr(categories, from, to));

  return (
    <div className="space-y-1">
      {/* Column labels */}
      <div className="flex items-center gap-3 px-3 pb-1">
        <span className="w-4 flex-shrink-0" />
        <span className="w-5 flex-shrink-0" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300 min-w-[80px]">Slug</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300 flex-1">Display Label</span>
      </div>

      {categories.length === 0 && (
        <p className="text-[12px] text-gray-400 py-6 text-center">
          No categories configured — add slugs below to control order and labels.
        </p>
      )}

      {categories.map((cat, i) => (
        <CategoryRow
          key={cat.slug}
          cat={cat}
          index={i}
          total={categories.length}
          onChange={update}
          onDelete={remove}
          onMove={move}
        />
      ))}

      {/* Add new slug */}
      <div className="flex gap-2 pt-3 border-t border-gray-100 mt-2">
        <Input
          value={newSlug}
          onChange={e => setNewSlug(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
          placeholder="category-slug  (e.g. inverters)"
          className="text-[12px] font-mono"
        />
        <button
          onClick={add}
          disabled={!newSlug.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#FFAA14] hover:bg-amber-400
            text-black font-bold text-[12px] rounded-xl transition
            disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          <Plus size={13} />
          Add
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PRICE PRESETS EDITOR
// ─────────────────────────────────────────────────────────────────────────────

const PricePresetsEditor = ({ presets, onChange }) => {
  const add    = () => onChange([...presets, { _id: Date.now(), label: "", min: "", max: "" }]);
  const remove = (i) => onChange(presets.filter((_, idx) => idx !== i));
  const update = (i, key, val) =>
    onChange(presets.map((p, idx) => idx === i ? { ...p, [key]: val } : p));
  const move   = (from, to) => onChange(moveArr(presets, from, to));

  return (
    <div className="space-y-2">
      {/* Column headers */}
      <div className="grid grid-cols-[28px_1fr_96px_96px_36px] gap-2 px-1 mb-1">
        {["", "Label", "Min ₦", "Max ₦", ""].map((h, i) => (
          <p key={i} className="text-[10px] font-bold uppercase tracking-widest text-gray-300">{h}</p>
        ))}
      </div>

      {presets.map((p, i) => (
        <div
          key={p._id ?? i}
          className="grid grid-cols-[28px_1fr_96px_96px_36px] gap-2 items-center"
        >
          {/* Move arrows stacked */}
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => move(i, i - 1)}
              disabled={i === 0}
              className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-20 transition-colors"
            >
              <ChevronUp size={11} className="text-gray-400" />
            </button>
            <button
              onClick={() => move(i, i + 1)}
              disabled={i === presets.length - 1}
              className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-20 transition-colors"
            >
              <ChevronDown size={11} className="text-gray-400" />
            </button>
          </div>
          <Input value={p.label} onChange={e => update(i, "label", e.target.value)} placeholder="Under ₦500k" />
          <Input value={p.min}   onChange={e => update(i, "min",   e.target.value)} placeholder="0"      type="number" />
          <Input value={p.max}   onChange={e => update(i, "max",   e.target.value)} placeholder="500000" type="number" />
          <button
            onClick={() => remove(i)}
            className="p-2 rounded-xl hover:bg-red-50 hover:text-red-500 text-gray-300 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}

      <button
        onClick={add}
        className="flex items-center gap-2 text-[12px] font-semibold text-gray-400
          hover:text-[#FFAA14] transition-colors pt-1"
      >
        <Plus size={13} />
        Add price range
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SORT OPTIONS EDITOR
// ─────────────────────────────────────────────────────────────────────────────

const SortOptionsEditor = ({ options, onChange }) => {
  const update = (i, label) =>
    onChange(options.map((o, idx) => idx === i ? { ...o, label } : o));

  return (
    <div className="space-y-2">
      {options.map((opt, i) => (
        <div key={opt.value} className="grid grid-cols-[120px_1fr] gap-3 items-center">
          <span className="text-[11px] font-mono text-gray-400 bg-gray-50
            border border-gray-100 px-2.5 py-2 rounded-lg truncate">
            {opt.value || "(default)"}
          </span>
          <Input
            value={opt.label}
            onChange={e => update(i, e.target.value)}
            placeholder="Display label"
          />
        </div>
      ))}
      <p className="text-[10px] text-gray-300 pt-1">
        Sort keys are fixed by the backend API — only display labels are editable here.
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STORE METADATA EDITOR
// ─────────────────────────────────────────────────────────────────────────────

const MetaEditor = ({ meta, onChange }) => {
  const set = (k, v) => onChange({ ...meta, [k]: v });
  return (
    <div className="space-y-5">
      <Field label="Grid Heading" hint="above product grid">
        <Input
          value={meta.heading ?? ""}
          onChange={e => set("heading", e.target.value)}
          placeholder="All Products"
        />
      </Field>

      <div className="pt-3 border-t border-gray-100">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">
          Sidebar Help Card
        </p>
        <div className="space-y-4">
          <Field label="Heading">
            <Input
              value={meta.helpHeading ?? ""}
              onChange={e => set("helpHeading", e.target.value)}
              placeholder="Find your solar setup"
            />
          </Field>
          <Field label="CTA Label">
            <Input
              value={meta.helpCta ?? ""}
              onChange={e => set("helpCta", e.target.value)}
              placeholder="Use Solar Calculator"
            />
          </Field>
          <Field label="CTA Link">
            <Input
              value={meta.helpLink ?? ""}
              onChange={e => set("helpLink", e.target.value)}
              placeholder="/calculator"
            />
          </Field>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TABS CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "banner",     label: "Banner Slides", icon: ImageIcon         },
  { id: "categories", label: "Categories",    icon: LayoutGrid        },
  { id: "price",      label: "Price Presets", icon: SlidersHorizontal },
  { id: "sort",       label: "Sort Options",  icon: ArrowUpDown       },
  { id: "meta",       label: "Metadata",      icon: Tag               },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EDITOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{
 *   initialData : {
 *     slides       : object[],
 *     categories   : { slug: string, label: string }[],
 *     pricePresets : { label: string, min: string, max: string }[],
 *     sortOptions  : { value: string, label: string }[],
 *     meta         : object,
 *   },
 *   onSave : (config: object) => Promise<void>,
 * }} props
 */
const StorePageEditor = ({ initialData, onSave }) => {
  const [slides,       setSlides]       = useState(() => initialData?.slides       ?? []);
  const [categories,   setCategories]   = useState(() => initialData?.categories   ?? []);
  const [pricePresets, setPricePresets] = useState(() => initialData?.pricePresets ?? []);
  const [sortOptions,  setSortOptions]  = useState(() => initialData?.sortOptions  ?? []);
  const [meta,         setMeta]         = useState(() => initialData?.meta         ?? {});

  const [activeTab,  setActiveTab]  = useState("banner");
  const [saving,     setSaving]     = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [toast,      setToast]      = useState(null);
  const [preview,    setPreview]    = useState(false);

  // Mark dirty after first mount
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    setHasChanges(true);
  }, [slides, categories, pricePresets, sortOptions, meta]);

  // ── Slide mutations ──────────────────────────────────────────────────────
  const addSlide    = () => setSlides(p => [...p, DEFAULT_SLIDE()]);
  const deleteSlide = (id) => setSlides(p => p.filter(s => s.id !== id));
  const updateSlide = useCallback(
    (updated) => setSlides(p => p.map(s => s.id === updated.id ? updated : s)),
    []
  );
  const moveSlide = (from, to) => setSlides(p => moveArr(p, from, to));

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ slides, categories, pricePresets, sortOptions, meta });
      setHasChanges(false);
      setToast({ message: "Store page published!", type: "success" });
    } catch {
      setToast({ message: "Save failed — please try again.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // ── Reset ────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setSlides(initialData?.slides       ?? []);
    setCategories(initialData?.categories   ?? []);
    setPricePresets(initialData?.pricePresets ?? []);
    setSortOptions(initialData?.sortOptions  ?? []);
    setMeta(initialData?.meta         ?? {});
    setHasChanges(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8F8F8] font-sans">
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(10px) scale(.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1);   }
        }
      `}</style>

      {/* ── Sticky toolbar ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center gap-4 px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FFAA14] rounded-xl flex items-center justify-center flex-shrink-0">
              <LayoutGrid size={15} className="text-black" />
            </div>
            <div className="leading-none">
              <p className="text-[13px] font-black text-gray-900">Store Page Editor</p>
              <p className="text-[10px] mt-0.5" aria-live="polite">
                {hasChanges
                  ? <span className="text-amber-500 font-semibold">● Unsaved changes</span>
                  : <span className="text-emerald-500 font-semibold">✓ All saved</span>
                }
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleReset}
              disabled={!hasChanges}
              title="Discard all unsaved changes"
              className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-500
                hover:text-black px-3 py-2 rounded-xl hover:bg-gray-100 transition
                disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <RefreshCw size={13} />
              Reset
            </button>
            <button
              onClick={() => setPreview(p => !p)}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-600
                px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition"
            >
              {preview ? <EyeOff size={13} /> : <Eye size={13} />}
              {preview ? "Edit" : "Preview"}
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`flex items-center gap-1.5 text-[12px] font-bold px-5 py-2 rounded-xl transition
                ${hasChanges && !saving
                  ? "bg-[#FFAA14] text-black hover:bg-amber-400 shadow-md shadow-amber-100 hover:shadow-lg"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
            >
              <Save size={13} />
              {saving ? "Publishing…" : "Publish"}
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Preview banner */}
        {preview && (
          <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200
            text-amber-800 rounded-2xl px-5 py-3.5 text-[12px] font-semibold">
            <Eye size={14} />
            Preview mode — edits still save normally.
            <button onClick={() => setPreview(false)} className="ml-auto underline font-bold">
              Exit
            </button>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 bg-white border border-gray-100 shadow-sm
          p-1 rounded-2xl mb-8 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold
                  whitespace-nowrap transition-all flex-shrink-0
                  ${active
                    ? "bg-[#FFAA14] text-black shadow-sm"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  }`}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── BANNER SLIDES ────────────────────────────────────────────── */}
        {activeTab === "banner" && (
          <section className="space-y-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="text-[17px] font-black text-gray-900">Banner Slides</h2>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  {slides.length} slide{slides.length !== 1 ? "s" : ""}
                  {" · "}arrows to reorder · auto-advances every 5 s on the live store
                </p>
              </div>
              <button
                onClick={addSlide}
                className="flex items-center gap-2 bg-[#FFAA14] hover:bg-amber-400 text-black
                  font-bold text-[12px] px-4 py-2.5 rounded-xl transition shadow-sm flex-shrink-0"
              >
                <Plus size={14} />
                Add Slide
              </button>
            </div>

            {slides.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-gray-200
                rounded-2xl bg-white">
                <ImageIcon size={28} className="text-gray-200 mx-auto mb-3" />
                <p className="text-[13px] font-semibold text-gray-400 mb-4">No slides yet</p>
                <button onClick={addSlide} className="text-[12px] text-[#FFAA14] font-bold underline">
                  Add your first slide
                </button>
              </div>
            ) : (
              slides.map((slide, i) => (
                <SlideEditorPanel
                  key={slide.id}
                  slide={slide}
                  index={i}
                  total={slides.length}
                  onChange={updateSlide}
                  onDelete={deleteSlide}
                  onMove={moveSlide}
                />
              ))
            )}
          </section>
        )}

        {/* ── CATEGORIES ───────────────────────────────────────────────── */}
        {activeTab === "categories" && (
          <section>
            <div className="mb-6">
              <h2 className="text-[17px] font-black text-gray-900">Categories</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">
                Control display order and rename labels in the store sidebar.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <CategoriesEditor categories={categories} onChange={setCategories} />
            </div>

            <div className="mt-4">
              <InfoBox>
                <strong>How it works:</strong> The store sidebar always reflects all categories
                that exist on your products. This config lets you:
                <ul className="list-disc ml-4 mt-1.5 space-y-1">
                  <li>
                    <strong>Reorder</strong> — configured slugs appear first (in your order),
                    then any unconfigured ones alphabetically.
                  </li>
                  <li>
                    <strong>Rename</strong> — click a label to edit it. Leave blank to
                    auto-capitalise the slug (e.g. <code className="font-mono bg-amber-100 px-1 rounded text-[11px]">solar-panels</code> → "Solar Panels").
                  </li>
                  <li>
                    <strong>Remove from config</strong> — the category will still appear in the
                    sidebar from products; it just won't have a custom order or label.
                  </li>
                </ul>
              </InfoBox>
            </div>
          </section>
        )}

        {/* ── PRICE PRESETS ────────────────────────────────────────────── */}
        {activeTab === "price" && (
          <section>
            <div className="mb-6">
              <h2 className="text-[17px] font-black text-gray-900">Price Presets</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">
                Quick-select price ranges shown in the store's sidebar filter.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <PricePresetsEditor presets={pricePresets} onChange={setPricePresets} />
            </div>
            <div className="mt-4">
              <InfoBox>
                Leave <strong>Min</strong> blank for "no lower bound" and{" "}
                <strong>Max</strong> blank for "no upper bound" — shown as ₦0 or ∞ in the store.
              </InfoBox>
            </div>
          </section>
        )}

        {/* ── SORT OPTIONS ─────────────────────────────────────────────── */}
        {activeTab === "sort" && (
          <section>
            <div className="mb-6">
              <h2 className="text-[17px] font-black text-gray-900">Sort Options</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">
                Edit display labels for each sort mode in the store dropdown.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SortOptionsEditor options={sortOptions} onChange={setSortOptions} />
            </div>
          </section>
        )}

        {/* ── METADATA ─────────────────────────────────────────────────── */}
        {activeTab === "meta" && (
          <section>
            <div className="mb-6">
              <h2 className="text-[17px] font-black text-gray-900">Store Metadata</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">
                Text copy used in the store UI outside of product cards.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <MetaEditor meta={meta} onChange={setMeta} />
            </div>
          </section>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default StorePageEditor;