import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import api from "../utils/api";

const FAQsManager = ({ onHasChanges }) => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [showModal, setShowModal] = useState(false);
  
  // States for Deletion Flow
  const [deleteConfirm, setDeleteConfirm] = useState(null); // Holds the FAQ object to delete
  const [successType, setSuccessType] = useState(null); // 'updated' | 'deleted' | null

  const [editingFaq, setEditingFaq] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    display_order: 0,
    is_visible: true,
  });

  const loadFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/faqs");
      setFaqs(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFaqs(); }, [loadFaqs]);

  const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleAdd = () => {
    setEditingFaq(null);
    setFormData({ question: "", answer: "", display_order: faqs.length * 10 + 10, is_visible: true });
    setShowModal(true);
  };

  const handleEdit = (faq, e) => {
    e.stopPropagation();
    setEditingFaq(faq);
    setFormData({ ...faq });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) return;
    setSubmitting(true);
    try {
      if (editingFaq) await api.put(`/admin/faqs/${editingFaq.id}`, formData);
      else await api.post("/admin/faqs", formData);
      
      setShowModal(false);
      setSuccessType('updated');
      onHasChanges?.(true);
      await loadFaqs();
    } catch (err) {
      toast.error("Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  // --- New Deletion Logic ---
  const initiateDelete = (faq, e) => {
    e.stopPropagation();
    setDeleteConfirm(faq); // Open confirmation modal
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/admin/faqs/${deleteConfirm.id}`);
      setFaqs((prev) => prev.filter((f) => f.id !== deleteConfirm.id));
      setDeleteConfirm(null); // Close confirm modal
      setSuccessType('deleted'); // Show success modal
      onHasChanges?.(true);
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const left = faqs.slice(0, 7);
  const right = faqs.slice(7);

  const FaqRow = ({ faq }) => (
    <div className={`mb-6 ${!faq.is_visible ? "opacity-40" : ""}`}>
      <div className="flex items-center justify-between cursor-pointer group" onClick={() => toggleExpand(faq.id)}>
        <h3 className="text-[15px] font-semibold text-slate-800 pr-4">{faq.question}</h3>
        <div className="flex items-center gap-4">
          <svg className={`w-4 h-4 text-orange-500 transition-transform ${expanded[faq.id] ? "" : "rotate-180"}`} fill="currentColor" viewBox="0 0 20 20"><path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" /></svg>
          <button onClick={(e) => handleEdit(faq, e)} className="bg-[#f2f2f2] cursor-pointer hover:bg-slate-100 px-3 py-1 rounded text-xs font-medium border border-transparent hover:border-slate-200">Edit</button>
          <button onClick={(e) => initiateDelete(faq, e)} className="text-red-400 hover:text-red-600 p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
      {expanded[faq.id] && (
        <div className="mt-3 p-4 bg-[#f2f2f2] rounded-md text-sm text-slate-600 leading-relaxed border-l-4 border-amber-400">{faq.answer}</div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-12 bg-[#F9FAFB] min-h-screen font-sans">
      {/* Header unchanged */}
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl font-light text-slate-500">?</span>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">FAQs</h1>
        </div>
        <p className="text-slate-500 text-sm">Edit, manage and give feedback on frequently asked questions.</p>
      </header>

      {loading ? (
        <div className="text-slate-400 animate-pulse">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24">
          <div className="space-y-2">{left.map(faq => <FaqRow key={faq.id} faq={faq} />)}</div>
          <div className="flex flex-col">
            <div className="space-y-2">{right.map(faq => <FaqRow key={faq.id} faq={faq} />)}</div>
            <button onClick={handleAdd} className="mt-4 w-full bg-[#FFB319] hover:bg-[#E6A117] text-white font-bold py-4 rounded-lg shadow-sm transition-all text-base">Add</button>
          </div>
        </div>
      )}

      {/* 1. EDIT/CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg p-8 shadow-2xl rounded-xl">
            <h2 className="text-xl font-bold mb-6 text-slate-900">{editingFaq ? "Edit FAQ" : "Create FAQ"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Question</label>
                <input className="w-full bg-[#f2f2f2] p-3 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none" value={formData.question} onChange={e => setFormData({...formData, question: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Answer</label>
                <textarea className="w-full bg-[#f2f2f2] p-3 h-32 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none resize-none" value={formData.answer} onChange={e => setFormData({...formData, answer: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="px-6 py-2 text-slate-500 font-semibold">Cancel</button>
                <button onClick={handleSave} className="px-6 py-2 bg-[#FFB319] text-white rounded-lg font-bold">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CONFIRM DELETE MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[55]">
          <div className="bg-white w-[400px] p-8 shadow-2xl rounded-xl text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Delete FAQ?</h2>
            <p className="text-slate-500 text-sm mb-8">Are you sure you want to delete this FAQ? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-3 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SUCCESS MODAL (Updated or Deleted) */}
      {successType && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white w-[340px] p-10 shadow-2xl rounded-lg text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-[#009A00] rounded-full flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-medium text-slate-900 mb-8 whitespace-nowrap">
              {successType === 'updated' ? 'FAQ Updated' : 'FAQ Deleted'}
            </h2>
            <button onClick={() => setSuccessType(null)} className="w-full bg-[#FFB319] hover:bg-[#E6A117] text-white font-bold py-3.5 rounded-lg transition-colors text-lg">
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FAQsManager;