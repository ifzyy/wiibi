import { useNavigate } from "react-router-dom";
import WiibiLogo from "../../assets/wiibi-logo.svg";

// ─────────────────────────────────────────────────────────────────────────────
// Header
//
// Fixed across the full width, sits above sidebar + main.
// Height: 56px (h-14).
//
// Layout:
//   [☰ Wiibi Energy]   [breadcrumb]   [Store · View Live Site]
//
// Props:
//   breadcrumb   string   — current section name, e.g. "Inventory"
//   hasChanges   boolean  — show Save button when true
//   onSave       fn       — save callback
//   onPreview    fn       — opens live site in new tab
// ─────────────────────────────────────────────────────────────────────────────
const Header = ({ breadcrumb, hasChanges, onSave, onPreview }) => {
  const navigate = useNavigate();

  return (
    <header style={{
      height: 56,
      flexShrink: 0,
      background: "#ffffff",
      borderBottom: "1px solid #F0F0EE",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      zIndex: 50,
      position: "relative",          // stays in flow, AdminDashboard handles sticking
    }}>

      {/* ── Left: logo ── */}
      <a
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          textDecoration: "none",
          flexShrink: 0,
          minWidth: 160,
        }}
      >
        <img src={WiibiLogo} alt="Wiibi Logo" style={{ width: 28, height: 28 }} />
        <span style={{
          fontWeight: 800,
          fontSize: 15,
          color: "#1A1102",
          letterSpacing: "-0.02em",
        }}>
          Wiibi Energy
        </span>
      </a>

      {/* ── Center: breadcrumb ── */}
      <div style={{
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}>
        {breadcrumb && (
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#1A1102",
            letterSpacing: "-0.01em",
          }}>
            {breadcrumb}
          </span>
        )}
      </div>

      {/* ── Right: actions ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexShrink: 0,
        minWidth: 160,
        justifyContent: "flex-end",
      }}>
        {hasChanges && onSave && (
          <button
            onClick={onSave}
            style={{
              padding: "6px 14px",
              background: "#FFAA14",
              color: "#1A1102",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Save changes
          </button>
        )}

        <a
          href="/store"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#606060",
            textDecoration: "none",
            padding: "6px 10px",
            borderRadius: 8,
            transition: "color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#FFAA14"}
          onMouseLeave={e => e.currentTarget.style.color = "#606060"}
        >
          Store
        </a>

        <button
          onClick={onPreview ?? (() => window.open("/", "_blank"))}
          style={{
            padding: "6px 14px",
            background: "#1A1102",
            color: "#ffffff",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          View Live Site
        </button>
      </div>
    </header>
  );
};

export default Header;