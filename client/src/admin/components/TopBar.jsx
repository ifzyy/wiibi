import { Icon, I } from "../utils/icons.jsx";
import { PAGES } from "../utils/api.js";

export const TopBar = ({
  activeNav,
  activePageId,
  hasChanges,
  saving,
  onSave,
  onPreview,
}) => {
  const page = PAGES.find((p) => p.id === activePageId);

  const titles = {
    pages: {
      title: page?.label || "Pages",
      sub: page ? `/${page.slug}` : "Select a page to edit",
      icon: "layout",
    },
    products: {
      title: "Product Catalog",
      sub: "Manage your store inventory",
      icon: "package",
    },
    projects: {
      title: "Projects & Case Studies",
      sub: "Showcase your best work",
      icon: "briefcase",
    },
    faqs: {
      title: "FAQs",
      sub: "Manage frequently asked questions",
      icon: "helpCircle",
    },
    blog: { title: "Blog Manager", sub: "Create and edit articles", icon: "edit" },
    settings: {
      title: "Settings",
      sub: "Global configuration",
      icon: "settings",
    },
  };
  const { title, sub, icon } = titles[activeNav] || titles.pages;

  return (
    <header className="flex-shrink-0 h-[70px] flex items-center justify-between px-8 bg-white border-b border-slate-200 shadow-sm z-10">
      {/* Left: breadcrumb with icon */}
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          <Icon d={I[icon]} size={20} className="text-slate-600" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-slate-900 font-black text-base leading-none tracking-tight">
            {title}
          </h1>
          <p className="text-slate-500 text-xs font-semibold mt-1.5">{sub}</p>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        {hasChanges && activeNav === "pages" && (
          <div className="flex items-center gap-2 text-amber-600 text-xs font-bold bg-amber-50 border border-amber-200 px-4 py-2 rounded-full shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Unsaved changes
          </div>
        )}

        {activeNav === "pages" && page && (
          <button
            onClick={onPreview}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow"
          >
            <Icon d={I.externalLink} size={14} strokeWidth={2.5} />
            Preview
          </button>
        )}

        {activeNav === "pages" && (
          <button
            onClick={onSave}
            disabled={saving || !hasChanges}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-lg
              ${
                hasChanges && !saving
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/30 hover:shadow-amber-500/40 hover:scale-105"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              }
            `}
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Publishing…
              </>
            ) : (
              <>
                <Icon d={I.zap} size={14} strokeWidth={2.5} />
                Push Live
              </>
            )}
          </button>
        )}

        {(activeNav === "projects" || activeNav === "faqs") && (
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/30 hover:shadow-amber-500/40 hover:scale-105"
          >
            <Icon d={I.plus} size={14} strokeWidth={2.5} />
            Add New
          </button>
        )}
      </div>
    </header>
  );
};