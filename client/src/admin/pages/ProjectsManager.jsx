import { useState, useEffect } from "react";
import { Icon, I } from "../utils/icons.jsx";
import { toast } from "react-toastify";

const ProjectsManager = ({ activePageId, onHasChanges, onSaveRef, token }) => {
  const [projects, setProjects] = useState([]);
  const [caseStudies, setCaseStudies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    image: "",
    client: "",
    date: "",
    tags: [],
    featured: false,
  });

  const isProjectsView = activePageId === "projects-list";
  const isCaseStudiesView = activePageId === "case-studies";

  useEffect(() => {
    // Load data from API or localStorage
    loadData();
  }, []);

  const loadData = () => {
    // Mock data - replace with actual API call
    setProjects([
      {
        id: 1,
        title: "Solar Farm Installation - Northern Region",
        description: "Complete solar installation providing 5MW of clean energy",
        category: "Solar Energy",
        client: "Green Energy Corp",
        date: "2024-01",
        tags: ["Solar", "Commercial", "5MW"],
        featured: true,
        image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800",
      },
      {
        id: 2,
        title: "Wind Turbine Park Development",
        description: "State-of-the-art wind energy facility with 20 turbines",
        category: "Wind Energy",
        client: "WindTech Solutions",
        date: "2023-11",
        tags: ["Wind", "Commercial", "20 Turbines"],
        featured: false,
        image: "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?w=800",
      },
    ]);

    setCaseStudies([
      {
        id: 1,
        title: "Reducing Energy Costs by 40% - Manufacturing Plant",
        description: "Comprehensive energy audit and implementation case study",
        category: "Energy Efficiency",
        client: "Delta Manufacturing",
        date: "2024-02",
        tags: ["Efficiency", "Industrial", "ROI"],
        featured: true,
        image: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800",
      },
    ]);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      title: "",
      description: "",
      category: "",
      image: "",
      client: "",
      date: "",
      tags: [],
      featured: false,
    });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this item?")) {
      if (isProjectsView) {
        setProjects(projects.filter((p) => p.id !== id));
      } else {
        setCaseStudies(caseStudies.filter((c) => c.id !== id));
      }
      toast.success("Deleted successfully");
      onHasChanges(true);
    }
  };

  const handleSave = () => {
    const newItem = {
      ...formData,
      id: editingItem?.id || Date.now(),
    };

    if (isProjectsView) {
      if (editingItem) {
        setProjects(projects.map((p) => (p.id === editingItem.id ? newItem : p)));
      } else {
        setProjects([...projects, newItem]);
      }
    } else {
      if (editingItem) {
        setCaseStudies(
          caseStudies.map((c) => (c.id === editingItem.id ? newItem : c))
        );
      } else {
        setCaseStudies([...caseStudies, newItem]);
      }
    }

    setShowModal(false);
    toast.success(editingItem ? "Updated successfully" : "Added successfully");
    onHasChanges(true);
  };

  const currentItems = isProjectsView ? projects : caseStudies;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            {isProjectsView ? "Projects" : "Case Studies"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage your {isProjectsView ? "project" : "case study"} portfolio
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/30 transition-all hover:scale-105"
        >
          <Icon d={I.plus} size={16} strokeWidth={2.5} />
          Add {isProjectsView ? "Project" : "Case Study"}
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all group"
          >
            <div className="relative h-48 overflow-hidden bg-slate-100">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              )}
              {item.featured && (
                <div className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  Featured
                </div>
              )}
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-bold text-slate-900 text-sm leading-tight flex-1">
                  {item.title}
                </h3>
              </div>
              <p className="text-xs text-slate-600 mb-4 line-clamp-2">
                {item.description}
              </p>
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {item.tags?.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  <span className="font-semibold">{item.client}</span>
                  <span className="mx-2">•</span>
                  <span>{item.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    <Icon d={I.edit} size={16} strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors"
                  >
                    <Icon d={I.trash} size={16} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {currentItems.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Icon d={I.briefcase} size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              No {isProjectsView ? "projects" : "case studies"} yet
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Get started by adding your first{" "}
              {isProjectsView ? "project" : "case study"}
            </p>
            <button
              onClick={handleAdd}
              className="px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg"
            >
              Add {isProjectsView ? "Project" : "Case Study"}
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">
                {editingItem ? "Edit" : "Add New"}{" "}
                {isProjectsView ? "Project" : "Case Study"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
              >
                <Icon d={I.x} size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  placeholder="Enter title"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm resize-none"
                  rows={4}
                  placeholder="Enter description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    placeholder="e.g., Solar Energy"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Client
                  </label>
                  <input
                    type="text"
                    value={formData.client}
                    onChange={(e) =>
                      setFormData({ ...formData, client: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    placeholder="Client name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Date
                  </label>
                  <input
                    type="text"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    placeholder="YYYY-MM"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) =>
                      setFormData({ ...formData, image: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.tags?.join(", ")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tags: e.target.value.split(",").map((t) => t.trim()),
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  placeholder="Solar, Commercial, 5MW"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) =>
                    setFormData({ ...formData, featured: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="featured" className="text-sm font-bold text-slate-700">
                  Feature this {isProjectsView ? "project" : "case study"}
                </label>
              </div>
            </div>
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg transition-all"
              >
                {editingItem ? "Update" : "Add"}{" "}
                {isProjectsView ? "Project" : "Case Study"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsManager;
