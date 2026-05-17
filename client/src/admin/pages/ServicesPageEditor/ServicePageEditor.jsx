/**
 * ServicesPageEditor.jsx
 *
 * Entry point for the services page editor.
 * Thin orchestrator — all state lives in useServicesEditor,
 * all layout lives in the section components.
 *
 * ── Page sections ────────────────────────────────────────────────────────────
 *
 *  "hero"            ServicesHeroSection       breadcrumb + title + subtitle
 *  "main"            ServicesMainSection        alternating image + text steps
 *  "contact_process" ServicesContactProcess...  header + process steps + quote form
 *
 * ── Shared primitives ────────────────────────────────────────────────────────
 *
 *  editor/components/
 *    EditableText     used inside every section
 *    EditableImage    used in ServicesMainSection step cards
 *    EditorToolbar    sticky save bar
 *    Toast            notifications
 *    SectionDivider   decorative separator
 *
 *  editor/api/homepageApi.js
 *    API    shared axios instance (auth configured once)
 *    ROLE   typed media role constants
 *
 * ── File structure ───────────────────────────────────────────────────────────
 *
 *  services/
 *   ├── api/
 *   │   └── servicesApi.js
 *   ├── hooks/
 *   │   └── useServicesEditor.js
 *   ├── sections/
 *   │   ├── ServicesHeroSection.jsx
 *   │   ├── ServicesMainSection.jsx
 *   │   ├── ContactProcessHeader.jsx
 *   │   ├── ProcessSteps.jsx
 *   │   ├── QuoteForm.jsx
 *   │   └── ServicesContactProcessSection.jsx
 *   └── ServicesPageEditor.jsx              ← you are here
 */

import { useServicesEditor } from "./hooks/useServicesEditor";
import { EditorToolbar, Toast, SectionDivider } from "../HomePageEditor/components/EditorUI"

import ServicesHeroSection           from "./sections/ServicesHeroSection";
import ServicesMainSection           from "./sections/ServicesMainSection";
import ServicesContactProcessSection from "./sections/ServicesContactProcessSection";

// ─────────────────────────────────────────────────────────────────────────────

function ServicesPageEditor() {
  const {
    data,
    loading,
    error,
    hasChanges,
    saving,
    toast,
    clearToast,
    updateContent,
    updateMainStep,
    updateProcessStep,
    updateFormField,
    updateSubmitButtonText,
    handleMediaSuccess,
    handleSave,
    getSection,
  } = useServicesEditor();

  // ── Loading / error ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-8 h-8 border-2 border-[#FFAA14] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Editor…</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">Editor Error</h1>
          <p className="text-gray-500">{error || "Failed to load services page."}</p>
        </div>
      </div>
    );
  }

  // ── Resolve sections ───────────────────────────────────────────────────────

  const heroSection           = getSection("hero");
  const mainSection           = getSection("main");
  const contactProcessSection = getSection("contact_process");

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pb-32">

      {/* Reused sticky toolbar */}
      <EditorToolbar
        hasChanges={hasChanges}
        saving={saving}
        onSave={handleSave}
        onToggleAddPanel={() => {}} // no add-section UI needed for services
      />

      <main className="bg-white min-h-screen mt-14">

        {/* ── HERO ── */}
        {heroSection.content.title !== undefined && (
          <ServicesHeroSection
            section={heroSection}
            onUpdateContent={(dotPath, value) =>
              updateContent("hero", dotPath, value)
            }
          />
        )}

        <SectionDivider />

        {/* ── SERVICE STEPS ── */}
        {mainSection.content.main_steps && (
          <ServicesMainSection
            section={mainSection}
            onUpdateStep={(index, field, value) =>
              updateMainStep(index, field, value)
            }
            onMediaSuccess={(role, url) =>
              handleMediaSuccess("main", role, url)
            }
          />
        )}

        <SectionDivider />

        {/* ── PROCESS + QUOTE FORM ── */}
        {contactProcessSection.content.header && (
          <ServicesContactProcessSection
            section={contactProcessSection}
            onUpdateContent={(dotPath, value) =>
              updateContent("contact_process", dotPath, value)
            }
            onUpdateProcessStep={(index, field, value) =>
              updateProcessStep(index, field, value)
            }
            onUpdateFormField={(index, field, value) =>
              updateFormField(index, field, value)
            }
            onUpdateSubmitText={(value) =>
              updateSubmitButtonText(value)
            }
          />
        )}

      </main>

      {/* Reused toast */}
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

export default ServicesPageEditor;