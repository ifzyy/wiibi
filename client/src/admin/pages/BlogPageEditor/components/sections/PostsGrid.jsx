import React from 'react';
import { LayoutGrid, PenLine, ArrowUpRight } from 'lucide-react';
import { Skeleton } from '../common/Skeleton';

const PostCard = ({ post, onClick }) => (
  <article
    className="group/card relative cursor-pointer"
    onClick={() => onClick(post)}
  >
    {/* Hover border overlay */}
    <div className="absolute inset-0 z-10 pointer-events-none rounded-[2rem] border-2 border-transparent group-hover/card:border-dashed group-hover/card:border-amber-300/60 transition-all duration-300" />

    {/* Floating action label */}
    <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-300 pointer-events-none">
      <div className="flex items-center gap-2 px-5 py-2.5 bg-[#0C0901]/90 backdrop-blur-sm rounded-2xl text-white text-[12px] font-black shadow-2xl border border-white/[0.06]">
        <PenLine size={12} className="text-amber-400" />
        Manage post
      </div>
    </div>

    {/* Faded content */}
    <div className="opacity-55 group-hover/card:opacity-20 transition-opacity duration-300 select-none pointer-events-none">
      <div className="aspect-[16/10] bg-amber-50 rounded-[2rem] overflow-hidden mb-8 border border-stone-100">
        {post.featuredImage || post.main_image ? (
          <img
            src={post.featuredImage || post.main_image}
            alt={post.title}
            className="w-full h-full object-cover"
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
        
        <h2 className="text-3xl font-black text-[#0C0901] leading-tight tracking-tight flex items-start gap-2">
          {post.title}
          <ArrowUpRight className="mt-1 opacity-40 shrink-0" size={24} />
        </h2>
        
        <p className="text-[#606060] text-sm leading-relaxed line-clamp-3 font-medium max-w-lg">
          {post.excerpt}
        </p>
        
        <div className="flex items-center gap-4 pt-4">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center border border-stone-100 overflow-hidden">
            {post.author?.avatar ? (
              <img src={post.author.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-black text-amber-400 uppercase">
                {(post.author?.name ?? post.author ?? "?")?.[0]}
              </span>
            )}
          </div>
          
          <div>
            <h5 className="text-[#0C0901] font-black text-sm">
              {post.author?.name ?? post.author}
            </h5>
            <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">
              {post.author?.date ??
                new Date(post.published_at || post.createdAt).toLocaleDateString("en-US", {
                  year: "numeric", month: "long", day: "numeric",
                })}
            </p>
          </div>
        </div>
      </div>
    </div>
  </article>
);

const PostsGrid = ({ posts, loading, onPostClick, onViewAll, activeCategory }) => {
  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-x-12 gap-y-20">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="aspect-[16/10] w-full rounded-[2rem]" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-3/4 rounded-xl" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-2xl font-black text-[#0C0901] mb-2">No posts here yet.</p>
        <button
          onClick={onViewAll}
          className="mt-4 px-5 py-2.5 bg-amber-400 text-[#0C0901] text-sm font-bold rounded-xl hover:bg-amber-500 transition-colors"
        >
          View all posts
        </button>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-x-12 gap-y-20">
      {posts.map(post => (
        <PostCard key={post.id} post={post} onClick={onPostClick} />
      ))}
    </div>
  );
};

export default PostsGrid;