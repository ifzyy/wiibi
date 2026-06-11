import { useMemo } from "react";
import TiptapEditor from "../../BlogManagerPage/components/TiptapEditor.jsx";
// ProseMirror/tiptap styles normally load with BlogManager — import here too so
// the editor renders correctly even if the blog page hasn't been visited.
import "../../BlogManagerPage/styles/blogManager.css";

/**
 * ContentEditor
 * Rich text editing area for project content.
 *
 * Thin wrapper around the shared TiptapEditor (same editor the blog manager
 * uses). Replaces the old contentEditable + document.execCommand
 * implementation — execCommand is deprecated, and injecting stored HTML into
 * a raw contentEditable was an XSS sink. TipTap parses content into a schema
 * instead of executing it.
 *
 * Props (unchanged):
 *  - value: string (HTML)
 *  - onChange: (html: string) => void
 */
export default function ContentEditor({ value = "", onChange }) {
  const wordCount = useMemo(() => {
    const text = value.replace(/<[^>]*>/g, " ");
    return text.trim().split(/\s+/).filter(Boolean).length;
  }, [value]);

  return (
    <div>
      <TiptapEditor
        value={value}
        onChange={onChange}
        placeholder="Start writing your content here..."
      />
      <p className="text-right text-[11px] text-gray-400 mt-1" aria-live="polite">
        {wordCount} words
      </p>
    </div>
  );
}
