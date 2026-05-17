import { useState } from "react";
import { Icon, I } from "../utils/icons.jsx";
import { NAV_SECTIONS } from "../utils/api.js";

export const Sidebar = ({
  activeNav,
  setActiveNav,
  onLogout,
  onPreview,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      style={{
        width: collapsed ? 60 : 200,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
        borderRight: "1px solid #F0F0EE",
        // ✅ h-full not h-screen — fills the flex row below the header only
        height: "100%",
        overflow: "hidden",
        transition: "width 0.25s ease",
      }}
    >
      {/* Menu label */}
      {!collapsed && (
        <div style={{ flexShrink: 0, padding: "18px 20px 8px" }}>
          <p style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#9ca3af",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            margin: 0,
          }}>
            Menu
          </p>
        </div>
      )}

      {/* Nav items */}
      <nav style={{
        flex: 1,
        overflowY: "auto",
        padding: "8px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}>
        {NAV_SECTIONS.map((item) => {
          const isActive = activeNav === item.id;
          const label = item.id === "pages" ? "Page Editor" : item.label;

          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              title={collapsed ? label : ""}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: collapsed ? "10px 0" : "9px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                background: isActive ? "#F3F3F1" : "transparent",
                color: isActive ? "#1A1102" : "#6b7280",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                textAlign: "left",
                transition: "background 0.12s, color 0.12s",
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "#F9F9F7"; e.currentTarget.style.color = "#1A1102"; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6b7280"; }}}
            >
              <Icon
                d={I[item.icon]}
                size={16}
                strokeWidth={isActive ? 2 : 1.75}
                style={{ flexShrink: 0, color: isActive ? "#1A1102" : "#9ca3af" }}
              />
              {!collapsed && <span style={{ flex: 1 }}>{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div style={{
        flexShrink: 0,
        padding: "8px 10px 12px",
        borderTop: "1px solid #F0F0EE",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}>
        <button
          onClick={onPreview}
          title={collapsed ? "View Live Site" : ""}
          style={{
            width: "100%", display: "flex", alignItems: "center",
            gap: 10, padding: collapsed ? "8px 0" : "8px 12px",
            justifyContent: collapsed ? "center" : "flex-start",
            borderRadius: 8, border: "none", cursor: "pointer",
            background: "transparent", color: "#9ca3af",
            fontFamily: "inherit", fontSize: 12, fontWeight: 500,
            transition: "background 0.12s, color 0.12s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#F9F9F7"; e.currentTarget.style.color = "#6b7280"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9ca3af"; }}
        >
          <Icon d={I.externalLink} size={14} strokeWidth={1.75} style={{ flexShrink: 0 }} />
          {!collapsed && <span>View Live Site</span>}
        </button>

        <button
          onClick={() => setCollapsed(o => !o)}
          title={collapsed ? "Expand" : "Collapse"}
          style={{
            width: "100%", display: "flex", alignItems: "center",
            gap: 10, padding: collapsed ? "8px 0" : "8px 12px",
            justifyContent: collapsed ? "center" : "flex-start",
            borderRadius: 8, border: "none", cursor: "pointer",
            background: "transparent", color: "#9ca3af",
            fontFamily: "inherit", fontSize: 12, fontWeight: 500,
            transition: "background 0.12s, color 0.12s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#F9F9F7"; e.currentTarget.style.color = "#6b7280"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9ca3af"; }}
        >
          <Icon d={collapsed ? I.chevronRight : I.chevronLeft} size={14} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Collapse</span>}
        </button>

        <button
          onClick={onLogout}
          title={collapsed ? "Exit" : ""}
          style={{
            width: "100%", display: "flex", alignItems: "center",
            gap: 10, padding: collapsed ? "9px 0" : "9px 12px",
            justifyContent: collapsed ? "center" : "flex-start",
            borderRadius: 8, border: "none", cursor: "pointer",
            background: "transparent", color: "#f87171",
            fontFamily: "inherit", fontSize: 13, fontWeight: 600,
            transition: "background 0.12s, color 0.12s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >
          <Icon d={I.logout} size={16} strokeWidth={1.75} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Exit</span>}
        </button>
      </div>
    </aside>
  );
};