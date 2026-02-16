import React, { useEffect, useState } from "react";
import axios from "axios";
import { ChevronRight, ArrowUpRight } from "lucide-react";

const BlogPage = () => {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/public/pages/blog",
        );
        setPageData(response.data);
      } catch (error) {
        console.error("Error fetching blog data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="p-20 text-center font-black italic">Loading Blog...</div>
    );
  if (!pageData) return <div className="p-20 text-center">Page not found.</div>;

  const section = pageData.sections.find((s) => s.type === "blog_grid");
  const { header, categories, posts } = section.content;

  return (
    <main className="bg-white min-h-screen">
      {/* 1. BREADCRUMB & HEADER */}
      <header className="max-w-7xl mx-auto px-6 pt-16 pb-12">
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-400 mb-6">
          <span className="hover:text-stone-900 cursor-pointer">Home</span>
          <ChevronRight size={10} strokeWidth={3} />
          <span className="text-amber-500 uppercase">Our Services</span>
        </nav>
        <span className="text-amber-500 font-bold text-[11px] uppercase tracking-[0.3em] block mb-3">
          {header.sub_heading}
        </span>
        <h1 className="text-5xl font-black text-stone-900 tracking-tight">
          {header.main_heading}
        </h1>
      </header>

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
                  : "text-stone-400 hover:text-stone-600"
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
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-20">
          {posts.map((post) => (
            <article key={post.id} className="group cursor-pointer">
              {/* Feature Image */}
              <div className="aspect-[16/10] bg-stone-50 rounded-[2rem] overflow-hidden mb-8 border border-stone-100 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-stone-200/50">
                <div className="w-full h-full flex items-center justify-center text-stone-200 font-black italic tracking-widest uppercase">
                  [{post.main_image}]
                </div>
              </div>

              {/* Post Metadata */}
              <div className="space-y-4">
                <span className="text-amber-500 text-xs font-black uppercase tracking-widest">
                  {post.category}
                </span>

                <h2 className="text-3xl font-black text-stone-900 leading-tight tracking-tight flex items-start gap-2 group-hover:text-amber-600 transition-colors">
                  {post.title}
                  <ArrowUpRight
                    className="mt-1 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all"
                    size={24}
                  />
                </h2>

                <p className="text-stone-400 text-sm leading-relaxed line-clamp-3 font-medium max-w-lg">
                  {post.excerpt}
                </p>

                {/* Author Section */}
                <div className="flex items-center gap-4 pt-4">
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center overflow-hidden border border-stone-100">
                    {/* Author Avatar Placeholder */}
                    <div className="text-[10px] font-black text-stone-300 uppercase">
                      {post.author.name[0]}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-stone-900 font-black text-sm">
                      {post.author.name}
                    </h5>
                    <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">
                      {post.author.date}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default BlogPage;
