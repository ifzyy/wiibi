// =============================================================================
// drawerConstants.js
//
// Single source of truth for:
//   • Design tokens  (C, R)
//   • Form shape     (BLANK_FORM, step definitions, limits)
//   • Shared React primitives  (FieldLabel, StepHeader, Stepper, Toggle,
//                               UploadZone, FileRow, AddButton, TagChip)
//
// Imported by: DrawerTabs.jsx  |  ProductDrawer.jsx  |  useProductSubmit.js
// =============================================================================

import React, { useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────
export const C = {
  // Brand
  amber:       "#F5A623",
  amberHover:  "#E09510",
  amberLight:  "#FFF8EC",
  amberBorder: "#F5C96A",
  amberText:   "#7A4F00",
  text: "#000000",

  // Neutrals
  ink:         "#18140C",
  white:       "#FFFFFF",
  offWhite:    "#FAFAF8",
  surface:     "#F2F1EE",
  border:      "#E3E0D8",
  borderMid:   "#CACAC0",
  muted:       "#A09A8E",
  secondary:   "#5C5650",
  background: "#F9F9F9",
  secondaryBackground: "#F2F2F2",

  // Semantic
  danger:      "#C8311F",
  dangerBg:    "#FEF1EF",
  dangerBorder:"#F5C4BE",
};

export const R = { sm: 6, md: 9, lg: 12, xl: 16 };

// ─────────────────────────────────────────────────────────────────────────────
// Step definitions
// ─────────────────────────────────────────────────────────────────────────────
export const STEPS_SINGLE = [
  { id: "general",     label: "General"              },
  { id: "content",     label: "Content"              },  // was "description"
  { id: "specs",       label: "System Specification" },
];

export const STEPS_PACKAGE = [
  { id: "general",     label: "General"              },
  { id: "content",     label: "Content"              },
  { id: "specs",       label: "System Specification" },
  { id: "components",  label: "Component List"       },
    { id: "compatibility", label: "Compatibility"        },
];
// ─────────────────────────────────────────────────────────────────────────────
// Blank form
// ─────────────────────────────────────────────────────────────────────────────
export const BLANK_FORM = {
  // ── Core identity ────────────────────────────────────────────────────
  listing_type:      "Single",  // "Single" | "Package" → stored lowercase
  name:              "",
  category:          "",        // NOT NULL in DB — required
  brand:             "",
  sku:               "",

  // ── Pricing & stock ──────────────────────────────────────────────────
  price:             "",
  sale_price:        "",        // optional
  stock:             0,
  delivery_fee:      "",        // optional — "" = use global default fee

  // ── Flags ────────────────────────────────────────────────────────────
  is_visible:        true,
  is_featured:       false,

  // ── Content ──────────────────────────────────────────────────────────
  short_description: "",        // STRING(500) — shown on listing cards
  caption:           "",        // STRING(255) — marketing line on detail page
  description:       "",        // TEXT — full body, shown in Description tab

  // ── Taxonomy / warranty ──────────────────────────────────────────────
  tags:              [],        // JSON array — max 2
  warranty_enabled:  true,
  warranty:          1,         // integer years → serialised as warranty_duration
  powered_devices:   [],

  // ── Solar calculator matching ────────────────────────────────────────
  // "" = not a calculator component. When set, solar_specs shape depends
  // on the type: {kva} | {ah, chemistry} | {watts} | {ampere}
  solar_component_type: "",
  solar_specs:          {},

  // ── Specs → stored as specifications JSON [{label, value}] ──────────
  specs:             [{ title: "", info: "" }],

  // ── Package components ───────────────────────────────────────────────
  components:        [{ name: "", quantity: 1, brand: "", price: "", description: "", image: null, specs: [{ title: "", info: "" }] }],

  // ── Staged images (local File objects — zero uploads until Save) ─────
  // Shape: null | { type:"staged", file, preview } | { type:"existing", url, mediaId }
  main_image:        null,
  other_images:      [],
  marketing_images:  [],        // parallel index to specs[]
    compatibility: [],  // ← add this
};

export const MAX_IMAGES   = 6;   // 1 main + 5 gallery
export const MAX_TAGS     = 4;
export const MAX_CAPTIONS = 3;
export const MAX_SPECS    = 8;

export const ALL_TAGS = [
  "Solar", "BackUp Power", "Security", "Smart Devices", "Ev Related",
  "Lithium Battery", "Tubular Battery", "Solar Panels", "Charge Controllers",
  "Cables", "Inverter", "Breakers", "Distribution Box", "Accessories",
  "CCTV", "DVR/NVR", "Security Lights", "Alarm Systems", "Sensors",
  "Smart Socket", "Smart Breakers", "Smart Locks", "hot", "new"
];

// ─────────────────────────────────────────────────────────────────────────────
// Shared input style
// ─────────────────────────────────────────────────────────────────────────────
export const inputBase = {
  width:        "100%",
  padding:      "9px 12px",
  fontSize:      13,
  color:         C.ink,
  background:    C.secondaryBackground,
  outline:       "none",
  boxSizing:     "border-box",
  fontFamily:    "inherit",
  transition:    "border-color 0.15s",
};

// ─────────────────────────────────────────────────────────────────────────────
// Primitive components
// ─────────────────────────────────────────────────────────────────────────────

/** Allcaps field label with optional hint */
export const FieldLabel = ({ children, hint, required }) => (
  <div style={{ marginBottom: 5, display: "flex", alignItems: "baseline", gap: 5 }}>
    <span style={{ fontSize: 10.5, fontWeight: 700, color: C.secondary, textTransform: "uppercase", letterSpacing: "0.07em" }}>
      {children}
      {required && <span style={{ color: C.amber, marginLeft: 2 }}>*</span>}
    </span>
    {hint && <span style={{ fontSize: 10, color: C.muted }}>{hint}</span>}
  </div>
);

/** Step panel header — "Label   N of M" */
export const StepHeader = ({ label, step, total }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background:C.secondaryBackground, padding: 6, marginBottom: 20 }}>
    <span style={{ fontSize: 14, fontWeight: 800, color: C.ink, letterSpacing: "-0.02em" }}>{label}</span>
    <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, background: C.surface, padding: "3px 10px", borderRadius: 20 }}>
      {step} of {total}
    </span>
  </div>
);

/** Thin horizontal rule */
export const Divider = ({ gap = 16 }) => (
  <div style={{ height: 1, background: C.border, margin: `${gap}px 0` }} />
);

/** +/− quantity stepper */
export const Stepper = ({ value, onChange, min = 1 }) => (
  <div style={{ display: "inline-flex", alignItems: "center", border: `1.5px solid ${C.border}`, borderRadius: R.md, overflow: "hidden", background: C.white }}>
    <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
      style={{ width: 32, height: 34, background: C.surface, border: "none", cursor: "pointer", fontSize: 16, color: C.secondary, display: "flex", alignItems: "center", justifyContent: "center" }}>
      −
    </button>
    <span style={{ minWidth: 38, textAlign: "center", fontSize: 13, fontWeight: 700, color: C.ink, userSelect: "none" }}>
      {value}
    </span>
    <button type="button" onClick={() => onChange(value + 1)}
      style={{ width: 32, height: 34, background: C.surface, border: "none", cursor: "pointer", fontSize: 16, color: C.secondary, display: "flex", alignItems: "center", justifyContent: "center" }}>
      +
    </button>
  </div>
);

/** Amber pill toggle — with optional label + description */
export const Toggle = ({ checked, onChange, label, desc }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
    {(label || desc) && (
      <div>
        {label && <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.ink }}>{label}</p>}
        {desc  && <p style={{ margin: 0, fontSize: 11, color: C.muted, marginTop: 1 }}>{desc}</p>}
      </div>
    )}
    <div onClick={() => onChange(!checked)}
      style={{ width: 38, height: 22, borderRadius: 11, background: checked ? C.amber : C.border, cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: checked ? 19 : 3, width: 16, height: 16, borderRadius: "50%", background: C.white, transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.18)" }} />
    </div>
  </div>
);

/**
 * Drag-and-drop upload zone.
 * Stores files as local File objects — ZERO API calls here.
 * Upload happens in useProductSubmit.handleSubmit on Save.
 */


export const UploadZone = ({ onFiles, compact = false }) => {
  const ref = useRef();
  const [over, setOver] = useState(false);

  const handle = (raw) => {
    const imgs = Array.from(raw).filter(f => f.type.startsWith("image/"));
    if (imgs.length) onFiles(imgs);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files); }}
      onClick={() => ref.current?.click()}
      style={{
        // Layout & Spacing
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "14px",
        padding: compact ? "30px 15px" : "60px 40px",
        minHeight: compact ? "100px" : "180px",
        
        // Visuals
        backgroundColor: over ? "#f2f2f2" : "#f9f9fb",
        borderRadius: "12px",
        cursor: "pointer",
        textAlign: "center",
        transition: "background 0.2s ease",
        border: "none", // Based on the clean look in the image
      }}
    >
      <input 
        ref={ref} 
        type="file" 
        accept="image/*" 
        multiple 
        style={{ display: "none" }}
        onChange={(e) => handle(e.target.files)} 
      />

      {/* Upload Icon - Thicker and Darker */}
      <svg 
        width={28} 
        height={28} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="#333333" 
        strokeWidth="2.2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>

      {/* Text Styling */}
      <p style={{ 
        fontSize: "14px", 
        color: "#7d7a74", 
        margin: 0, 
        fontFamily: "Inter, system-ui, sans-serif",
        letterSpacing: "-0.01em"
      }}>
        Drop your files here or <span style={{ color: "#f9b233", fontWeight: "500" }}>browse</span>
      </p>
    </div>
  );
};
/** Compact file row — thumbnail + name + size + remove button */
export const FileRow = ({ file, preview, onRemove, uploading, uploaded }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 8px 6px 6px", background: C.white, border: `1.5px solid ${uploaded ? C.amberBorder : C.border}`, borderRadius: R.md, transition: "border-color 0.2s" }}>
    {/* Thumbnail */}
    {preview
      ? <img src={preview} alt="" style={{ width: 34, height: 34, borderRadius: R.sm, objectFit: "cover", flexShrink: 0 }} />
      : <div style={{ width: 34, height: 34, borderRadius: R.sm, background: C.surface, flexShrink: 0 }} />
    }
    {/* Meta */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {file?.name ?? "Image"}
      </p>
      <p style={{ margin: 0, fontSize: 10, color: uploading ? C.amber : uploaded ? C.amberText : C.muted }}>
        {uploading ? "Uploading…" : uploaded ? "✓ Uploaded" : file?.size ? `${Math.round(file.size / 1024)} kB` : ""}
      </p>
    </div>
    {/* Remove */}
    {!uploading && (
      <button type="button" onClick={onRemove}
        style={{ width: 26, height: 26, background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, borderRadius: R.sm, cursor: "pointer", color: C.danger, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6M9 6V4h6v2" />
        </svg>
      </button>
    )}
  </div>
);

/** Small dark circular + button */
export const AddButton = ({ onClick, small }) => (
  <button type="button" onClick={onClick}
    style={{ width: small ? 26 : 30, height: small ? 26 : 30, borderRadius: "50%", background: C.ink, border: "none", cursor: "pointer", color: C.white, fontSize: small ? 15 : 17, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    +
  </button>
);

/** Selected tag chip */
export const TagChip = ({ label, onRemove }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px 3px 11px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: C.amberLight, border: `1.5px solid ${C.amberBorder}`, color: C.amberText }}>
    {label}
    {onRemove && (
      <button type="button" onClick={onRemove}
        style={{ background: "none", border: "none", cursor: "pointer", color: C.amber, padding: 0, fontSize: 14, lineHeight: 1, display: "flex", alignItems: "center" }}>
        ×
      </button>
    )}
  </span>
);

/** Native select with filled triangle chevron */
export const SelectField = ({ value, onChange, options }) => (
  <div
    style={{
      position: "relative",
      display: "flex",
      alignItems: "center",
      background: "#f2f2f2",
      borderRadius: 8,
      border: "1px solid #e5e5e5",
      transition: "all 0.15s ease"
    }}
  >
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        ...inputBase,
        appearance: "none",
        border: "none",
        background: "transparent",
        width: "100%",
        paddingRight: 36,
        cursor: "pointer",
        fontWeight: 500
      }}
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>

    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill={C.secondary} // filled color
      style={{
        position: "absolute",
        right: 12,
        pointerEvents: "none"
      }}
    >
      <polygon points="0,0 12,0 6,6" /> {/* filled downward triangle */}
    </svg>
  </div>
);