import { useState, useEffect } from "react";
import axios from "axios";
import BlogListView from "./BlogListView.jsx";
import BlogEditorView from "./BlogEditorView.jsx";
import "./styles/blogManager.css";

export default function BlogManager() {
  const [view, setView] = useState("list");
  const [editingBlog, setEditingBlog] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [categories,  setCategories]  = useState([]);

  // Fetch category list from CMS once — feeds the BlogForm dropdown
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/public/pages/blog")
      .then(({ data }) => {
        const section = data?.sections?.find((s) => s.type === "blog_grid");
        const cats = section?.content?.categories ?? [];
        setCategories(cats);
      })
      .catch(() => {}); // non-fatal
  }, []);

  const goToList = () => { setView("list"); setEditingBlog(null); };
  const goToCreate = () => { setEditingBlog(null); setView("create"); };
  const goToEdit = (blog) => { setEditingBlog(blog); setView("edit"); };
  const handleSaved = () => { setRefreshKey(k => k + 1); goToList(); };

  const isEditor = view === "create" || view === "edit";

  return (
    <div className="bm-root">
      {/* Nav */}


      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {view === "list" && (
          <BlogListView key={refreshKey} onEdit={goToEdit} onNew={goToCreate} />
        )}
        {isEditor && (
          <BlogEditorView editingBlog={editingBlog} onSaved={handleSaved} onCancel={goToList} categories={categories} />
        )}
      </main>
    </div>
  );
}