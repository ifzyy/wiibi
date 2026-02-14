import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api.js';
import { SectionWrap } from '../components/SectionWrap.jsx';
import { SECTION_RENDERERS } from '../sections/index.jsx';
import { Icon, I } from '../utils/icons.jsx';
import { toast } from 'react-toastify';

export const PageEditor = ({ pageId, onHasChanges, onSaveRef }) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const originalRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      onHasChanges(false);
      try {
        const res = await api.get(`/admin/pages/${pageId}`);
        const secs = res.data.PageSections || [];
        setSections(secs);
        originalRef.current = JSON.stringify(secs);
      } catch {
        setSections([]);
      } finally {
        setLoading(false);
      }
    };
    if (pageId) fetchData();
  }, [pageId]);

  const updateSectionContent = (sectionId, newContent) => {
    setSections(prev => {
      const updated = prev.map(s => s.id === sectionId ? { ...s, content: newContent } : s);
      const changed = JSON.stringify(updated) !== originalRef.current;
      onHasChanges(changed);
      return updated;
    });
  };

  const toggleVisibility = (sectionId) => {
    setSections(prev => {
      const updated = prev.map(s => s.id === sectionId ? { ...s, is_visible: !s.is_visible } : s);
      onHasChanges(true);
      return updated;
    });
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      await Promise.all(sections.map(sec =>
        api.put(`/admin/sections/${sec.id}`, { content: sec.content, is_visible: sec.is_visible })
      ));
      originalRef.current = JSON.stringify(sections);
      onHasChanges(false);
      toast.success('🚀 Changes pushed live!');
    } catch {
      toast.error('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Expose saveAll to parent via ref callback
  useEffect(() => {
    if (onSaveRef) onSaveRef.current = saveAll;
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-stone-400 text-sm font-medium">Loading editor…</p>
        </div>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-stone-100 flex items-center justify-center mx-auto mb-5">
            <Icon d={I.layout} size={32} stroke="#d4cfc9" />
          </div>
          <h3 className="text-stone-500 text-base font-semibold mb-1">No sections yet</h3>
          <p className="text-stone-400 text-sm">This page has no editable sections.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Editor hint strip */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-2 bg-amber-50 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-amber-700 text-[11px] font-bold uppercase tracking-widest">Live Editor</span>
          <span className="text-amber-500/70 text-[11px] ml-1 hidden sm:inline">
            — Hover sections to toggle visibility · Click any text or image to edit
          </span>
        </div>
        <button
          onClick={saveAll}
          disabled={saving}
          className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-black px-3 py-1.5 rounded-lg text-[11px] font-black transition-all shadow-sm shadow-amber-300/40 disabled:opacity-50"
        >
          <Icon d={saving ? I.refresh : I.zap} size={11} />
          {saving ? 'Saving…' : 'Save & push'}
        </button>
      </div>

      {/* Page canvas */}
      <div className="flex-1 overflow-y-auto bg-white">
        <style>{`
          .editable-idle:hover {
            background-color: rgba(251, 191, 36, 0.08);
            outline: 1.5px dashed rgba(251, 191, 36, 0.6);
            outline-offset: 2px;
            border-radius: 3px;
          }
        `}</style>

        {sections.map((sec, idx) => {
          const type = sec.type || sec.section_type;
          const Renderer = SECTION_RENDERERS[type];
          if (!Renderer) return null;
          return (
            <div key={sec.id}>
              <SectionWrap
                type={type}
                isVisible={sec.is_visible !== false}
                onToggleVisibility={() => toggleVisibility(sec.id)}
              >
                <Renderer
                  content={sec.content || {}}
                  onChange={c => updateSectionContent(sec.id, c)}
                />
              </SectionWrap>
              {idx < sections.length - 1 && <div className="border-b border-stone-100" />}
            </div>
          );
        })}

        {/* Bottom padding */}
        <div className="h-16" />
      </div>
    </div>
  );
};
