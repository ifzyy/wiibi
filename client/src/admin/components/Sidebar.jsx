import { useState } from 'react';
import { Icon, I } from '../utils/icons.jsx';
import { PAGES, NAV_SECTIONS } from '../utils/api.js';

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

  return (
    <aside
      className={`
        relative flex-shrink-0 flex flex-col bg-white border-r border-stone-100 overflow-hidden
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[60px]' : 'w-[220px]'}
      `}
    >
      {/* Logo */}
      <div className={`flex items-center border-b border-stone-100 h-[60px] px-4 gap-3 overflow-hidden`}>
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center shadow-sm shadow-amber-200">
          <span className="text-black font-black text-sm leading-none">W</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-stone-900 font-black text-[13px] leading-none tracking-tight whitespace-nowrap">Wiibi Energy</p>
            <p className="text-stone-400 text-[10px] font-medium mt-0.5 whitespace-nowrap">Content Studio</p>
          </div>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {NAV_SECTIONS.map(item => (
          <div key={item.id}>
            <button
              onClick={() => setActiveNav(item.id)}
              title={collapsed ? item.label : ''}
              className={`
                w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left
                transition-all duration-150 group/nav
                ${activeNav === item.id
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'}
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <Icon d={I[item.icon]} size={15} strokeWidth={activeNav === item.id ? 2.2 : 1.8} />
              {!collapsed && (
                <span className={`text-[13px] font-semibold ${activeNav === item.id ? 'text-amber-700' : ''}`}>
                  {item.label}
                </span>
              )}
              {!collapsed && activeNav === item.id && item.id === 'pages' && (
                <Icon d={I.chevronDown} size={12} className="ml-auto" />
              )}
            </button>

            {/* Pages sub-list */}
            {item.id === 'pages' && activeNav === 'pages' && !collapsed && (
              <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-stone-100 pl-3">
                {PAGES.map(page => {
                  const isActive = activePageId === page.id;
                  const hasChange = pageChanges?.[page.id];
                  return (
                    <button
                      key={page.id}
                      onClick={() => setActivePageId(page.id)}
                      className={`
                        w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all
                        ${isActive
                          ? 'bg-stone-900 text-white'
                          : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'}
                      `}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: isActive ? 'white' : page.color, opacity: isActive ? 1 : 0.6 }}
                      />
                      <span className="text-[12px] font-medium flex-1 truncate">{page.label}</span>
                      {hasChange && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" title="Unsaved changes" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="p-2 border-t border-stone-100 space-y-0.5">
        <button
          onClick={onPreview}
          title={collapsed ? 'View Site' : ''}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-all text-[12px] font-medium ${collapsed ? 'justify-center' : ''}`}
        >
          <Icon d={I.externalLink} size={14} />
          {!collapsed && 'View live site'}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-all text-[12px] font-medium ${collapsed ? 'justify-center' : ''}`}
        >
          <Icon d={collapsed ? I.chevronRight : I.chevronLeft} size={14} />
          {!collapsed && 'Collapse'}
        </button>
        <button
          onClick={onLogout}
          title={collapsed ? 'Logout' : ''}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all text-[12px] font-medium ${collapsed ? 'justify-center' : ''}`}
        >
          <Icon d={I.logout} size={14} />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </aside>
  );
};
