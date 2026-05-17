import { useState } from "react";
import BlogForm from "./components/BlogForm.jsx";
import { blogMockService } from "./mock/blogMockService.js";

export default function BlogEditorView({ editingBlog, onSaved, onCancel, categories = [] }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async (data) => {
    setSaving(true); setError(null); setSuccess(false);
    try {
      const result = editingBlog
        ? await blogMockService.updateBlog(editingBlog.id, data)
        : await blogMockService.createBlog(data);
      setSuccess(true);
      setTimeout(() => onSaved(result), 700);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5 uppercase tracking-widest font-semibold">
            <svg className="w-3.5 h-3.5 text-[#FFAA14]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
            </svg>
            {editingBlog ? "Editing post" : "New post"}
          </div>
          <h1 className="text-3xl font-light text-gray-900 leading-none" style={{ fontFamily: "var(--font-display)" }}>
            {editingBlog ? editingBlog.title || "Edit Post" : "Write a New Post"}
          </h1>
          {editingBlog?.slug && (
            <p className="text-xs text-gray-400 mt-1 font-mono">/blog/{editingBlog.slug}</p>
          )}
        </div>
        {success && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded-xl">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
            Saved — redirecting…
          </div>
        )}
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
          {error}
        </div>
      )}

      <BlogForm initialData={editingBlog} onSave={handleSave} onCancel={onCancel} saving={saving} categories={categories} />
    </div>
  );
}