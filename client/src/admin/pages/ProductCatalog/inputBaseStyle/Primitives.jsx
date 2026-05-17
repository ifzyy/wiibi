import React from "react";
import { COLORS, FONT_SIZE } from "../constants";
import { getStatusConfig } from "../utils";

// ─────────────────────────────────────────────────────────────────────────────
// Icon
// ─────────────────────────────────────────────────────────────────────────────
const ICON_PATHS = {
  plus:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />,
  save:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />,
  trash:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
  edit:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
  search:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
  x:       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />,
  check:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />,
  refresh: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
  star:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />,
  eye:     (<><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>),
  eyeOff:  (<><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></>),
  upload:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />,
  link:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />,
  grid:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />,
  image:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />,
};

export const Icon = React.memo(({ name, size = 16, style = {}, className = "" }) => (
  <svg
    width={size} height={size}
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    style={style} className={className}
    aria-hidden="true"
  >
    {ICON_PATHS[name]}
  </svg>
));
Icon.displayName = "Icon";

// ─────────────────────────────────────────────────────────────────────────────
// Spinner
// ─────────────────────────────────────────────────────────────────────────────
export const Spinner = React.memo(({ size = 14, color = COLORS.ink }) => (
  <div
    role="status"
    aria-label="Loading"
    className="animate-spin"
    style={{
      width: size, height: size,
      border: `2px solid ${color}`,
      borderTopColor: "transparent",
      borderRadius: "50%",
      flexShrink: 0,
    }}
  />
));
Spinner.displayName = "Spinner";

// ─────────────────────────────────────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────────────────────────────────────
export const StatusBadge = React.memo(({ stock, manualStatus }) => {
  const cfg = getStatusConfig(stock, manualStatus);
  return (
    <span
      role="status"
      style={{
        background: cfg.bg,
        color: cfg.text,
        border: `1px solid ${cfg.dot}50`,
        whiteSpace: "nowrap",
      }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
    >
      <span
        aria-hidden="true"
        style={{
          background: cfg.dot,
          width: 6, height: 6,
          borderRadius: "50%",
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  );
});
StatusBadge.displayName = "StatusBadge";

// ─────────────────────────────────────────────────────────────────────────────
// Field — Label wrapper with optional hint
// ─────────────────────────────────────────────────────────────────────────────
export const Field = ({ label, required, children, hint, htmlFor }) => (
  <div>
    <label
      htmlFor={htmlFor}
      style={{
        color: COLORS.textSec,
        display: "block",
        fontSize: FONT_SIZE.xs,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        marginBottom: 6,
      }}
    >
      {label}
      {required && <span style={{ color: COLORS.danger, marginLeft: 2 }} aria-label="required">*</span>}
    </label>
    {children}
    {hint && (
      <p style={{ color: COLORS.textMuted, fontSize: FONT_SIZE.sm, marginTop: 4, marginBottom: 0 }}>
        {hint}
      </p>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SectionLabel — Left-accented section heading inside drawer
// ─────────────────────────────────────────────────────────────────────────────
export const SectionLabel = ({ title }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
    <span style={{ width: 3, height: 16, background: COLORS.amber, borderRadius: 2, display: "inline-block" }} aria-hidden="true" />
    <p style={{ color: COLORS.textSec, fontSize: FONT_SIZE.xs, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
      {title}
    </p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Toggle — Accessible checkbox styled as a toggle switch
// ─────────────────────────────────────────────────────────────────────────────
export const Toggle = ({ id, checked, onChange, label, desc }) => (
  <label htmlFor={id} style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
    {/* Hidden native checkbox for a11y */}
    <div style={{ position: "relative", flexShrink: 0, marginTop: 2 }}>
      <input
        id={id}
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        onChange={onChange}
        style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
      />
      <div style={{
        width: 40, height: 22,
        borderRadius: 11,
        background: checked ? COLORS.amber : COLORS.borderMid,
        transition: "background 0.2s",
      }} />
      <div style={{
        position: "absolute", top: 3,
        left: checked ? 21 : 3,
        width: 16, height: 16,
        borderRadius: "50%",
        background: COLORS.white,
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        transition: "left 0.2s",
      }} />
    </div>
    <div>
      <p style={{ color: COLORS.ink, fontSize: FONT_SIZE.md, fontWeight: 700, margin: 0 }}>{label}</p>
      <p style={{ color: COLORS.textMuted, fontSize: FONT_SIZE.sm, margin: "2px 0 0" }}>{desc}</p>
    </div>
  </label>
);

// ─────────────────────────────────────────────────────────────────────────────
// Shared input base style (used across text/number/select/textarea)
// ─────────────────────────────────────────────────────────────────────────────
export const inputBaseStyle = {
  width: "100%",
  padding: "10px 14px",
  border: `1.5px solid ${COLORS.border}`,
  borderRadius: 8,
  fontSize: FONT_SIZE.md,
  color: COLORS.ink,
  background: "#FAFAFA",
  outline: "none",
  transition: "border-color 0.15s",
  boxSizing: "border-box",
  fontFamily: "inherit",
};