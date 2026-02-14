import { Icon, I } from '../utils/icons.jsx';
import { PAGES } from '../utils/api.js';

export const TopBar = ({
  activeNav,
  activePageId,
  hasChanges,
  saving,
  onSave,
  onPreview,
}) => {
  const page = PAGES.find(p => p.id === activePageId);

  const titles = {
    pages:    { title: page?.label || 'Pages', sub: page ? `/${page.slug}` : 'Select a page to edit' },
    products: { title: 'Product Catalog',       sub: 'Manage your store inventory'                   },
    blog:     { title: 'Blog Manager',           sub: 'Create and edit articles'                      },
    settings: { title: 'Settings',               sub: 'Global configuration'                          },
  };
  const { title, sub } = titles[activeNav] || titles.pages;

  return (
    <header className="flex-shrink-0 h-[60px] flex items-center justify-between px-6 bg-white border-b border-stone-100">
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-stone-900 font-black text-[15px] leading-none tracking-tight">{title}</h1>
          <p className="text-stone-400 text-[11px] font-medium mt-0.5">{sub}</p>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {hasChanges && activeNav === 'pages' && (
          <span className="flex items-center gap-1.5 text-amber-600 text-[11px] font-bold bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Unsaved changes
          </span>
        )}

        {activeNav === 'pages' && page && (
          <button
            onClick={onPreview}
            className="flex items-center gap-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-50 border border-stone-200 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all"
          >
            <Icon d={I.externalLink} size={12} />
            Preview
          </button>
        )}

        {activeNav === 'pages' && (
          <button
            onClick={onSave}
            disabled={saving || !hasChanges}
            className={`
              flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-[12px] transition-all shadow-sm
              ${hasChanges && !saving
                ? 'bg-stone-900 hover:bg-stone-800 text-white shadow-stone-900/20'
                : 'bg-stone-100 text-stone-300 cursor-not-allowed'}
            `}
          >
            {saving
              ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Pushing…</>
              : <><Icon d={I.zap} size={12} />Push live</>
            }
          </button>
        )}
      </div>
    </header>
  );
};
