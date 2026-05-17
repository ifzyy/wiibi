/**
 * ContactPageEditor.jsx
 *
 * Entry point for the contact page editor.
 * Thin orchestrator — all state lives in useContactEditor,
 * all UI lives in the section components.
 *
 * ── How shared primitives are reused ────────────────────────────────────────
 *
 *  The editor/components/ folder is shared across ALL page editors.
 *  This page imports directly from there — nothing is duplicated.
 *
 *  editor/components/
 *    EditableText    ← used by every section here
 *    EditableImage   ← available if this page needs editable images
 *    EditableButton  ← available for any CTA buttons
 *    EditableSection ← available to wrap sections with hover label + remove
 *    EditorUI        ← EditorToolbar, Toast, SectionDivider — used below
 *
 *  editor/api/homepageApi.js
 *    API (axios instance) ← shared so auth headers are configured once
 *    ROLE                 ← shared role constants
 *
 * ── File structure for this page ────────────────────────────────────────────
 *
 *  contact/
 *   ├── api/
 *   │   └── contactApi.js             Page-specific endpoints
 *   ├── hooks/
 *   │   └── useContactEditor.js       All state + mutations for this page
 *   ├── sections/
 *   │   ├── ContactHeaderSection.jsx
 *   │   ├── ContactInfoSection.jsx    Connect methods + map
 *   │   └── ContactFaqSection.jsx
 *   └── ContactPageEditor.jsx         ← you are here
 */

import { useState } from "react";
import { ChevronRight } from "lucide-react";

// Shared editor primitives — imported directly, nothing duplicated
import { EditorToolbar, Toast, SectionDivider } from "../HomePageEditor/components/EditorUI";

// Contact-page-specific hook and sections
import { useContactEditor }       from "./hooks/useContactEditor";
import ContactHeaderSection       from "./sections/ContactHeaderSection";
import ContactInfoSection         from "./sections/ContactInfoSection";
import ContactFaqSection          from "./sections/ContactFaqSection";

// ─────────────────────────────────────────────────────────────────────────────

function ContactPageEditor() {
  const {
    data, faqs,
    loading, error,
    hasChanges, saving,
    toast, clearToast,
    updateContent, updateFaq,
    handleSave, getSection,
  } = useContactEditor();

  const [showAddPanel, setShowAddPanel] = useState(false);

  // ── Loading / error ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFAA14] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-black text-stone-300 animate-pulse text-xs uppercase tracking-widest">
            Loading Contact Editor…
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">Editor Error</h1>
          <p className="text-gray-500">{error || "Failed to load contact page."}</p>
        </div>
      </div>
    );
  }

  // ── Resolve sections ───────────────────────────────────────────────────────

  const mainSection = getSection("main");
  const { header, visit_info, connect_info } = mainSection.content;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pb-32">

      {/* Reused sticky toolbar — same component as HomePageEditor */}
      <EditorToolbar
        hasChanges={hasChanges}
        saving={saving}
        onSave={handleSave}
        onToggleAddPanel={() => setShowAddPanel((v) => !v)}
      />

      {showAddPanel && (
        <div className="fixed top-14 right-6 bg-white shadow-2xl border border-gray-100 rounded-2xl p-4 z-50 w-56">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-3 px-1">
            Add Section
          </p>
          {["faq"].map((t) => (
            <button
              key={t}
              onClick={() => setShowAddPanel(false)} // TODO: call createSection API
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-amber-50 rounded-lg capitalize transition"
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <main className="bg-white mt-14">

        {/* Breadcrumbs */}
        <nav className="max-w-7xl mx-auto px-6 pt-12 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-400">
          <a href="/" className="hover:text-stone-900 transition-colors">Home</a>
          <ChevronRight size={10} strokeWidth={3} />
          <span className="text-[#FFAA14]">Contact Us</span>
        </nav>

        {/* Page header: sub-heading + main heading */}
        <ContactHeaderSection
          header={header}
          onUpdateContent={(dotPath, value) =>
            updateContent("main", dotPath, value)
          }
        />

        {/* Contact methods + map */}
        <ContactInfoSection
          visitInfo={visit_info}
          connectInfo={connect_info}
          onUpdateContent={(dotPath, value) =>
            updateContent("main", dotPath, value)
          }
        />

        <SectionDivider />

        {/* FAQ accordion */}
        <ContactFaqSection
          faqs={faqs}
          onUpdate={updateFaq}
        />

      </main>

      {/* Reused toast — same component as HomePageEditor */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={clearToast}
        />
      )}

    </div>
  );
}

export default ContactPageEditor;