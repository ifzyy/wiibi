import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ArrowUpRight } from "lucide-react";
import { usePage, useBlogPosts } from "../hooks/queries";

// ── Skeleton primitives ────────────────────────────────────────────────────────
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

const BlogSkeleton = () => (
  <main className="bg-white min-h-screen">
    {/* Header */}
    <header className="max-w-7xl mx-auto px-6 pt-16 pb-12 space-y-3">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-14 w-72" />
    </header>

    <div className="border-[1px] border-[#f1f1f1] p-0 mb-10" />

    {/* Category filter bar */}
    <div className="max-w-7xl mx-auto px-6 mb-16">
      <div className="flex items-center gap-8 border-b border-stone-100 pb-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-16" />
        ))}
      </div>
    </div>

    {/* Posts grid */}
    <section className="max-w-7xl mx-auto px-6 pb-32">
      <div className="grid md:grid-cols-2 gap-x-12 gap-y-20">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="aspect-[16/10] w-full rounded-[2rem]" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex items-center gap-4 pt-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  </main>
);

// ── Post grid skeleton (category switch) ──────────────────────────────────────
const PostsSkeleton = () => (
  <div className="grid md:grid-cols-2 gap-x-12 gap-y-20">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="animate-pulse space-y-4">
        <div className="aspect-[16/10] bg-stone-100 rounded-[2rem]" />
        <div className="h-3 bg-stone-100 rounded w-1/4" />
        <div className="h-8 bg-stone-100 rounded w-3/4" />
        <div className="h-4 bg-stone-100 rounded w-full" />
        <div className="h-4 bg-stone-100 rounded w-2/3" />
      </div>
    ))}
  </div>
);

// ── Page component ─────────────────────────────────────────────────────────────
const BlogPage = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");

  const { data: pageData, isLoading: pageLoading, isError: pageError } = usePage("blog");
  const {
    data: postsData,
    isLoading: postsLoading,
  } = useBlogPosts(
    activeCategory !== "All" ? { category: activeCategory, limit: 100 } : { limit: 100 }
  );

  // Show full skeleton only on first page load
  if (pageLoading) return <BlogSkeleton />;

  if (pageError || !pageData) {
    return <div className="p-20 text-center">Page not found.</div>;
  }

  const section = pageData.sections.find((s) => s.type === "blog_grid");
  const { header, categories } = section.content;

  const posts = postsData?.blogs ?? postsData ?? [];

  return (
    <main className="bg-white min-h-screen">

      {/* 1. BREADCRUMB & HEADER */}
      <header className="max-w-7xl mx-auto px-6 pt-16 pb-12">
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-400 mb-6">
          <span className="hover:text-[#FFAA14] cursor-pointer">Home</span>
          <ChevronRight size={10} strokeWidth={3} />
          <span className="text-amber-500 uppercase">Our Services</span>
        </nav>
        <span className="text-amber-500 font-bold text-[11px] uppercase tracking-[0.3em] block mb-3">
          {header.sub_heading}
        </span>
        <h1 className="text-5xl font-black text-[#0C0901] tracking-tight">
          {header.main_heading}
        </h1>
      </header>

      <div className="border-[1px] border-[#f1f1f1] p-0 mb-10" />

      {/* 2. CATEGORY FILTER BAR */}
      <div className="max-w-7xl mx-auto px-6 mb-16 overflow-x-auto">
        <div className="flex items-center gap-8 border-b border-stone-100 min-w-max">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`pb-4 text-sm font-bold transition-all relative ${
                activeCategory === cat
                  ? "text-amber-500"
                  : "text-[#606060] hover:text-[#FFAA14]"
              }`}
            >
              {cat}
              {activeCategory === cat && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-amber-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 3. BLOG POSTS GRID */}
      <section className="max-w-7xl mx-auto px-6 pb-32">
        {postsLoading ? (
          <PostsSkeleton />
        ) : posts.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-2xl font-black text-[#0C0901] mb-2">No posts in this category yet.</p>
            <button
              onClick={() => setActiveCategory("All")}
              className="mt-4 px-5 py-2.5 bg-amber-400 text-[#0C0901] text-sm font-bold rounded-xl hover:bg-amber-500 transition-colors"
            >
              View all posts
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-20">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group cursor-pointer"
                onClick={() => navigate(`/blog/${post.slug}`)}
              >
                {/* Featured Image */}
                <div className="aspect-[16/10] bg-amber-50 rounded-[2rem] overflow-hidden mb-8 border border-stone-100 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-amber-200/50">
                  {post.featuredImage ? (
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-amber-200 font-black italic tracking-widest uppercase text-xs">
                      No image
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <span className="text-amber-500 text-xs font-black uppercase tracking-widest">
                    {post.category}
                  </span>

                  <h2 className="text-3xl font-black text-[#0C0901] leading-tight tracking-tight flex items-start gap-2 group-hover:text-amber-600 transition-colors">
                    {post.title}
                    <ArrowUpRight
                      className="mt-1 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all flex-shrink-0"
                      size={24}
                    />
                  </h2>

                  <p className="text-[#606060] text-sm leading-relaxed line-clamp-3 font-medium max-w-lg">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center gap-4 pt-4">
                    <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center overflow-hidden border border-stone-100">
                      <div className="text-[10px] bg-stone-100 p-4 font-black text-amber-400 uppercase">
                        {post.author?.[0] ?? "?"}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-[#0C0901] font-black text-sm">{post.author}</h5>
                      <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">
                        {new Date(post.published_at || post.createdAt).toLocaleDateString("en-US", {
                          year: "numeric", month: "long", day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

    </main>
  );
};

export default BlogPage;