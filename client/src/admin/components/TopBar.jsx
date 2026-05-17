import {
  Folder,
  FolderOpen,
  FileText,
  LayoutDashboard,
  Settings
} from "lucide-react";

import { PAGES } from "../utils/api.js";

export const Topbar = ({ activePageId, setActivePageId, pageChanges }) => {
  const getIcon = (pageId, isActive) => {
    switch (pageId) {
      case "dashboard":
        return <LayoutDashboard size={16} />;
      case "pages":
        return isActive ? <FolderOpen size={16} /> : <Folder size={16} />;
      case "blog":
        return <FileText size={16} />;
      case "settings":
        return <Settings size={16} />;
      default:
        return isActive ? <FolderOpen size={16} /> : <Folder size={16} />;
    }
  };

  return (
    <div className="flex-shrink-0 flex items-center h-[52px] bg-white border-b border-gray-200 px-4 gap-2 overflow-x-auto scrollbar-none">
      {PAGES.map((page) => {
        const isActive = activePageId === page.id;
        const hasChange = pageChanges?.[page.id];

        return (
          <button
            key={page.id}
            onClick={() => setActivePageId(page.id)}
            className={`
              relative flex items-center gap-2 px-4 py-2 rounded-lg
              transition-all duration-150 whitespace-nowrap flex-shrink-0
              ${
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }
            `}
          >
            <span className={`${isActive ? "text-gray-800" : "text-gray-400"}`}>
              {getIcon(page.id, isActive)}
            </span>

            <span
              className={`text-[13px] ${
                isActive ? "font-semibold text-gray-900" : "font-medium"
              }`}
            >
              {page.label}
            </span>

            {hasChange && (
              <span className="relative flex h-2 w-2 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};