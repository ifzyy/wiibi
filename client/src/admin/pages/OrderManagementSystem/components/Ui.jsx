import { C } from "../constants.js";

/* ─── Google font injection ───────────────────────────────────────────────── */
export const FontLink = () => (
  <link
    href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800;900&family=Geist+Mono:wght@400;500&display=swap"
    rel="stylesheet"
  />
);

/* ─── Skeleton loader ─────────────────────────────────────────────────────── */
export const Skeleton = ({ w = "100%", h = 14, r = 6 }) => (
  <div style={{
    width: w, height: h, borderRadius: r,
    background: "#F0EDE8",
    animation: "pulse 1.4s ease infinite",
  }} />
);

/* ─── Status badge ────────────────────────────────────────────────────────── */
export const Badge = ({ cfg }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "3px 10px", borderRadius: 99,
    border: `1.5px solid ${cfg?.ring ?? C.inkFaint}`,
    background: C.white,
    color: cfg?.ring ?? C.inkFaint,
    fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
  }}>
    <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg?.ring ?? C.inkFaint }} />
    {cfg?.label ?? "—"}
  </span>
);

/* ─── Avatar ──────────────────────────────────────────────────────────────── */
export const Avatar = ({ name = "?", size = 32 }) => {
  const shades  = [C.amber, "#D48A0A", C.ink, "#4A3800", "#7A5C00"];
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: shades[name.charCodeAt(0) % shades.length],
      color: "#fff", fontWeight: 800, fontSize: size * 0.36,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, letterSpacing: -0.5,
    }}>{initials}</div>
  );
};

/* ─── Section label ───────────────────────────────────────────────────────── */
export const SectionLabel = ({ children }) => (
  <p style={{
    margin: "0 0 8px", fontSize: 10, fontWeight: 800,
    color: C.inkFaint, textTransform: "uppercase", letterSpacing: 1,
  }}>{children}</p>
);

/* ─── Icon button ─────────────────────────────────────────────────────────── */
export const IBtn = ({ children, onClick, title, accent, disabled }) => (
  <button
    onClick={onClick}
    title={title}
    disabled={disabled}
    style={{
      width: 30, height: 30, borderRadius: 6,
      border:  accent ? `1.5px solid ${C.amber}` : `1px solid ${C.border}`,
      background: accent ? C.amberBg : C.white,
      color:   accent ? C.ink : C.inkMid,
      cursor:  disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      fontSize: 13,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}
  >{children}</button>
);

/* ─── Chip selector ───────────────────────────────────────────────────────── */
export const Chip = ({ label, ring, selected, onClick }) => (
  <button onClick={onClick} style={{
    padding: "8px 10px", borderRadius: 7, cursor: "pointer",
    border:  selected ? `2px solid ${ring}` : `1.5px solid ${C.border}`,
    background: selected ? C.amberBg : C.bg,
    color:   selected ? C.ink : C.inkMid,
    fontWeight: selected ? 700 : 500, fontSize: 12,
    display: "flex", alignItems: "center", gap: 6,
    transition: "all 0.1s",
  }}>
    <span style={{ width: 6, height: 6, borderRadius: "50%", background: selected ? ring : C.border }} />
    {label}
  </button>
);

/* ─── Text input ──────────────────────────────────────────────────────────── */
export const inputStyle = {
  width: "100%", padding: "9px 11px",
  border: `1px solid ${C.border}`, borderRadius: 7,
  fontSize: 13, outline: "none", boxSizing: "border-box",
  fontFamily: "Geist, sans-serif", color: C.ink, background: C.white,
};

export const Inp = (props) => <input {...props} style={inputStyle} />;

/* ─── Stat card ───────────────────────────────────────────────────────────── */
export const StatCard = ({ label, value, sub, primary, loading }) => (
  <div style={{
    background: primary ? C.ink : C.white,
    border:     primary ? "none" : `1px solid ${C.border}`,
    borderRadius: 10, padding: "18px 20px", flex: 1, minWidth: 140,
  }}>
    <p style={{ margin: 0, fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: C.inkFaint }}>{label}</p>
    <div style={{ margin: "8px 0 4px" }}>
      {loading
        ? <Skeleton w={80} h={24} />
        : <p style={{ margin: 0, fontSize: 24, fontWeight: 900, color: primary ? C.white : C.ink, letterSpacing: -0.5 }}>{value}</p>
      }
    </div>
    {sub && <p style={{ margin: 0, fontSize: 12, color: primary ? C.inkMid : C.inkFaint }}>{sub}</p>}
  </div>
);

/* ─── Toast notification ──────────────────────────────────────────────────── */
export const Toast = ({ msg, type = "success" }) => (
  <div style={{
    position: "fixed", bottom: 24, right: 24, zIndex: 9999,
    background: type === "error" ? "#2C0A0A" : C.ink,
    color: C.white, padding: "12px 18px", borderRadius: 10,
    fontSize: 13, fontWeight: 600,
    display: "flex", alignItems: "center", gap: 8,
    boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
    animation: "slideUp 0.2s ease",
  }}>
    <span style={{ color: type === "error" ? "#FF6B6B" : C.amber }}>
      {type === "error" ? "✕" : "✓"}
    </span>
    {msg}
  </div>
);

/* ─── Section divider ─────────────────────────────────────────────────────── */
export const Divider = ({ dashed }) => (
  <div style={{
    height: 1,
    background: dashed ? "none" : C.border,
    borderTop:  dashed ? `1px dashed ${C.border}` : "none",
  }} />
);

/* ─── Sort indicator ──────────────────────────────────────────────────────── */
export const SortIcon = ({ active, dir }) => (
  <span style={{ color: active ? C.amber : C.border, marginLeft: 3 }}>
    {active ? (dir === "asc" ? "↑" : "↓") : "↕"}
  </span>
);

/* ─── Empty state ─────────────────────────────────────────────────────────── */
export const EmptyState = ({ message = "No results found" }) => (
  <div style={{ padding: 56, textAlign: "center" }}>
    <p style={{ margin: "0 0 6px", fontSize: 28, color: C.border }}>◫</p>
    <p style={{ margin: 0, fontSize: 13, color: C.inkFaint }}>{message}</p>
  </div>
);

/* ─── Error banner ────────────────────────────────────────────────────────── */
export const ErrorBanner = ({ message, onRetry }) => (
  <div style={{
    padding: "12px 16px", marginBottom: 16,
    background: "#FDF0EF", border: "1px solid #F5C6C2",
    borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center",
  }}>
    <p style={{ margin: 0, fontSize: 13, color: "#C0392B" }}>{message}</p>
    {onRetry && (
      <button onClick={onRetry} style={{
        padding: "6px 14px", borderRadius: 6, border: "none",
        background: "#C0392B", color: "#fff", fontWeight: 700,
        cursor: "pointer", fontSize: 12,
      }}>Retry</button>
    )}
  </div>
);

/* ─── Drawer section wrapper ──────────────────────────────────────────────── */
export const DrawerSection = ({ title, children }) => (
  <div>
    <SectionLabel>{title}</SectionLabel>
    {children}
  </div>
);

/* ─── Key-value row ───────────────────────────────────────────────────────── */
export const KVRow = ({ label, value, bold }) => (
  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
    <span style={{ fontSize: 13, color: C.inkMid }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: bold ? 800 : 500, color: C.ink }}>{value}</span>
  </div>
);