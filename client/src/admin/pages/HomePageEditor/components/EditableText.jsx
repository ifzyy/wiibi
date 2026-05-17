/**
 * EditableText.jsx
 *
 * A contenteditable element with a floating rich-text toolbar on selection.
 *
 * ── Why not dangerouslySetInnerHTML? ────────────────────────────────────────
 * Using dangerouslySetInnerHTML on a contenteditable causes React to overwrite
 * the DOM node's innerHTML on every re-render — resetting the cursor position
 * and wiping the user's in-progress edits mid-keystroke.
 *
 * The fix:
 *  1. Set innerHTML exactly once on mount via a useEffect with no deps.
 *  2. Never pass the `content` prop back into the DOM after that.
 *  3. Read from the DOM only on blur (or after a format command) and call
 *     onChange(innerHTML) at that point.
 *
 * The parent's `content` state stays in sync because we push to it, but we
 * never pull from it back into the DOM.
 */

import { useEffect, useRef, useState } from "react";
import FloatingToolbar from "./FloatingToolbar";

/**
 * @param {{
 *   content     : string,          initial HTML (set once on mount)
 *   onChange    : (html: string) => void,
 *   className   : string,
 *   tag         : keyof JSX.IntrinsicElements,
 *   placeholder : string,
 * }} props
 */
const EditableText = ({
  content = "",
  onChange,
  className = "",
  tag: Tag = "div",
  placeholder = "Click to edit…",
}) => {
  const [editing, setEditing] = useState(false);
  const [toolbar, setToolbar] = useState({ visible: false, x: 0, y: 0 });
  const ref = useRef(null);

  // ── Set initial content ONCE on mount ───────────────────────────────────
  // We intentionally leave the deps array empty.
  // After this, React never touches the DOM node's innerHTML again.
  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = content || "";
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Toolbar position sync ────────────────────────────────────────────────

  const syncToolbar = () => {
    const sel = window.getSelection();
    if (sel?.toString().length > 0) {
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      setToolbar({ visible: true, x: rect.left + rect.width / 2, y: rect.top });
    } else {
      setToolbar((t) => ({ ...t, visible: false }));
    }
  };

  // ── Rich text formatting ─────────────────────────────────────────────────

  const handleFormat = (command) => {
    // h1 / h2 / p → wrap in block element; others → inline toggle
    if (["h1", "h2", "p"].includes(command)) {
      document.execCommand("formatBlock", false, command);
    } else {
      document.execCommand(command, false, null);
    }
    setToolbar((t) => ({ ...t, visible: false }));
    if (ref.current) onChange(ref.current.innerHTML);
  };

  // ── Blur: push current DOM content to parent state ───────────────────────

  const handleBlur = () => {
    setEditing(false);
    setToolbar((t) => ({ ...t, visible: false }));
    if (ref.current) onChange(ref.current.innerHTML);
  };

  return (
    <>
      <FloatingToolbar
        visible={toolbar.visible}
        position={{ x: toolbar.x, y: toolbar.y }}
        onFormat={handleFormat}
      />
      <Tag
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onFocus={() => setEditing(true)}
        onBlur={handleBlur}
        onMouseUp={syncToolbar}
        onKeyUp={syncToolbar}
        className={`
          ${className}
          ${editing
            ? "outline-none ring-2 ring-[#FFAA14]/60 rounded px-1"
            : "hover:bg-[#ffaa14]/50 cursor-text"}
          empty:before:content-[attr(data-placeholder)]
          empty:before:text-gray-300
          empty:before:pointer-events-none
          transition-all min-w-[1ch]
        `}
      />
    </>
  );
};

export default EditableText;
