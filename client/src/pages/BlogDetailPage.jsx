import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (iso) =>
  iso
    ? new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(new Date(iso))
    : "";

const initials = (name = "") =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "W";

// ─── Reading progress bar ─────────────────────────────────────────────────────
function ReadingProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop || document.body.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setPct(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-stone-100">
      <div className="h-full bg-[#FFAA14] transition-[width] duration-75 ease-out" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="animate-pulse pt-28 pb-32 max-w-3xl mx-auto px-6 space-y-8">
      <div className="space-y-4">
        <div className="h-3 w-24 bg-stone-100 rounded-full" />
        <div className="h-14 bg-stone-100 rounded-2xl w-4/5" />
        <div className="h-14 bg-stone-100 rounded-2xl w-3/5" />
        <div className="h-5 bg-stone-100 rounded-xl w-full" />
        <div className="h-5 bg-stone-100 rounded-xl w-2/3" />
      </div>
      <div className="flex items-center gap-3 pt-4">
        <div className="w-12 h-12 rounded-full bg-stone-100" />
        <div className="space-y-2">
          <div className="h-3 w-32 bg-stone-100 rounded-full" />
          <div className="h-3 w-20 bg-stone-100 rounded-full" />
        </div>
      </div>
      <div className="aspect-[16/9] bg-stone-100 rounded-[2rem]" />
      <div className="space-y-3 pt-4">
        {[100, 95, 100, 80, 100, 70, 100, 90, 60].map((w, i) => (
          <div key={i} className="h-4 bg-stone-100 rounded-xl" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

// ─── Related card ─────────────────────────────────────────────────────────────
function RelatedCard({ post }) {
  const navigate = useNavigate();
  return (
    <article
      className="group cursor-pointer"
      onClick={() => navigate(`/blog/${post.slug}`)}
    >
      <div className="aspect-[16/10] rounded-[1.5rem] overflow-hidden mb-5 bg-amber-50 border border-stone-100 transition-all duration-500 group-hover:shadow-xl group-hover:shadow-amber-100">
        {post.featuredImage ? (
          <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-amber-200" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
      </div>
      <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest">{post.category || post.tags?.[0]}</span>
      <h3 className="text-lg font-black text-[#0C0901] leading-snug mt-1.5 mb-2 group-hover:text-amber-600 transition-colors line-clamp-2">{post.title}</h3>
      <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">{fmtDate(post.published_at || post.createdAt)}</p>
    </article>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function BlogDetailPage() {
  const { slug }                = useParams();
  const navigate                = useNavigate();
  const [post,    setPost]      = useState(null);
  const [related, setRelated]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied,  setCopied]    = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setNotFound(false);

    axios.get(`${API}/blog/${slug}`)
      .then(({ data }) => {
        setPost(data.blog);
        const params = { limit: 6 };
        return axios.get(`${API}/blog`, { params }).then(({ data: d }) => {
          setRelated((d.blogs || []).filter((b) => b.slug !== slug).slice(0, 4));
        });
      })
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const share = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) return <div className="bg-white min-h-screen"><ReadingProgress /><Skeleton /></div>;

  if (notFound) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 px-6 text-center">
      <svg className="w-16 h-16 text-amber-200" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h1 className="text-5xl font-black text-[#0C0901]">Post not found</h1>
      <p className="text-stone-400 max-w-sm">This article may have been moved or unpublished.</p>
      <button onClick={() => navigate("/blog")} className="mt-2 px-8 py-3.5 bg-[#FFAA14] text-[#0C0901] font-black rounded-2xl hover:bg-amber-500 transition-colors">
        ← Back to Blog
      </button>
    </div>
  );

  const ini = initials(post.author);

  return (
    <div className="bg-white min-h-screen">
      <ReadingProgress />

      {/* ── Top nav ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-[3px] left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">

          <button
            onClick={() => navigate("/blog")}
            className="flex items-center gap-2 text-sm font-bold text-[#606060] hover:text-[#0C0901] transition-colors group"
          >
            <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            All posts
          </button>

          {post.category && (
            <span className="hidden sm:block text-amber-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-amber-50 rounded-full border border-amber-100">
              {post.category}
            </span>
          )}

          <div className="flex items-center gap-3">
            {post.read_time && (
              <span className="hidden md:flex items-center gap-1.5 text-xs text-stone-400 font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {post.read_time} min read
              </span>
            )}
            <button
              onClick={share}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 border border-stone-200 rounded-xl hover:border-[#FFAA14] hover:text-[#0C0901] text-stone-400 transition-all"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Two-column layout wrapper ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-20">
        <div className="flex gap-16 items-start">

          {/* ── LEFT: Main content column ──────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-400 mb-6 pt-4">
              <Link to="/" className="hover:text-amber-500 transition-colors">Home</Link>
              <svg className="w-3 h-3 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
              </svg>
              <Link to="/blog" className="hover:text-amber-500 transition-colors">Blog</Link>
              <svg className="w-3 h-3 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-amber-500 max-w-[180px] truncate">{post.category || "Article"}</span>
            </nav>

            {/* Title */}
            <h1 className="font-black text-[#0C0901] leading-[1.08] tracking-tight mb-5" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
              {post.title}
            </h1>

            {/* Excerpt / subtitle */}
            {post.excerpt && (
              <p className="text-base text-stone-500 leading-relaxed font-medium mb-8">
                {post.excerpt}
              </p>
            )}

            {/* Hero image */}
            {post.featuredImage && (
              <div className="rounded-[1.5rem] overflow-hidden mb-10 bg-amber-50 border border-stone-100" style={{ aspectRatio: "16/9" }}>
                <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Article body */}
            <article>
              <div
                className="
                  prose prose-base max-w-none
                  prose-headings:font-black prose-headings:text-[#0C0901] prose-headings:tracking-tight prose-headings:leading-tight
                  prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4
                  prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
                  prose-p:text-[#3d3d3d] prose-p:leading-[1.85] prose-p:text-[1rem] prose-p:my-4
                  prose-a:text-[#FFAA14] prose-a:font-bold prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-[#0C0901] prose-strong:font-black
                  prose-blockquote:not-italic prose-blockquote:border-l-[4px] prose-blockquote:border-[#FFAA14]
                  prose-blockquote:bg-amber-50/70 prose-blockquote:rounded-r-xl
                  prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:my-6
                  prose-blockquote:text-[#0C0901] prose-blockquote:font-medium
                  prose-ul:my-4 prose-ol:my-4 prose-li:my-1
                  prose-li:text-[#3d3d3d] prose-li:leading-relaxed
                  prose-img:rounded-[1.25rem] prose-img:shadow-md prose-img:my-8
                  prose-hr:border-stone-100 prose-hr:my-10
                  prose-code:text-amber-600 prose-code:bg-amber-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-lg prose-code:text-[0.9em] prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-[#0C0901] prose-pre:rounded-2xl prose-pre:shadow-xl prose-pre:my-8
                "
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </article>

            {/* Tags */}
            {post.tags?.length > 0 && (
              <div className="pt-10 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-300 mr-1">Tags</span>
                {post.tags.map((t) => (
                  <Link
                    key={t}
                    to={`/blog?tag=${t}`}
                    className="px-3 py-1.5 bg-stone-50 hover:bg-amber-50 border border-stone-200 hover:border-amber-200 text-stone-500 hover:text-amber-600 text-xs font-bold uppercase tracking-wide rounded-full transition-all"
                  >
                    {t}
                  </Link>
                ))}
              </div>
            )}

            {/* Author bio */}
            <div className="mt-12 pt-10 border-t border-stone-100">
              <div className="flex gap-5 items-start p-7 rounded-[1.75rem] bg-gradient-to-br from-amber-50 to-white border border-amber-100">
                <div className="w-14 h-14 rounded-full bg-amber-200/60 flex items-center justify-center flex-shrink-0 border-2 border-amber-300">
                  <span className="text-lg font-black text-amber-700">{ini}</span>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Written by</p>
                  <h3 className="text-base font-black text-[#0C0901] mb-1.5">{post.author || "Wiibi Energy"}</h3>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    Part of the Wiibi Energy team — sharing expert insights on solar power, battery storage, EV charging, and sustainable energy for homes and businesses across Nigeria.
                  </p>
                </div>
              </div>
            </div>

            {related.length > 0 && (
              <div className="mt-16">
                <div className="flex items-end justify-between gap-4 mb-8">
                  <div>
                    <p className="text-amber-500 text-[11px] font-black uppercase tracking-[0.3em] mb-1">Keep reading</p>
                    <h2 className="text-3xl font-black text-[#0C0901] tracking-tight">More articles</h2>
                  </div>
                  <Link to="/blog" className="text-sm font-bold text-stone-400 hover:text-[#0C0901] transition-colors">
                    View all
                  </Link>
                </div>
                <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
                  {related.map((p) => <RelatedCard key={p.id} post={p} />)}
                </div>
              </div>
            )}

          </div>

          {/* ── RIGHT: Sidebar ──────────────────────────────────────────────────── */}
          <aside className="w-72 flex-shrink-0 hidden lg:block">

            {/* Sticky wrapper */}
            <div className="sticky top-24 space-y-8">

              {/* Author + meta card */}
              <div className="p-6 rounded-[1.5rem] border border-stone-100 bg-stone-50/60">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center border-2 border-amber-200 flex-shrink-0">
                    <span className="font-black text-amber-600 text-sm">{ini}</span>
                  </div>
                  <div>
                    <p className="font-black text-[#0C0901] text-sm">{post.author || "Wiibi Energy"}</p>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                      {fmtDate(post.published_at || post.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-stone-500">
                  {post.read_time && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">{post.read_time} min read</span>
                    </div>
                  )}
                  {post.view_count > 0 && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="font-medium">{post.view_count.toLocaleString()} views</span>
                    </div>
                  )}
                  {post.category && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span className="font-medium">{post.category}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={share}
                  className="mt-5 w-full flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 bg-white border border-stone-200 rounded-xl hover:border-[#FFAA14] hover:text-[#FFAA14] text-stone-500 transition-all"
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Link copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Share article
                    </>
                  )}
                </button>
              </div>

              {/* Related posts in sidebar */}
              {related.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-400 mb-4">Related articles</p>
                  <div className="space-y-5">
                    {related.map((p) => (
                      <Link
                        key={p.id}
                        to={`/blog/${p.slug}`}
                        className="group flex gap-3 items-start"
                      >
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-amber-50 border border-stone-100">
                          {p.featuredImage ? (
                            <img src={p.featuredImage} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-amber-200" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-black text-[#0C0901] leading-snug line-clamp-2 group-hover:text-amber-600 transition-colors mb-1">{p.title}</h4>
                          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{fmtDate(p.published_at || p.createdAt)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link
                    to="/blog"
                    className="mt-5 flex items-center gap-1.5 text-xs font-bold text-stone-400 hover:text-[#0C0901] transition-colors group"
                  >
                    View all posts
                    <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )}

            </div>
          </aside>

        </div>
      </div>

      {/* ── Mobile related posts (below content, only on smaller screens) ─────── */}
      {related.length > 0 && (
        <div className="lg:hidden bg-stone-50/60 border-t border-stone-100">
          <div className="max-w-7xl mx-auto px-6 py-14">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-amber-500 text-[11px] font-black uppercase tracking-[0.3em] mb-1">Keep reading</p>
                <h2 className="text-2xl font-black text-[#0C0901] tracking-tight">Related articles</h2>
              </div>
              <Link to="/blog" className="text-sm font-bold text-stone-400 hover:text-[#0C0901] transition-colors">
                View all
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-8">
              {related.slice(0, 2).map((p) => <RelatedCard key={p.id} post={p} />)}
            </div>
          </div>
        </div>
      )}

      {/* ── Footer strip ──────────────────────────────────────────────────────── */}
      <div className="border-t border-stone-100 py-10">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <button
            onClick={() => navigate("/blog")}
            className="flex items-center gap-2 text-sm font-bold text-stone-400 hover:text-[#0C0901] transition-colors group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back to blog
          </button>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2 text-sm font-bold text-stone-400 hover:text-[#0C0901] transition-colors group"
          >
            Back to top
            <svg className="w-4 h-4 transition-transform group-hover:-translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>

    </div>
  );
}