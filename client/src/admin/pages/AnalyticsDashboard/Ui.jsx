/**
 * Shared primitives for all new admin modules.
 * Mirrors the OMS Ui.jsx pattern — inline styles, no external lib.
 */
import { C, STATUS_COLORS } from './constants.js';

/* ── Badge ─────────────────────────────────────────────────────────────── */
export const Badge = ({ label, status }) => {
  const colours = STATUS_COLORS[status] ?? { bg: C.border, text: C.inkMid };
  return (
    <span style={{
      display:      'inline-flex', alignItems: 'center',
      padding:      '2px 8px',
      borderRadius: '99px',
      fontSize:     11, fontWeight: 700, letterSpacing: '0.02em',
      background:   colours.bg, color: colours.text,
      textTransform: 'capitalize', whiteSpace: 'nowrap',
    }}>
      {label ?? status ?? '—'}
    </span>
  );
};

/* ── Page shell — matches the ProductCatalog page layout ───────────────── */
/* White full-width header band (big title + actions) over a constrained,
   evenly-gapped body. Use these in every admin module so all pages share
   the Inventory page's look. */
export const PageHeader = ({ title, subtitle, actions }) => (
  <header style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '28px 40px 20px' }}>
    <div style={{
      maxWidth: 1280, margin: '0 auto',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 16,
    }}>
      <div>
        <h1 style={{ color: C.ink, fontWeight: 800, fontSize: 32, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ color: C.inkMid, fontSize: 13, margin: '5px 0 0', fontWeight: 400 }}>{subtitle}</p>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, paddingTop: 4, flexWrap: 'wrap' }}>
          {actions}
        </div>
      )}
    </div>
  </header>
);

export const PageBody = ({ children }) => (
  <main style={{
    maxWidth: 1280, margin: '0 auto', padding: '28px 40px 60px',
    display: 'flex', flexDirection: 'column', gap: 20,
  }}>
    {children}
  </main>
);

/* ── Stat card — ProductCatalog card style ─────────────────────────────── */
export const StatCard = ({ label, value, sub, accent, loading }) => (
  <div style={{
    background: C.surface, borderRadius: 14, padding: '22px 24px 20px',
    border: `1px solid ${C.border}`, flex: 1, minWidth: 0, minHeight: 116,
    display: 'flex', flexDirection: 'column', gap: 6,
  }}>
    <div style={{ fontSize: 11, fontWeight: 500, color: C.inkFaint, letterSpacing: '0.01em', display: 'flex', alignItems: 'center', gap: 6 }}>
      {accent && <span style={{ width: 7, height: 7, borderRadius: '50%', background: accent, flexShrink: 0 }} />}
      {label}
    </div>
    {loading
      ? <div style={{ height: 32, width: '60%', background: C.border, borderRadius: 6, animation: 'pulse 1.4s ease-in-out infinite' }} />
      : <div style={{ fontSize: 32, fontWeight: 800, color: C.ink, letterSpacing: '-0.04em', lineHeight: 1.05 }}>{value}</div>
    }
    {sub && !loading && (
      <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 2 }}>{sub}</div>
    )}
  </div>
);

/* ── Icon button ───────────────────────────────────────────────────────── */
export const IBtn = ({ onClick, disabled, title, children, variant = 'default', style: extra }) => {
  const base = {
    default: { background: C.surface, color: C.inkMid, border: `1px solid ${C.border}` },
    primary: { background: C.amber,   color: C.ink,    border: 'none' },
    danger:  { background: C.redBg,   color: C.red,    border: `1px solid ${C.red}` },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: 6, padding: '8px 14px', borderRadius: 10,
        fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, transition: 'opacity 0.15s',
        fontFamily: C.font,
        ...base[variant],
        ...extra,
      }}
    >
      {children}
    </button>
  );
};

/* ── Filter pill ───────────────────────────────────────────────────────── */
export const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{
    padding:      '5px 14px', borderRadius: '99px',
    fontSize:     12, fontWeight: 700, cursor: 'pointer',
    border:       active ? 'none' : `1px solid ${C.border}`,
    background:   active ? C.amber   : C.surface,
    color:        active ? C.ink     : C.inkMid,
    transition:   'all 0.15s', fontFamily: C.font,
  }}>
    {label}
  </button>
);

/* ── Search input ──────────────────────────────────────────────────────── */
export const SearchInput = ({ value, onChange, placeholder = 'Search…' }) => (
  <div style={{ position: 'relative', flexShrink: 0 }}>
    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: C.inkFaint }}>
      🔍
    </span>
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
        border: `1px solid ${C.border}`, borderRadius: C.rSm,
        fontSize: 13, color: C.ink, background: C.surface,
        outline: 'none', width: 220, fontFamily: C.font,
      }}
    />
  </div>
);

/* ── Empty state ───────────────────────────────────────────────────────── */
export const Empty = ({ icon = '📭', message = 'No results found' }) => (
  <div style={{ padding: '60px 20px', textAlign: 'center', color: C.inkMid }}>
    <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontSize: 14, fontWeight: 600 }}>{message}</div>
  </div>
);

/* ── Skeleton row ──────────────────────────────────────────────────────── */
export const SkeletonRows = ({ cols = 6, rows = 5 }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i}>
        {Array.from({ length: cols }).map((_, j) => (
          <td key={j} style={{ padding: '14px 16px' }}>
            <div style={{ height: 14, background: C.border, borderRadius: 4, animation: 'pulse 1.4s ease-in-out infinite', width: j === 0 ? '80%' : '60%' }} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

/* ── Table wrapper ─────────────────────────────────────────────────────── */
export const Table = ({ children }) => (
  <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: C.font }}>
        {children}
      </table>
    </div>
  </div>
);

export const TH = ({ children, style: extra }) => (
  <th style={{
    padding: '11px 16px', textAlign: 'left',
    fontSize: 11, fontWeight: 700, color: C.inkMid,
    textTransform: 'uppercase', letterSpacing: '0.06em',
    background: C.bg, borderBottom: `1px solid ${C.border}`,
    whiteSpace: 'nowrap', ...extra,
  }}>
    {children}
  </th>
);

export const TD = ({ children, style: extra }) => (
  <td style={{ padding: '13px 16px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'middle', ...extra }}>
    {children}
  </td>
);

/* ── Drawer shell ──────────────────────────────────────────────────────── */
export const DrawerShell = ({ open, onClose, width = 520, children }) => {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200,
        animation: 'fadeIn 0.18s ease',
      }} />
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width,
        background: C.surface, boxShadow: '-8px 0 40px rgba(0,0,0,0.14)',
        zIndex: 201, display: 'flex', flexDirection: 'column',
        animation: 'slideLeft 0.22s cubic-bezier(0.22,1,0.36,1)',
        fontFamily: C.font,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: C.ink }}>
            {children[0]}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.inkMid, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {children[1]}
        </div>
        {children[2] && (
          <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
            {children[2]}
          </div>
        )}
      </div>
    </>
  );
};

/* ── Toast ─────────────────────────────────────────────────────────────── */
export const Toast = ({ msg, type = 'success' }) => (
  <div style={{
    position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
    background: type === 'success' ? C.green : C.red,
    color: '#fff', padding: '10px 18px', borderRadius: C.r,
    fontWeight: 700, fontSize: 13, boxShadow: C.shadowMd,
    animation: 'slideUp 0.22s ease', fontFamily: C.font,
  }}>
    {type === 'success' ? '✓ ' : '✗ '}{msg}
  </div>
);

/* ── Section divider label ─────────────────────────────────────────────── */
export const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, marginTop: 24 }}>
    {children}
  </div>
);

/* ── Global animations injected once ───────────────────────────────────── */
export const GlobalStyles = () => (
  <style>{`
    @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.45} }
    @keyframes slideUp  { from{transform:translateY(8px);opacity:0} to{transform:translateY(0);opacity:1} }
    @keyframes slideLeft{ from{transform:translateX(40px);opacity:0} to{transform:translateX(0);opacity:1} }
    @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
    * { box-sizing: border-box; }
    input:focus, textarea:focus, select:focus {
      border-color: #FFAA14 !important;
      outline: none;
      box-shadow: 0 0 0 3px rgba(255,170,20,0.12);
    }
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-thumb { background: #E8E8E0; border-radius: 4px; }
  `}</style>
);