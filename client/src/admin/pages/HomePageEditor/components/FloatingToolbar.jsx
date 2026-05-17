/**
 * FloatingToolbar.jsx
 *
 * Appears above a text selection inside an EditableText and provides
 * basic rich-text format commands.
 *
 * Uses onMouseDown (not onClick) so the button press does NOT blur the
 * contenteditable target — that's what allows execCommand to work.
 */

const TOOLBAR_BUTTONS = [
  { label: "B",  cmd: "bold",      style: "font-bold" },
  { label: "I",  cmd: "italic",    style: "italic" },
  { label: "U",  cmd: "underline", style: "underline" },
  null, // renders as a vertical divider
  { label: "H1", cmd: "h1",        style: "text-sm font-bold" },
  { label: "H2", cmd: "h2",        style: "text-xs font-bold" },
  { label: "P",  cmd: "p",         style: "text-xs" },
];

/**
 * @param {{
 *   visible  : boolean,
 *   position : { x: number, y: number },
 *   onFormat : (command: string) => void,
 * }} props
 */
const FloatingToolbar = ({ visible, position, onFormat }) => {
  if (!visible) return null;

  return (
    <div
      className="fixed z-[9999] bg-gray-900 text-white rounded-lg shadow-2xl px-2 py-1 flex items-center gap-1 -translate-x-1/2 pointer-events-auto"
      style={{ top: position.y - 52, left: position.x }}
    >
      {TOOLBAR_BUTTONS.map((btn, i) =>
        btn === null ? (
          <div key={`sep-${i}`} className="w-px h-5 bg-gray-600 mx-1" />
        ) : (
          <button
            key={btn.cmd}
            onMouseDown={(e) => {
              e.preventDefault(); // prevent contenteditable from losing focus
              onFormat(btn.cmd);
            }}
            className={`p-2 hover:bg-gray-700 rounded transition ${btn.style}`}
          >
            {btn.label}
          </button>
        )
      )}
    </div>
  );
};

export default FloatingToolbar;
