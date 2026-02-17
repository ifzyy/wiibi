import { useState, useEffect } from "react";
import { Icon, I } from "../utils/icons.jsx";
import { toast } from "react-toastify";

const FAQsManager = ({ activePageId, onHasChanges, onSaveRef, token }) => {
  const [faqs, setFaqs] = useState({
    general: [],
    products: [],
    technical: [],
  });
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "",
    order: 0,
    published: true,
  });

  const categoryMap = {
    "faq-general": "general",
    "faq-products": "products",
    "faq-technical": "technical",
  };

  const currentCategory = categoryMap[activePageId] || "general";

  const categoryLabels = {
    general: "General",
    products: "Products",
    technical: "Technical",
  };

  useEffect(() => {
    loadFaqs();
  }, []);

  const loadFaqs = () => {
    // Mock data - replace with actual API call
    setFaqs({
      general: [
        {
          id: 1,
          question: "What services does Wiibi Energy provide?",
          answer:
            "We provide comprehensive renewable energy solutions including solar panel installation, wind turbine deployment, energy audits, and ongoing maintenance services.",
          category: "general",
          order: 1,
          published: true,
        },
        {
          id: 2,
          question: "How long does installation typically take?",
          answer:
            "Installation timelines vary based on project size. Residential solar installations typically take 1-3 days, while commercial projects may take 1-4 weeks depending on complexity.",
          category: "general",
          order: 2,
          published: true,
        },
      ],
      products: [
        {
          id: 3,
          question: "What types of solar panels do you offer?",
          answer:
            "We offer monocrystalline, polycrystalline, and thin-film solar panels from leading manufacturers. Our team will recommend the best option based on your specific needs and budget.",
          category: "products",
          order: 1,
          published: true,
        },
        {
          id: 4,
          question: "Do you provide warranties on your products?",
          answer:
            "Yes, all our products come with comprehensive warranties. Solar panels typically have 25-year performance warranties, while inverters have 10-15 year warranties.",
          category: "products",
          order: 2,
          published: true,
        },
      ],
      technical: [
        {
          id: 5,
          question: "Can solar panels work during cloudy days?",
          answer:
            "Yes, solar panels can still generate electricity on cloudy days, though at reduced efficiency (typically 10-25% of normal output). Modern panels are designed to capture diffuse light.",
          category: "technical",
          order: 1,
          published: true,
        },
        {
          id: 6,
          question: "What maintenance is required for solar systems?",
          answer:
            "Solar systems require minimal maintenance. We recommend annual inspections and periodic cleaning. Most systems come with monitoring software to track performance.",
          category: "technical",
          order: 2,
          published: true,
        },
      ],
    });
  };

  const handleAdd = () => {
    setEditingFaq(null);
    setFormData({
      question: "",
      answer: "",
      category: currentCategory,
      order: faqs[currentCategory].length + 1,
      published: true,
    });
    setShowModal(true);
  };

  const handleEdit = (faq) => {
    setEditingFaq(faq);
    setFormData(faq);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this FAQ?")) {
      setFaqs({
        ...faqs,
        [currentCategory]: faqs[currentCategory].filter((f) => f.id !== id),
      });
      toast.success("FAQ deleted successfully");
      onHasChanges(true);
    }
  };

  const handleSave = () => {
    const newFaq = {
      ...formData,
      id: editingFaq?.id || Date.now(),
      category: currentCategory,
    };

    if (editingFaq) {
      setFaqs({
        ...faqs,
        [currentCategory]: faqs[currentCategory].map((f) =>
          f.id === editingFaq.id ? newFaq : f
        ),
      });
    } else {
      setFaqs({
        ...faqs,
        [currentCategory]: [...faqs[currentCategory], newFaq],
      });
    }

    setShowModal(false);
    toast.success(editingFaq ? "FAQ updated" : "FAQ added");
    onHasChanges(true);
  };

  const togglePublished = (id) => {
    setFaqs({
      ...faqs,
      [currentCategory]: faqs[currentCategory].map((f) =>
        f.id === id ? { ...f, published: !f.published } : f
      ),
    });
    onHasChanges(true);
  };

  const currentFaqs = faqs[currentCategory] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            {categoryLabels[currentCategory]} FAQs
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage frequently asked questions in this category
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/30 transition-all hover:scale-105"
        >
          <Icon d={I.plus} size={16} strokeWidth={2.5} />
          Add FAQ
        </button>
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {currentFaqs.map((faq, index) => (
          <div
            key={faq.id}
            className={`bg-white rounded-2xl border ${
              faq.published ? "border-slate-200" : "border-slate-300 opacity-60"
            } shadow-sm hover:shadow-lg transition-all p-6`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                <span className="text-sm font-black text-amber-700">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="font-bold text-slate-900 text-base leading-tight">
                    {faq.question}
                  </h3>
                  <div className="flex items-center gap-2">
                    {!faq.published && (
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                        Draft
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  {faq.answer}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePublished(faq.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      faq.published
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Icon
                      d={faq.published ? I.eye : I.eyeOff}
                      size={14}
                      strokeWidth={2}
                    />
                    {faq.published ? "Published" : "Draft"}
                  </button>
                  <button
                    onClick={() => handleEdit(faq)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    <Icon d={I.edit} size={16} strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => handleDelete(faq.id)}
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
        {currentFaqs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-200">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Icon d={I.helpCircle} size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No FAQs yet</h3>
            <p className="text-sm text-slate-500 mb-6">
              Start by adding your first question and answer
            </p>
            <button
              onClick={handleAdd}
              className="px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg"
            >
              Add FAQ
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
                {editingFaq ? "Edit FAQ" : "Add New FAQ"}
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
                  Question
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  placeholder="Enter the question"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Answer
                </label>
                <textarea
                  value={formData.answer}
                  onChange={(e) =>
                    setFormData({ ...formData, answer: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm resize-none"
                  rows={6}
                  placeholder="Enter the answer"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.published}
                  onChange={(e) =>
                    setFormData({ ...formData, published: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="published" className="text-sm font-bold text-slate-700">
                  Publish immediately
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
                {editingFaq ? "Update FAQ" : "Add FAQ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FAQsManager;
