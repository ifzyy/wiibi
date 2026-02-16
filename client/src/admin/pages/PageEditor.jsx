import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api.js';
import { SectionWrap } from '../components/SectionWrap.jsx';
import { SECTION_RENDERERS } from '../sections/index.jsx'; // Register your About sections here
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
        // Fetch the specific page data
        const res = await api.get(`/admin/pages/${pageId}`);
        // Ensure we handle both 'PageSections' or 'sections' naming
        const secs = res.data.PageSections || res.data.sections || [];
        
        // Sort by order to maintain the Wiibi layout
        const sortedSecs = [...secs].sort((a, b) => a.order - b.order);
        
        setSections(sortedSecs);
        originalRef.current = JSON.stringify(sortedSecs);
      } catch (err) {
        console.error("Fetch error:", err);
        setSections([]);
        toast.error("Failed to load page content.");
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
    if (saving) return;
    setSaving(true);
    try {
      // Loop through all sections and push updates
      await Promise.all(sections.map(sec =>
        api.put(`/admin/sections/${sec.id}`, { 
          content: sec.content, 
          is_visible: sec.is_visible,
          order: sec.order // Ensure order is preserved
        })
      ));
      
      originalRef.current = JSON.stringify(sections);
      onHasChanges(false);
      toast.success('🚀 Changes pushed live!');
    } catch (err) {
      toast.error('Save failed. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  // Expose save function to the Dashboard's TopBar
  useEffect(() => {
    if (onSaveRef) onSaveRef.current = saveAll;
  }, [sections]); // Update ref when sections change

  if (loading) return <LoadingState />;

  if (sections.length === 0) return <EmptyState />;

  return (
    <div className="flex flex-col h-full relative">
      {/* Saving Overlay */}
      {saving && (
        <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-white p-6 rounded-3xl shadow-2xl border border-stone-100 flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-stone-900 font-black text-sm uppercase tracking-widest">Pushing to Wiibi...</p>
            </div>
        </div>
      )}

      {/* Editor UI Toolbar */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-white border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          <span className="text-stone-900 text-[11px] font-black uppercase tracking-[0.2em]">Live Layout Editor</span>
        </div>
        <div className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">
            {pageId.replace('page-', '')} context
        </div>
      </div>

      {/* Actual Editable Canvas */}
      <div className="flex-1 overflow-y-auto bg-white p-4 lg:p-10">
        <div className="max-w-6xl mx-auto border border-stone-100 rounded-[3rem] shadow-sm overflow-hidden bg-white">
            {sections.map((sec, idx) => {
              const type = sec.type || sec.section_type;
              const Renderer = SECTION_RENDERERS[type];
              
              if (!Renderer) return (
                <div key={sec.id} className="p-10 text-center text-stone-300 text-xs italic">
                  Unknown Section Type: {type}
                </div>
              );

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
                  {idx < sections.length - 1 && <div className="border-b border-stone-50" />}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

// Sub-components for cleaner code
const LoadingState = () => (
    <div className="flex-1 flex items-center justify-center bg-stone-50">
        <div className="text-center">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-stone-400 text-sm font-medium">Preparing Studio…</p>
        </div>
    </div>
);

const EmptyState = () => (
    <div className="flex-1 flex items-center justify-center bg-stone-50">
        <div className="text-center max-w-xs">
            <div className="w-20 h-20 rounded-3xl bg-white border border-stone-100 flex items-center justify-center mx-auto mb-5 shadow-sm">
                <Icon d={I.layout} size={32} className="text-stone-200" />
            </div>
            <h3 className="text-stone-900 font-black text-lg mb-1 uppercase tracking-tight">Empty Canvas</h3>
            <p className="text-stone-400 text-sm font-medium">This page doesn't have any sections assigned in the database yet.</p>
        </div>
    </div>
);