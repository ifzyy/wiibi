import { useState } from "react";
import { Icon, I } from "../utils/icons.jsx";
import { PAGES, NAV_SECTIONS } from "../utils/api.js";

export const Sidebar = ({
  activeNav,
  setActiveNav,
  activePageId,
  setActivePageId,
  pageChanges,
  onLogout,
  onPreview,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    pages: true,
    projects: false,
    faqs: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <aside
      className={`
        relative flex-shrink-0 flex flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-800/50
        transition-all duration-300 ease-in-out h-screen
        ${collapsed ? "w-[70px]" : "w-[280px]"}
      `}
    >
      {/* Logo - Fixed */}
      <div
        className={`flex-shrink-0 flex items-center h-[70px] px-5 gap-3 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-sm ${
          collapsed ? "justify-center px-0" : ""
        }`}
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/20">
          <span className="text-slate-900 font-black text-base leading-none">
            W
          </span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-black text-sm leading-none tracking-tight">
              Wiibi Energy
            </p>
            <p className="text-slate-400 text-xs font-semibold mt-1">
              Content Studio
            </p>
          </div>
        )}
      </div>

      {/* Main nav - Scrollable */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {/* Standard Navigation Items */}
        {NAV_SECTIONS.map((item) => {
          const isExpandable = item.id === "pages";
          const isActive = activeNav === item.id;
          const isExpanded = expandedSections[item.id];

          return (
            <div key={item.id}>
              <button
                onClick={() => {
                  setActiveNav(item.id);
                  if (isExpandable && !collapsed) {
                    toggleSection(item.id);
                  }
                }}
                title={collapsed ? item.label : ""}
                className={`
                  w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left
                  transition-all duration-200 group/nav relative overflow-hidden
                  ${
                    isActive
                      ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-400 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }
                  ${collapsed ? "justify-center" : ""}
                `}
              >
                {isActive && !collapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-amber-400 to-orange-500 rounded-r-full" />
                )}
                <Icon
                  d={I[item.icon]}
                  size={18}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? "text-amber-400" : ""}
                />
                {!collapsed && (
                  <>
                    <span className="text-sm font-bold flex-1">
                      {item.label}
                    </span>
                    {isExpandable && (
                      <Icon
                        d={I.chevronDown}
                        size={14}
                        className={`transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </>
                )}
              </button>

              {/* Pages sub-list */}
              {item.id === "pages" &&
                activeNav === "pages" &&
                !collapsed &&
                isExpanded && (
                  <div className="mt-1 ml-4 space-y-0.5 border-l border-slate-800 pl-4">
                    {PAGES.map((page) => {
                      const isPageActive = activePageId === page.id;
                      const hasChange = pageChanges?.[page.id];
                      return (
                        <button
                          key={page.id}
                          onClick={() => setActivePageId(page.id)}
                          className={`
                            w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all group
                            ${
                              isPageActive
                                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                            }
                          `}
                        >
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0 transition-all"
                            style={{
                              background: isPageActive
                                ? "white"
                                : page.color || "#64748b",
                              opacity: isPageActive ? 1 : 0.5,
                            }}
                          />
                          <span className="text-xs font-semibold flex-1 truncate">
                            {page.label}
                          </span>
                          {hasChange && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
            </div>
          );
        })}

        {/* Divider */}
        <div className="py-2">
          <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
        </div>

        {/* Projects / Case Studies Section */}
        <div>
          <button
            onClick={() => {
              setActiveNav("projects");
              if (!collapsed) toggleSection("projects");
            }}
            title={collapsed ? "Projects & Case Studies" : ""}
            className={`
              w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left
              transition-all duration-200 group/nav relative overflow-hidden
              ${
                activeNav === "projects"
                  ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }
              ${collapsed ? "justify-center" : ""}
            `}
          >
            {activeNav === "projects" && !collapsed && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-amber-400 to-orange-500 rounded-r-full" />
            )}
            <Icon
              d={I.briefcase}
              size={18}
              strokeWidth={activeNav === "projects" ? 2.5 : 2}
              className={activeNav === "projects" ? "text-amber-400" : ""}
            />
            {!collapsed && (
              <>
                <span className="text-sm font-bold flex-1">Projects</span>
                <Icon
                  d={I.chevronDown}
                  size={14}
                  className={`transition-transform duration-200 ${
                    expandedSections.projects ? "rotate-180" : ""
                  }`}
                />
              </>
            )}
          </button>

          {!collapsed && expandedSections.projects && (
            <div className="mt-1 ml-4 space-y-0.5 border-l border-slate-800 pl-4">
              <button
                onClick={() => {
                  setActiveNav("projects");
                  setActivePageId("projects-list");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0 bg-blue-400 opacity-50" />
                <span className="text-xs font-semibold">All Projects</span>
              </button>
              <button
                onClick={() => {
                  setActiveNav("projects");
                  setActivePageId("case-studies");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0 bg-purple-400 opacity-50" />
                <span className="text-xs font-semibold">Case Studies</span>
              </button>
            </div>
          )}
        </div>

        {/* FAQs Section */}
        <div>
          <button
            onClick={() => {
              setActiveNav("faqs");
              if (!collapsed) toggleSection("faqs");
            }}
            title={collapsed ? "FAQs" : ""}
            className={`
              w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left
              transition-all duration-200 group/nav relative overflow-hidden
              ${
                activeNav === "faqs"
                  ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }
              ${collapsed ? "justify-center" : ""}
            `}
          >
            {activeNav === "faqs" && !collapsed && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-amber-400 to-orange-500 rounded-r-full" />
            )}
            <Icon
              d={I.helpCircle}
              size={18}
              strokeWidth={activeNav === "faqs" ? 2.5 : 2}
              className={activeNav === "faqs" ? "text-amber-400" : ""}
            />
            {!collapsed && (
              <>
                <span className="text-sm font-bold flex-1">FAQs</span>
                <Icon
                  d={I.chevronDown}
                  size={14}
                  className={`transition-transform duration-200 ${
                    expandedSections.faqs ? "rotate-180" : ""
                  }`}
                />
              </>
            )}
          </button>

          {!collapsed && expandedSections.faqs && (
            <div className="mt-1 ml-4 space-y-0.5 border-l border-slate-800 pl-4">
              <button
                onClick={() => {
                  setActiveNav("faqs");
                  setActivePageId("faq-general");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0 bg-green-400 opacity-50" />
                <span className="text-xs font-semibold">General</span>
              </button>
              <button
                onClick={() => {
                  setActiveNav("faqs");
                  setActivePageId("faq-products");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0 bg-teal-400 opacity-50" />
                <span className="text-xs font-semibold">Products</span>
              </button>
              <button
                onClick={() => {
                  setActiveNav("faqs");
                  setActivePageId("faq-technical");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0 bg-cyan-400 opacity-50" />
                <span className="text-xs font-semibold">Technical</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Bottom actions - Fixed */}
      <div className="flex-shrink-0 p-3 border-t border-slate-800/50 space-y-1 bg-slate-900/80 backdrop-blur-sm">
        <button
          onClick={onPreview}
          title={collapsed ? "View Site" : ""}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 transition-all text-xs font-semibold group ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <Icon
            d={I.externalLink}
            size={16}
            className="group-hover:scale-110 transition-transform"
          />
          {!collapsed && "View Live Site"}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all text-xs font-semibold ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <Icon d={collapsed ? I.chevronRight : I.chevronLeft} size={16} />
          {!collapsed && "Collapse"}
        </button>
        <button
          onClick={onLogout}
          title={collapsed ? "Logout" : ""}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-all text-xs font-semibold ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <Icon d={I.logout} size={16} />
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </aside>
  );
};