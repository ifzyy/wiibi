/**
 * EditableButton.jsx
 *
 * A button whose label is inline-editable via EditableText.
 * Shift+Click opens a small popover to edit the href/link URL.
 */

import { useState } from "react";
import EditableText from "./EditableText";

/**
 * @param {{
 *   text        : string,
 *   href        : string,
 *   onTextChange: (v: string) => void,
 *   onHrefChange: (v: string) => void,
 *   className   : string,
 * }} props
 */
const EditableButton = ({ text, href, onTextChange, onHrefChange, className = "" }) => {
  const [showLinkEditor, setShowLinkEditor] = useState(false);
  const [draftHref, setDraftHref]           = useState(href || "");

  return (
    <div className="relative inline-block">
      <button
        className={`${className} relative group`}
        onClick={(e) => e.shiftKey && setShowLinkEditor(true)}
        title="Shift+Click to edit link"
      >
        <EditableText content={text} onChange={onTextChange} className="pointer-events-none" />
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
          Shift+Click to edit link
        </span>
      </button>

      {showLinkEditor && (
        <div className="absolute top-full left-0 mt-2 bg-white shadow-2xl border border-gray-100 rounded-xl p-4 z-50 w-72">
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
            Button URL
          </label>
          <input
            type="text"
            value={draftHref}
            onChange={(e) => setDraftHref(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-[#FFAA14]"
            placeholder="https://…"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { onHrefChange(draftHref); setShowLinkEditor(false); }}
              className="flex-1 bg-[#FFAA14] text-white text-sm py-2 rounded-lg font-semibold hover:bg-yellow-500"
            >
              Save
            </button>
            <button
              onClick={() => setShowLinkEditor(false)}
              className="flex-1 bg-gray-100 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableButton;
