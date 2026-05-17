import StatusBadge from "./components/StatusBadge.jsx";
import { formatDate } from "./utils/formatDate.js";

function AuthorAvatar({ name }) {
  const initials = name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  return (
    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-500 flex-shrink-0">
      {initials}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-start py-3 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-400 font-medium pt-0.5">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}

export default function BlogInfoView({ blog, onBack, onEdit }) {
  if (!blog) return null;

  // Format publish date/time from createdAt or dedicated fields
  const publishDate = blog.publishDate || formatDate(blog.createdAt);
  const publishTime = blog.publishTime || "5:00 PM";

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6 font-sans">
      {/* Back nav */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Page title */}
      <h1 className="text-xl font-bold text-gray-900 mb-6">
        INFO - Article {String(blog.id).padStart(3, "0")}
      </h1>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left: Card preview */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            {/* Image */}
            <div className="h-44 bg-gray-100 overflow-hidden">
              {blog.featuredImage ? (
                <img
                  src={blog.featuredImage}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100" />
              )}
            </div>

            {/* Card body */}
            <div className="p-4 flex flex-col gap-2">
              <span className="text-xs font-semibold text-[#FFAA14]">
                {blog.tags?.[0] || blog.category || "General"}
              </span>

              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900 leading-snug flex-1">
                  {blog.title}
                </p>
                <span className="flex-shrink-0 mt-0.5 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                  </svg>
                </span>
              </div>

              {blog.excerpt && (
                <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                  {blog.excerpt}
                </p>
              )}

              <div className="flex items-center gap-2 mt-auto pt-2">
                <AuthorAvatar name={blog.author} />
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-medium text-gray-700">{blog.author}</span>
                  <span className="text-[10px] text-gray-400">{formatDate(blog.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Metadata panel */}
        <div className="flex-1 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="divide-y divide-gray-100">
            <InfoRow label="Title" value={blog.title} />
            <div className="grid grid-cols-[120px_1fr] items-start py-3 border-b border-gray-100">
              <span className="text-xs text-gray-400 font-medium pt-0.5">Status</span>
              <div>
                <StatusBadge status={blog.status} />
              </div>
            </div>
            <InfoRow
              label="Url Slug"
              value={
                <span className="font-mono text-xs text-gray-500">
                  {blog.slug || blog.title?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}
                </span>
              }
            />
            <InfoRow label="Publish Date" value={publishDate} />
            <InfoRow label="Publish Time" value={publishTime} />
            <InfoRow label="Author" value={blog.author} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={onBack}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => onEdit(blog)}
              className="px-4 py-2 text-sm font-semibold bg-[#FFAA14] text-[#0C0901] rounded-xl hover:bg-[#e89c12] transition-colors"
            >
              Edit Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}