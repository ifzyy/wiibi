import { useState, useEffect, useMemo } from "react";
import BlogTable from "./components/BlogTable.jsx";
import ConfirmDialog from "./components/ConfirmDialog.jsx";
import StatusBadge from "./components/StatusBadge.jsx";
import BlogInfoView from "./BlogInfoView.jsx";
import { blogMockService } from "./mock/blogMockService.js";
import { formatDate } from "./utils/formatDate.js";
import SafeHtml from "../../../components/SafeHtml.jsx";

// Category tabs derived from tags or a fixed list
const CATEGORIES = ["All", "Education", "Product Guides", "How-Tos", "Installation", "Case Studies", "Energy News"];

function AuthorAvatar({ name }) {
  const initials = name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  return (
    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-500 flex-shrink-0">
      {initials}
    </div>
  );
}

function HoverMenu({ blog, onRead, onEdit, onDelete, onInfo }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl overflow-hidden pointer-events-none group-hover:pointer-events-auto">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-white/30 backdrop-blur-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl" />
      {/* Menu panel */}
      <div className="relative z-10 bg-white rounded-2xl shadow-xl border border-gray-100 w-44 overflow-hidden opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 ease-out">
        {[
          { label: "Read", action: onRead, danger: false },
          { label: "Edit", action: onEdit, danger: false },
          { label: "Info", action: onInfo, danger: false },
          { label: "Remove", action: onDelete, danger: true },
        ].map(({ label, action, danger }, i, arr) => (
          <button
            key={label}
            onClick={e => { e.stopPropagation(); action(); }}
            className={`w-full text-center py-3 text-sm transition-colors ${
              danger
                ? "text-red-500 hover:bg-red-50 font-medium"
                : "text-gray-800 hover:bg-gray-50 font-normal"
            } ${i < arr.length - 1 ? "border-b border-gray-100" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CardGrid({ blogs, onEdit, onDelete, onPreview, onInfo }) {
  if (blogs.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {blogs.map(blog => (
        <div
          key={blog.id}
          className="relative bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col group cursor-pointer hover:shadow-md transition-shadow duration-200"
        >
          {/* Hover menu overlay */}
          <HoverMenu
            blog={blog}
            onRead={() => onPreview(blog)}
            onEdit={() => onEdit(blog)}
            onDelete={() => onDelete(blog)}
            onInfo={() => onInfo(blog)}
          />

          {/* Image */}
          <div className="relative h-44 bg-gray-100 overflow-hidden flex-shrink-0">
            {blog.featuredImage ? (
              <img
                src={blog.featuredImage}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gray-100" />
            )}
          </div>

          {/* Body */}
          <div className="p-4 flex flex-col flex-1 gap-2">
            {/* Category label */}
            <span className="text-xs font-semibold text-[#FFAA14]">
              {blog.tags?.[0] || blog.category || "General"}
            </span>

            {/* Title row */}
            <div className="flex items-start justify-between gap-2">
              <p className="text-left text-sm font-semibold text-gray-900 leading-snug line-clamp-2 flex-1">
                {blog.title}
              </p>
              <span className="flex-shrink-0 mt-0.5 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </span>
            </div>

            {/* Excerpt */}
            {blog.excerpt && (
              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                {blog.excerpt}
              </p>
            )}

            {/* Author + date */}
            <div className="flex items-center gap-2 mt-auto pt-2">
              <AuthorAvatar name={blog.author} />
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-medium text-gray-700">{blog.author}</span>
                <span className="text-[10px] text-gray-400">{formatDate(blog.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BlogListView({ onEdit, onNew }) {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [previewBlog, setPreviewBlog] = useState(null);
  const [infoBlog, setInfoBlog] = useState(null);           // <-- new: info page target
  const [viewMode, setViewMode] = useState("grid"); // table | grid

  useEffect(() => {
    setLoading(true);
    setError(null);
    blogMockService
      .getBlogs()
      .then(setBlogs)
      .catch(() => setError("Failed to load posts."))
      .finally(() => setLoading(false));
  }, []);

  const totalCount = blogs.length;

  const filtered = useMemo(() => {
    return blogs.filter(b => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.tags?.some(t => t.toLowerCase().includes(q));
      const matchCategory =
        activeCategory === "All" ||
        b.tags?.some(t => t === activeCategory) ||
        b.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [blogs, search, activeCategory]);

  // If info page is active, render it full-screen instead of the list
  if (infoBlog) {
    return (
      <BlogInfoView
        blog={infoBlog}
        onBack={() => setInfoBlog(null)}
        onEdit={(blog) => { setInfoBlog(null); onEdit(blog); }}
      />
    );
  }

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setBlogs(prev => prev.filter(b => b.id !== deleteTarget.id));
    try {
      await blogMockService.deleteBlog(deleteTarget.id);
    } catch {
      setBlogs(prev => [deleteTarget, ...prev]);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const EmptyState = () => (
    <div className="py-24 text-center">
      <p className="text-gray-500 text-sm">No posts found. Try a different category or search.</p>
      <button
        onClick={onNew}
        className="mt-4 px-4 py-2 bg-[#FFAA14] text-[#0C0901] text-sm font-semibold rounded-xl hover:bg-[#e89c12] transition-colors"
      >
        Write New Post
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6 font-sans">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="w-9 h-9 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">Blog</h1>
            <p className="text-xs text-gray-400 mt-0.5">Manage articles and news.</p>
          </div>
        </div>

        <button
          onClick={onNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FFAA14] text-[#0C0901] text-sm font-bold rounded-xl hover:bg-[#e89c12] active:scale-[0.98] transition-all shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New Post
        </button>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-1.5 mb-5 pl-12">
        <span className="text-xs text-[#FFAA14] font-semibold">
          {CATEGORIES.length} categories
        </span>
        <span className="text-xs text-gray-400">· {totalCount} articles</span>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Tabs + controls row */}
      <div className="flex items-center justify-between mb-5 gap-4">
        {/* Category tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-hide flex-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all flex-shrink-0 ${
                activeCategory === cat
                  ? "text-[#FFAA14] border-b-2 border-[#FFAA14] bg-transparent font-semibold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Filter button */}
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 bg-white rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 8h12M10 12h4" />
            </svg>
            Filter
          </button>

          {/* Grid toggle */}
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
            className="p-1.5 border border-gray-200 bg-white rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
            title={viewMode === "grid" ? "Switch to table" : "Switch to grid"}
          >
            {viewMode === "grid" ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
              <div className="h-44 bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-3 w-20 bg-gray-100 rounded" />
                <div className="h-4 w-3/4 bg-gray-100 rounded" />
                <div className="h-3 w-full bg-gray-100 rounded" />
                <div className="h-3 w-2/3 bg-gray-100 rounded" />
                <div className="flex items-center gap-2 pt-2">
                  <div className="w-7 h-7 rounded-full bg-gray-100" />
                  <div className="space-y-1">
                    <div className="h-3 w-14 bg-gray-100 rounded" />
                    <div className="h-2 w-10 bg-gray-100 rounded" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : viewMode === "table" ? (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <BlogTable
            blogs={filtered}
            loading={false}
            onEdit={onEdit}
            onDelete={setDeleteTarget}
            onPreview={setPreviewBlog}
            onInfo={setInfoBlog}
          />
        </div>
      ) : (
        <CardGrid
          blogs={filtered}
          onEdit={onEdit}
          onDelete={setDeleteTarget}
          onPreview={setPreviewBlog}
          onInfo={setInfoBlog}
        />
      )}

      {/* Delete dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete this post?"
        message={`"${deleteTarget?.title}" will be permanently removed. This can't be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      {/* Read Preview Modal — kept for "Read" action */}
      {previewBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setPreviewBlog(null)}
          />
          <div className="relative bg-white border border-gray-200 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Preview</span>
                <StatusBadge status={previewBlog.status} />
              </div>
              <button
                onClick={() => setPreviewBlog(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {previewBlog.featuredImage && (
                <img src={previewBlog.featuredImage} alt="" className="w-full h-52 object-cover" />
              )}
              <div className="p-6 space-y-4">
                {previewBlog.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {previewBlog.tags.map(t => (
                      <span key={t} className="text-xs text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <h1 className="text-2xl font-semibold text-gray-900 leading-snug">{previewBlog.title}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <AuthorAvatar name={previewBlog.author} />
                  <span>{previewBlog.author}</span>
                  <span>·</span>
                  <span>{formatDate(previewBlog.createdAt)}</span>
                </div>
                {previewBlog.excerpt && (
                  <p className="text-gray-500 text-sm italic leading-relaxed border-l-2 border-[#FFAA14] pl-4">
                    {previewBlog.excerpt}
                  </p>
                )}
                <SafeHtml
                  className="text-sm text-gray-700 leading-relaxed"
                  html={previewBlog.content}
                />
              </div>
            </div>
            <div className="flex-shrink-0 px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-2">
              <button
                onClick={() => setPreviewBlog(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => { setPreviewBlog(null); onEdit(previewBlog); }}
                className="px-4 py-2 text-sm font-semibold bg-[#FFAA14] text-[#0C0901] rounded-lg hover:bg-[#e89c12] transition-colors"
              >
                Edit Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}