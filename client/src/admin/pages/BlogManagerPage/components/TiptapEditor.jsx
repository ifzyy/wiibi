import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import EditorToolbar from "./EditorToolbar.jsx";

export default function TiptapEditor({ value, onChange, placeholder = "Start writing your post…", error }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none",
        "aria-label": "Blog content editor",
      },
    },
  });

  // Sync external value reset (e.g., new form)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== undefined && value !== current) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  return (
    <div className={`tiptap-wrapper border rounded-sm overflow-hidden bg-white ${error ? "border-red-500" : "border-gray-300"}`}>
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
      {error && <p className="text-xs text-red-500 px-3 pb-2">{error}</p>}
    </div>
  );
}