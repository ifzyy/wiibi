/**
 * EditableSection.jsx
 *
 * Visual hover wrapper that gives every page section:
 *  - A label bar at the top showing the section name
 *  - A "Remove Section" button that calls onDelete after confirmation
 *  - A subtle blue ring outline on hover to indicate it is editable
 */

import { useState } from "react";

/**
 * @param {{
 *   children : React.ReactNode,
 *   label    : string,           displayed in the hover bar
 *   onDelete : () => void,
 * }} props
 */
const EditableSection = ({ children, label, onDelete }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <div className="absolute -top-8 left-0 right-0 h-8 bg-gray-50 border border-gray-200 rounded-t flex items-center px-4 gap-3 z-40">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
            {label}
          </span>
          <span className="flex-1" />
          <button
            onClick={() =>
              window.confirm(`Remove the "${label}" section?`) && onDelete()
            }
            className="text-red-400 hover:text-red-600 text-xs font-semibold transition"
          >
            Remove Section
          </button>
        </div>
      )}

      <div className={`transition-all ${hovered ? "ring-2 ring-blue-300/40" : ""}`}>
        {children}
      </div>
    </div>
  );
};

export default EditableSection;
