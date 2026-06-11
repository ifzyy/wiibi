/**
 * Sidebar.jsx — grouped nav, live badges, no collapse animation jank.
 *
 * Changes from old version:
 *  - Nav items grouped into 4 sections (Overview / Store / Content / Support)
 *  - Badges on Orders and Support show live counts from props
 *  - Removed collapse toggle — sidebar is always full width (220px)
 *    Collapsing caused layout reflow that made main content jump.
 *    If you need mobile support later, use a drawer overlay instead.
 *  - No inline onMouseEnter/Leave style mutations — uses a CSS class approach
 *    via a <style> tag so hover states are smooth and don't fight React renders.
 *  - Active item has a left border accent instead of a background fill —
 *    cleaner, doesn't clash with the group label colour.
 */

import { Icon, I } from "../utils/icons.jsx";
import WiibiLogo from "../../assets/wiibi-logo.svg";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { id: "analytics", label: "Analytics", icon: "barChart"     },
      { id: "customers", label: "Customers", icon: "users"        },
      { id: "leads",     label: "Leads",     icon: "zap", badge: "leads" },
    ],
  },
  {
    label: "Store",
    items: [
      { id: "products",  label: "Products",  icon: "package"      },
      { id: "orders",    label: "Orders",    icon: "shoppingCart", badge: "orders"   },
      { id: "payments",  label: "Payments",  icon: "creditCard"   },
      { id: "refunds",   label: "Refunds",   icon: "refresh"      },
    ],
  },
  {
    label: "Content",
    items: [
      { id: "pages",     label: "Pages",     icon: "layout"       },
      { id: "blog",      label: "Blog",      icon: "fileText"     },
      { id: "projects",  label: "Projects",  icon: "briefcase"    },
    ],
  },
  {
    label: "Support",
    items: [
      { id: "support",   label: "Support",   icon: "helpCircle",  badge: "support"  },
      { id: "faqs",      label: "FAQs",      icon: "help"         },
      { id: "forms",     label: "Forms",     icon: "filePlus"     },
    ],
  },
];

export const Sidebar = ({
  activeNav,
  setActiveNav,
  onLogout,
  onPreview,
  badges = {},   // { orders: 12, support: 3 } — pass from AdminDashboard
}) => (
  <aside style={{
    width: 220,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    background: "#ffffff",
    borderRight: "1px solid #F0F0EE",
    height: "100%",
    overflow: "hidden",
  }}>
    <style>{`
      .sb-item {
        display: flex; align-items: center; gap: 9px;
        padding: 7px 12px; border-radius: 8px;
        border: none; width: 100%; text-align: left;
        font-family: inherit; font-size: 13px;
        cursor: pointer; transition: background 0.1s, color 0.1s;
        background: transparent; color: #6b7280;
        position: relative;
      }
      .sb-item:hover  { background: #F9F9F7; color: #1A1102; }
      .sb-item.active { background: #F3F3F1; color: #1A1102; font-weight: 500; }
      .sb-item.active::before {
        content: ""; position: absolute; left: 0; top: 20%; bottom: 20%;
        width: 3px; background: #FFAA14; border-radius: 0 3px 3px 0;
      }
      .sb-bottom-item {
        display: flex; align-items: center; gap: 9px;
        padding: 7px 12px; border-radius: 8px;
        border: none; width: 100%; text-align: left;
        font-family: inherit; font-size: 13px; cursor: pointer;
        background: transparent; color: #9ca3af;
        transition: background 0.1s, color 0.1s;
      }
      .sb-bottom-item:hover { background: #F9F9F7; color: #6b7280; }
      .sb-logout {
        display: flex; align-items: center; gap: 9px;
        padding: 7px 12px; border-radius: 8px;
        border: none; width: 100%; text-align: left;
        font-family: inherit; font-size: 13px; cursor: pointer;
        background: transparent; color: #f87171;
        transition: background 0.1s;
      }
      .sb-logout:hover { background: #fef2f2; }
    `}</style>

    {/* ── Logo ─────────────────────────────────────────────────────────── */}
    <div style={{
      padding: "14px 16px",
      borderBottom: "1px solid #F0F0EE",
      display: "flex", alignItems: "center", gap: 10,
      flexShrink: 0,
    }}>
      <img src={WiibiLogo} alt="Wiibi" style={{ width: 26, height: 26 }} />
      <span style={{ fontWeight: 700, fontSize: 14, color: "#1A1102", letterSpacing: "-0.02em" }}>
        Wiibi Energy
      </span>
    </div>

    {/* ── Nav groups ───────────────────────────────────────────────────── */}
    <nav style={{
      flex: 1, overflowY: "auto",
      padding: "8px",
      display: "flex", flexDirection: "column",
    }}>
      {NAV_GROUPS.map((group) => (
        <div key={group.label} style={{ marginBottom: 4 }}>
          <p style={{
            fontSize: 10, fontWeight: 600, color: "#9ca3af",
            letterSpacing: "0.08em", textTransform: "uppercase",
            margin: "10px 4px 4px", padding: "0 8px",
          }}>
            {group.label}
          </p>

          {group.items.map((item) => {
            const isActive  = activeNav === item.id;
            const badgeVal  = item.badge ? badges[item.badge] : null;
            const showBadge = badgeVal != null && badgeVal > 0;

            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`sb-item${isActive ? " active" : ""}`}
              >
                <Icon
                  d={I[item.icon]}
                  size={15}
                  strokeWidth={isActive ? 2 : 1.75}
                  style={{ flexShrink: 0, color: isActive ? "#1A1102" : "#9ca3af" }}
                />
                <span style={{ flex: 1 }}>{item.label}</span>
                {showBadge && (
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    padding: "1px 6px", borderRadius: 99,
                    background: item.badge === "support" ? "#FEE2E2" : "#FEF9C3",
                    color:      item.badge === "support" ? "#DC2626" : "#A16207",
                    lineHeight: 1.6,
                  }}>
                    {badgeVal}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </nav>

    {/* ── Bottom ───────────────────────────────────────────────────────── */}
    <div style={{
      flexShrink: 0, padding: "8px",
      borderTop: "1px solid #F0F0EE",
    }}>
      <button
        onClick={() => setActiveNav("settings")}
        className={`sb-item${activeNav === "settings" ? " active" : ""}`}
      >
        <Icon d={I.settings} size={15} strokeWidth={1.75} style={{ flexShrink: 0, color: "#9ca3af" }} />
        <span>Settings</span>
      </button>

      <button onClick={onPreview} className="sb-bottom-item">
        <Icon d={I.externalLink} size={14} strokeWidth={1.75} style={{ flexShrink: 0 }} />
        <span>View live site</span>
      </button>

      <button onClick={onLogout} className="sb-logout">
        <Icon d={I.logout} size={15} strokeWidth={1.75} style={{ flexShrink: 0 }} />
        <span>Sign out</span>
      </button>
    </div>
  </aside>
);