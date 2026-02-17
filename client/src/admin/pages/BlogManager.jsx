import { useState } from "react";
import { Icon, I } from "../utils/icons.jsx";
import { toast } from "react-toastify";

const DEMO_POSTS = [
  {
    id: 1,
    title: "How Solar Energy is Changing Nigeria",
    slug: "solar-energy-nigeria",
    status: "published",
    category: "News",
    excerpt:
      "With rising electricity costs, solar energy has become the go-to solution for homes and businesses across Nigeria.",
    image_url:
      "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=400",
    date: "2024-12-01",
    featured: true,
  },
  {
    id: 2,
    title: "Top 5 Inverter Systems for Small Businesses",
    slug: "inverter-systems-small-business",
    status: "published",
    category: "Guide",
    excerpt:
      "Choosing the right inverter can save your business thousands. Here is our comprehensive breakdown.",
    image_url:
      "https://images.unsplash.com/photo-1486946255434-2466348c2166?w=400",
    date: "2024-11-20",
    featured: false,
  },
  {
    id: 3,
    title: "Buy Now Pay Later Solar Plans",
    slug: "buy-now-pay-later",
    status: "draft",
    category: "Finance",
    excerpt:
      "Introducing flexible payment plans that make solar accessible for every Nigerian household.",
    image_url:
      "https://images.unsplash.com/photo-1556155099-490a1ba16284?w=400",
    date: "2024-11-10",
    featured: false,
  },
  {
    id: 4,
    title: "Solar Maintenance: A Complete Guide",
    slug: "solar-maintenance-guide",
    status: "draft",
    category: "Guide",
    excerpt:
      "Keep your solar system running at peak efficiency with these expert maintenance tips.",
    image_url:
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400",
    date: "2024-10-30",
    featured: false,
  },
];

const STATUS_STYLES = {
  published: "bg-emerald-100 text-emerald-700",
  draft: "bg-[#FFAA14 ] -100 text-[#FFAA14 ] -500",
};

export const BlogManagerPage = () => {
  const [posts, setPosts] = useState(DEMO_POSTS);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("All");

  const filtered = posts.filter(
    (p) => filter === "All" || p.status === filter || p.category === filter,
  );
  const categories = [
    "All",
    "Published",
    "Draft",
    ...new Set(posts.map((p) => p.category)),
  ];

  const toggleStatus = (id) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: p.status === "published" ? "draft" : "published" }
          : p,
      ),
    );
    toast.success("Post status updated");
  };
  const deletePost = (id) => {
    if (!window.confirm("Delete this post?")) return;
    setPosts((prev) => prev.filter((p) => p.id !== id));
    if (selected?.id === id) setSelected(null);
    toast.success("Post deleted");
  };
  const newPost = () => {
    const p = {
      id: Date.now(),
      title: "New Post",
      slug: "new-post",
      status: "draft",
      category: "News",
      excerpt: "",
      image_url: "",
      date: new Date().toISOString().split("T")[0],
      featured: false,
    };
    setPosts((prev) => [p, ...prev]);
    setSelected(p);
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left: post list */}
      <div
        className={`flex flex-col border-r  border-stone-50 -100 bg-white transition-all ${selected ? "w-80 flex-shrink-0" : "flex-1"}`}
      >
        {/* Toolbar */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b  border-stone-50 -100">
          <div>
            <p className="text-[#FFAA14 ]   font-black text-[13px]">
              {posts.length} Posts
            </p>
          </div>
          <button
            onClick={newPost}
            className="flex items-center gap-1.5 bg-[#FFAA14 ]   hover:bg-[#FFAA14 ] -800 text-white px-3 py-2 rounded-xl text-[11px] font-bold transition-all"
          >
            <Icon d={I.plus} size={12} /> New post
          </button>
        </div>

        {/* Filter pills */}
        <div className="flex-shrink-0 flex gap-1.5 px-4 py-2.5 overflow-x-auto border-b  border-stone-50 -100">
          {["All", "Published", "Draft"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${filter === f ? "bg-[#FFAA14 ]   text-white" : "bg-[#FFAA14 ] -100 text-[#FFAA14 ] -500 hover:bg-[#FFAA14 ] -200"}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Post list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filtered.map((post) => (
            <button
              key={post.id}
              onClick={() => setSelected(post)}
              className={`w-full text-left rounded-xl p-3 transition-all hover:bg-[#FFAA14 ] -50 group ${selected?.id === post.id ? "bg-amber-50 border border-amber-200" : "border border-transparent"}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#FFAA14 ] -100 flex-shrink-0">
                  <img
                    src={post.image_url}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => (e.target.style.display = "none")}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#FFAA14 ]   font-semibold text-[12px] leading-tight truncate">
                    {post.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase ${STATUS_STYLES[post.status]}`}
                    >
                      {post.status}
                    </span>
                    <span className="text-[#FFAA14 ] -400 text-[10px]">
                      {post.date}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStatus(post.id);
                    }}
                    className="p-1 rounded-md hover:bg-[#FFAA14 ] -200 text-[#FFAA14 ] -400 hover:text-[#FFAA14 ] -700 transition-all"
                    title="Toggle status"
                  >
                    <Icon d={I.eye} size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePost(post.id);
                    }}
                    className="p-1 rounded-md hover:bg-red-50 text-[#FFAA14 ] -400 hover:text-red-500 transition-all"
                  >
                    <Icon d={I.trash} size={12} />
                  </button>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: post editor */}
      {selected ? (
        <div className="flex-1 flex flex-col bg-[#FFAA14 ] -50 overflow-hidden">
          {/* Editor header */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-white border-b  border-stone-50 -100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 hover:bg-[#FFAA14 ] -100 rounded-lg text-[#FFAA14 ] -400 hover:text-[#FFAA14 ] -700 transition-all"
              >
                <Icon d={I.chevronLeft} size={16} />
              </button>
              <span
                className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase ${STATUS_STYLES[selected.status]}`}
              >
                {selected.status}
              </span>
              <span className="text-[#FFAA14 ] -400 text-xs">
                {selected.category}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleStatus(selected.id)}
                className={`px-3 py-2 rounded-xl text-[11px] font-black transition-all border ${selected.status === "draft" ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : " border-stone-50 -200 bg-[#FFAA14 ] -50 text-[#FFAA14 ] -500 hover:bg-[#FFAA14 ] -100"}`}
              >
                {selected.status === "draft" ? "→ Publish" : "→ Unpublish"}
              </button>
              <button
                className="flex items-center gap-1.5 bg-[#FFAA14 ]   hover:bg-[#FFAA14 ] -800 text-white px-4 py-2 rounded-xl font-black text-[11px] transition-all"
                onClick={() => {
                  toast.success("Post saved!");
                }}
              >
                <Icon d={I.save} size={12} /> Save
              </button>
            </div>
          </div>

          {/* Editor body */}
          <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full">
            {/* Featured image */}
            <div className="mb-6 rounded-2xl overflow-hidden bg-[#FFAA14 ] -200 aspect-video relative group">
              {selected.image_url ? (
                <img
                  src={selected.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => (e.target.style.display = "none")}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon d={I.image} size={32} stroke="#b8b3ac" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                <button
                  className="bg-white text-[#FFAA14 ]   px-4 py-2 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2"
                  onClick={() => {
                    const url = prompt("Image URL:", selected.image_url);
                    if (url) {
                      const upd = { ...selected, image_url: url };
                      setSelected(upd);
                      setPosts((p) =>
                        p.map((pp) => (pp.id === upd.id ? upd : pp)),
                      );
                    }
                  }}
                >
                  <Icon d={I.image} size={14} /> Change image
                </button>
              </div>
            </div>

            {/* Category & slug */}
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={selected.category}
                onChange={(e) => {
                  const u = { ...selected, category: e.target.value };
                  setSelected(u);
                  setPosts((p) => p.map((pp) => (pp.id === u.id ? u : pp)));
                }}
                className="bg-white border  border-stone-50 -200 rounded-xl px-3 py-2 text-xs font-semibold text-[#FFAA14 ] -600 focus:outline-none focus:ring-2 focus:ring-amber-300 w-32"
                placeholder="Category"
              />
              <div className="flex items-center gap-1.5 bg-white border  border-stone-50 -200 rounded-xl px-3 py-2 flex-1">
                <span className="text-[#FFAA14 ] -400 text-xs">/blog/</span>
                <input
                  type="text"
                  value={selected.slug}
                  onChange={(e) => {
                    const u = { ...selected, slug: e.target.value };
                    setSelected(u);
                    setPosts((p) => p.map((pp) => (pp.id === u.id ? u : pp)));
                  }}
                  className="flex-1 text-xs text-[#FFAA14 ] -600 outline-none bg-transparent"
                  placeholder="post-url-slug"
                />
              </div>
            </div>

            {/* Title */}
            <textarea
              value={selected.title}
              onChange={(e) => {
                const u = { ...selected, title: e.target.value };
                setSelected(u);
                setPosts((p) => p.map((pp) => (pp.id === u.id ? u : pp)));
              }}
              className="w-full bg-transparent outline-none text-[#FFAA14 ]   text-4xl font-black leading-tight resize-none mb-4 placeholder-[#FFAA14 ] -300"
              placeholder="Post title…"
              rows={2}
            />

            {/* Excerpt */}
            <textarea
              value={selected.excerpt}
              onChange={(e) => {
                const u = { ...selected, excerpt: e.target.value };
                setSelected(u);
                setPosts((p) => p.map((pp) => (pp.id === u.id ? u : pp)));
              }}
              className="w-full bg-transparent outline-none text-[#FFAA14 ] -500 text-lg leading-relaxed resize-none mb-6 placeholder-[#FFAA14 ] -300"
              placeholder="Write a short excerpt…"
              rows={3}
            />

            {/* Body content placeholder */}
            <div className="bg-white rounded-2xl border  border-stone-50 -200 p-8 min-h-64 flex items-center justify-center">
              <div className="text-center">
                <Icon d={I.edit} size={24} stroke="#d4cfc9" />
                <p className="text-[#FFAA14 ] -400 text-sm mt-2 font-medium">
                  Rich text editor goes here
                </p>
                <p className="text-[#FFAA14 ] -300 text-xs mt-1">
                  Connect a WYSIWYG editor like TipTap or Quill
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[#FFAA14 ] -50">
          <div className="text-center">
            <div className="w-20 h-20 rounded-3xl bg-white border  border-stone-50 -200 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <Icon d={I.blog} size={32} stroke="#d4cfc9" />
            </div>
            <h3 className="text-[#FFAA14 ] -500 font-semibold text-base mb-1">
              Select a post to edit
            </h3>
            <p className="text-[#FFAA14 ] -400 text-sm mb-5">
              Or create a new one
            </p>
            <button
              onClick={newPost}
              className="flex items-center gap-2 bg-[#FFAA14 ]   text-white px-5 py-2.5 rounded-xl text-sm font-bold mx-auto hover:bg-[#FFAA14 ] -800 transition-all"
            >
              <Icon d={I.plus} size={14} /> New post
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
