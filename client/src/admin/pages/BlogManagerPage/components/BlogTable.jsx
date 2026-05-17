import StatusBadge from "./StatusBadge.jsx";
import { formatDate } from "../utils/formatDate.js";

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="skeleton w-12 h-10 rounded-lg flex-shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="skeleton h-3.5 w-48 rounded" />
            <div className="skeleton h-2.5 w-32 rounded" />
          </div>
        </div>
      </td>
      {[1,2,3,4].map(i => <td key={i} className="px-4 py-3.5"><div className={`skeleton h-3.5 rounded ${i===1?"w-20":i===4?"w-16":"w-24"}`}/></td>)}
    </tr>
  );
}

export default function BlogTable({ blogs, loading, onEdit, onDelete, onPreview }) {
  if (loading) return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm"><Head /><tbody>{Array.from({length:5}).map((_,i)=><SkeletonRow key={i}/>)}</tbody></table>
    </div>
  );

  if (blogs.length === 0) return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm"><Head />
        <tbody><tr><td colSpan={5} className="py-20 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#FFAA14]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707" />
              </svg>
            </div>
            <div>
              <p className="text-gray-600 font-medium" style={{fontFamily:"var(--font-display)"}}>No posts found</p>
              <p className="text-gray-400 text-xs mt-1">Try adjusting filters or write your first solar article.</p>
            </div>
          </div>
        </td></tr></tbody>
      </table>
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <Head />
        <tbody>
          {blogs.map(blog => (
            <tr key={blog.id} className="border-b border-gray-100 hover:bg-amber-50/30 transition-colors group">
              {/* Title + thumbnail */}
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-10 rounded-lg overflow-hidden bg-amber-50 flex-shrink-0 border border-gray-100">
                    {blog.featuredImage ? (
                      <img src={blog.featuredImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#FFAA14]/50" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <button
                      onClick={() => onEdit(blog)}
                      className="text-left font-medium text-gray-900 hover:text-[#c87d00] transition-colors line-clamp-1 text-sm leading-snug"
                      style={{fontFamily:"var(--font-display)"}}
                      title={blog.title}
                    >
                      {blog.title}
                    </button>
                    {blog.tags?.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {blog.tags.slice(0,3).map(t => (
                          <span key={t} className="text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">{t}</span>
                        ))}
                        {blog.tags.length > 3 && <span className="text-xs text-gray-400">+{blog.tags.length-3}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3.5"><StatusBadge status={blog.status} /></td>
              <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap text-xs">{blog.author}</td>
              <td className="px-4 py-3.5 text-gray-400 whitespace-nowrap text-xs">{formatDate(blog.createdAt)}</td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ABtn onClick={() => onPreview(blog)} title="Preview" variant="neutral">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  </ABtn>
                  <ABtn onClick={() => onEdit(blog)} title="Edit" variant="neutral">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </ABtn>
                  <ABtn onClick={() => onDelete(blog)} title="Delete" variant="danger">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </ABtn>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Head() {
  return (
    <thead>
      <tr className="border-b border-gray-200 bg-gray-50/80">
        {["Post","Status","Author","Date",""].map((h,i) => (
          <th key={i} className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${i===4?"w-24":""}`}>{h}</th>
        ))}
      </tr>
    </thead>
  );
}

function ABtn({ onClick, title, variant, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`p-1.5 rounded-lg transition-colors ${
        variant === "danger"
          ? "hover:bg-red-50 hover:text-red-500 text-gray-300"
          : "hover:bg-amber-50 hover:text-[#c87d00] text-gray-300"
      }`}
    >
      {children}
    </button>
  );
}