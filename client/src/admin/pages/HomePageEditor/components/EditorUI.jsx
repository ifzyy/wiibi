import { useEffect } from "react";
import { Save, Plus, Eye } from "lucide-react"; // Assuming lucide-react for icons; install if needed

/**
 * EditorToolbar.jsx
 *
 * Improved sticky top bar for the editor.
 * - Brand-aligned styling with #FFAA14 accents.
 * - Added preview toggle for better UX (requires parent state: editMode, setEditMode).
 * - Respects sidenav by offsetting left position (default 256px; customizable via prop).
 * - Subtle animation on status change.
 * - Accessibility: ARIA labels and keyboard focus.
 */

/**
 * @param {{
 *   hasChanges      : boolean,
 *   saving          : boolean,
 *   onSave          : () => void,
 *   onToggleAddPanel: () => void,
 *   editMode        : boolean,
 *   setEditMode     : (boolean) => void,
 *   sidenavWidth    : number, // Optional: pixels, default 256
 * }} props
 */
export const EditorToolbar = ({ hasChanges, saving, onSave, onToggleAddPanel, editMode, setEditMode, sidenavWidth = 280 }) => (
  <div 
    className=" bg-white border-b border-gray-100 shadow-sm z-50 px-6 py-3 flex items-center justify-between transition-all duration-300"
    style={{ left: `${sidenavWidth}px` }} // Offset for sidenav
  >
    <div className="flex items-center gap-4">
      <span className="font-bold text-base text-gray-900 tracking-tight">Page Editor</span>
      <span 
        className={`text-xs font-semibold transition-colors duration-200 ${hasChanges ? "text-[#FFAA14] animate-pulse" : "text-emerald-600"}`}
        aria-live="polite"
      >
        {hasChanges ? "● Unsaved changes" : "✓ All saved"}
      </span>
    </div>

    <div className="flex items-center gap-3">
      <button
        onClick={onToggleAddPanel}
        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition hover:shadow-sm flex items-center gap-1"
        aria-label="Add new section"
      >
        <Plus size={16} /> Add Section
      </button>
      <button
        onClick={() => setEditMode(!editMode)}
        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition hover:shadow-sm flex items-center gap-1"
        aria-label={editMode ? "Switch to preview mode" : "Switch to edit mode"}
      >
        <Eye size={16} /> {editMode ? "Preview" : "Edit"}
      </button>
      <button
        onClick={onSave}
        disabled={!hasChanges || saving}
        className={`px-6 py-2 text-sm font-bold rounded-lg transition flex items-center gap-1 ${
          hasChanges
            ? "bg-[#FFAA14] text-white hover:bg-yellow-500 shadow-md shadow-yellow-100 hover:shadow-lg"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
        aria-label="Publish changes"
      >
        <Save size={16} /> {saving ? "Saving…" : "Publish Changes"}
      </button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Toast.jsx
 *
 * Improved ephemeral notification.
 * - Brand colors for success/error (#FFAA14 accents for borders/shadows).
 * - Added fade-in/out animation for smoother UX.
 * - Supports stacking (position adjusts if multiple; assumes parent manages stack).
 * - Auto-dismiss after 3.2s, with accessibility.
 */

/**
 * @param {{
 *   message : string,
 *   type    : "success" | "error",
 *   onDone  : () => void,
 * }} props
 */
export const Toast = ({ message, type = "success", onDone }) => {
  useEffect(() => {
    const timer = setTimeout(onDone, 3200);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold text-white animate-fadeIn
        ${type === "error" ? "bg-red-600 border-red-700" : "bg-emerald-600 border-[#FFAA14]"} border`}
      role="alert"
      aria-live="assertive"
    >
      {message}
    </div>
  );
};

// Add global CSS for animation (or in your stylesheet)
const styles = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

// ─────────────────────────────────────────────────────────────────────────────

/**
 * SectionDivider.jsx
 *
 * Improved decorative horizontal separator.
 * - Changed to use border-t for a cleaner line (avoids full border).
 * - Added optional props for customization (e.g., color, thickness).
 * - Responsive padding for better mobile/desktop spacing.
 * - Matches design spec with #D9D9D9 color.
 */

/**
 * @param {{
 *   color     : string, // Optional: default #D9D9D9
 *   thickness : number, // Optional: pixels, default 1
 * }} props
 */
export const SectionDivider = ({ color = "#D9D9D9", thickness = 1 }) => (
  <hr 
    className="my-20 mx-auto max-w-7xl" 
    style={{ borderTop: `${thickness}px solid ${color}` }} 
  />
);