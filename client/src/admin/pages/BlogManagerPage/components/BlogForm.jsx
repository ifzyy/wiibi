import { useState, useEffect, useRef } from "react";
import TiptapEditor from "./TiptapEditor.jsx";
import FeaturedImageUploader from "./FeaturedImageUploader.jsx";
import { slugify } from "../utils/slugify.js";

const EMPTY = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  status: "draft",
  author: "",
  category: "",
  tags: [],
  featuredImage: null,
};

function validate(data) {
  const e = {};
  if (!data.title.trim()) e.title = "Title is required";
  if (!data.slug.trim()) e.slug = "Slug is required";
  if (!data.author.trim()) e.author = "Author name is required";
  if (!data.content || data.content === "<p></p>" || data.content === "")
    e.content = "Content can't be empty";
  return e;
}

const SUGGESTED_TAGS = [
  "solar", "energy", "installation", "battery", "EV",
  "financing", "tips", "policy", "off-grid", "inverter",
];

export default function BlogForm({ initialData, onSave, onCancel, saving, categories = [] }) {
  const [form, setForm] = useState(initialData ? { ...EMPTY, ...initialData } : { ...EMPTY });
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [slugManual, setSlugManual] = useState(!!initialData?.slug);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const initialRef = useRef(
    JSON.stringify(initialData ? { ...EMPTY, ...initialData } : { ...EMPTY })
  );
  const tagInputRef = useRef(null);

  useEffect(() => {
    setIsDirty(JSON.stringify(form) !== initialRef.current);
  }, [form]);

  useEffect(() => {
    const h = (e) => { if (isDirty) e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [isDirty]);

  const set = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "title" && !slugManual) next.slug = slugify(value);
      return next;
    });
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  const addTag = (tag) => {
    const t = tag.trim().toLowerCase();
    if (t && !form.tags.includes(t)) set("tags", [...form.tags, t]);
    setTagInput("");
    setShowTagSuggestions(false);
    setShowTagInput(false);
  };

  const handleTagKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === "Backspace" && !tagInput && form.tags.length)
      set("tags", form.tags.slice(0, -1));
    if (e.key === "Escape") {
      setShowTagSuggestions(false);
      setShowTagInput(false);
    }
  };

  const removeTag = (tag) => set("tags", form.tags.filter((t) => t !== tag));

  const handleSubmit = (statusOverride) => {
    const data = statusOverride ? { ...form, status: statusOverride } : form;
    const errs = validate(data);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(data);
  };

  const filteredSuggestions = SUGGESTED_TAGS.filter(
    (t) => t.includes(tagInput.toLowerCase()) && !form.tags.includes(t)
  );

  const excerptCount = form.excerpt.length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Top Header Bar ── */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-3 sticky top-0 z-30">
        {/* Icon */}
        <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>

        {/* Inline title input */}
        <input
          type="text"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Enter Topic / Title"
          className={`flex-1 min-w-0 px-3 py-1.5 bg-gray-50 border rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:border-gray-300 transition-all ${
            errors.title ? "border-red-300" : "border-gray-200"
          }`}
        />

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => {/* preview handler */}}
            className="px-4 py-1.5 text-sm font-medium border border-gray-800 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => handleSubmit("draft")}
            disabled={saving}
            className="px-4 py-1.5 text-sm font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Save to draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit("published")}
            disabled={saving}
            className="px-4 py-1.5 text-sm font-bold bg-[#FFAA14] text-[#0C0901] rounded-lg hover:bg-[#e89c12] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {saving ? "Publishing…" : "Publish Now"}
          </button>
        </div>
      </div>

      {/* ── URL Slug row ── */}
      <div className="bg-white border-b border-gray-100 px-6 py-2 flex items-center gap-2">
        <span className="text-xs text-gray-400 flex-shrink-0">Url Slug</span>
        <div className="flex items-center gap-1 px-2.5 py-0.5 bg-gray-100 rounded-md">
          <span className="text-xs text-gray-500 font-mono">
            {form.slug || "enter-url-slug"}
          </span>
          {!slugManual && form.title && (
            <span className="text-[10px] text-gray-400 ml-1">(auto)</span>
          )}
        </div>
        {form.slug && (
          <button
            onClick={() => { setSlugManual(true); }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
          >
            edit
          </button>
        )}
        {slugManual && (
          <input
            type="text"
            value={form.slug}
            onChange={(e) => { setSlugManual(true); set("slug", slugify(e.target.value)); }}
            placeholder="custom-slug"
            className="ml-1 px-2 py-0.5 border border-gray-200 rounded-md text-xs font-mono text-gray-600 bg-white outline-none focus:border-gray-300 w-48"
          />
        )}
        {errors.slug && <span className="text-xs text-red-500">⚠ {errors.slug}</span>}
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 gap-0">

        {/* Main content */}
        <div className="flex-1 min-w-0 px-6 py-6 space-y-6">

          {/* Unsaved banner */}
          {isDirty && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              <svg className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Unsaved changes</span>
              <span className="text-amber-600/70">— don't forget to save before leaving.</span>
            </div>
          )}

          {/* EXCERPT */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                Excerpt
              </label>
              <span className={`text-xs ${excerptCount > 160 ? "text-amber-600 font-medium" : "text-gray-400"}`}>
                {excerptCount}/160
              </span>
            </div>
            <textarea
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="a short extract"
              className="w-full px-4 py-3 border border-gray-200 hover:border-gray-300 focus:border-gray-300 rounded-xl bg-white text-sm text-gray-700 placeholder-gray-300 resize-none transition-all leading-relaxed outline-none"
            />
          </div>

          {/* Category (if provided) */}
          {categories.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-2">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:border-gray-300 outline-none transition-all cursor-pointer"
              >
                <option value="">— Select —</option>
                {categories.filter((c) => c !== "All").map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* CONTENT */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                Content
              </label>
              <span className="text-xs text-gray-400">0/160</span>
            </div>
            <TiptapEditor
              value={form.content}
              onChange={(val) => set("content", val)}
              error={errors.content}
            />
            {errors.content && (
              <p className="text-xs text-red-500 mt-1">⚠ {errors.content}</p>
            )}
          </div>

          {/* Back button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                if (isDirty && !window.confirm("Discard unsaved changes?")) return;
                onCancel();
              }}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to list
            </button>
          </div>
        </div>

        {/* ── Right Sidebar ── */}
        <div className="w-56 flex-shrink-0 border-l border-gray-100 bg-white px-5 py-6 space-y-6">

          {/* Author */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Author</label>
            <input
              type="text"
              value={form.author}
              onChange={(e) => set("author", e.target.value)}
              placeholder="Charles"
              className={`w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 text-gray-700 placeholder-gray-400 outline-none focus:bg-white focus:border-gray-300 transition-all ${
                errors.author ? "border-red-300" : "border-gray-200"
              }`}
            />
            {errors.author && (
              <p className="text-xs text-red-500 mt-1">⚠ {errors.author}</p>
            )}
          </div>

          {/* Thumbnail */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Thumbnail</label>
            <FeaturedImageUploader
              value={form.featuredImage}
              onChange={(url) => set("featuredImage", url)}
            />
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700">Tags</label>
              <button
                type="button"
                onClick={() => {
                  setShowTagInput(true);
                  setTimeout(() => tagInputRef.current?.focus(), 50);
                }}
                className="w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-700 transition-colors flex-shrink-0"
                title="Add tag"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {/* Applied tags */}
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-900 text-[#FFAA14] text-xs rounded-full font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 hover:text-white transition-colors"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Tag input (shown when + clicked) */}
            {showTagInput && (
              <div className="relative">
                <input
                  ref={tagInputRef}
                  type="text"
                  value={tagInput}
                  onChange={(e) => { setTagInput(e.target.value); setShowTagSuggestions(true); }}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => setTimeout(() => { setShowTagSuggestions(false); if (!tagInput) setShowTagInput(false); }, 150)}
                  placeholder="Add tag…"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:border-gray-300 transition-all"
                />
                {showTagSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20">
                    {filteredSuggestions.slice(0, 5).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onMouseDown={() => addTag(s)}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-amber-50 hover:text-[#c87d00] transition-colors"
                      >
                        <span className="text-[#FFAA14] mr-1">#</span>{s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <p className="text-[10px] text-gray-400 mt-1.5">Press Enter or comma to add</p>
          </div>
        </div>
      </div>
    </div>
  );
}