/**
 * AboutPageEditor.jsx
 *
 * Entry point for the about page editor.
 * Thin orchestrator — all state lives in useAboutEditor,
 * all layout lives in the section components.
 *
 * ── Shared primitives used here ─────────────────────────────────────────────
 *
 *  editor/components/
 *    EditableText     → used inside every section component
 *    EditableImage    → used in hero, pillars, staff cards
 *    EditorToolbar    → sticky save bar (same as home + contact)
 *    Toast            → notifications (same as home + contact)
 *    SectionDivider   → decorative separator (same as home + contact)
 *
 *  editor/api/homepageApi.js
 *    API              → shared axios instance (auth configured once)
 *    ROLE             → typed media role constants
 *
 * ── File structure for this page ────────────────────────────────────────────
 *
 *  about/
 *   ├── api/
 *   │   └── aboutApi.js                  Fetch + save endpoints
 *   ├── hooks/
 *   │   └── useAboutEditor.js            All state + mutations
 *   ├── sections/
 *   │   ├── AboutBreadcrumbHeader.jsx    Nav + page title
 *   │   ├── AboutHeroSection.jsx         Brand name + display title + hero image
 *   │   ├── AboutPillarsSection.jsx      Pillar 1 (3-col) + Pillar 2 (coloured card)
 *   │   └── AboutStaffSection.jsx        Header + 3-column staff grid
 *   └── AboutPageEditor.jsx              ← you are here
 */

import { useAboutEditor }          from "./hooks/useAboutEditor";
import { EditorToolbar, Toast, SectionDivider } from "../HomePageEditor/components/EditorUI";

import AboutBreadcrumbHeader from "./sections/AboutBreadcrumbHeader";
import AboutHeroSection      from "./sections/AboutHeroSection";
import AboutPillarsSection   from "./sections/AboutPillarsSection";
import AboutStaffSection     from "./sections/AboutStaffSection";

// ─────────────────────────────────────────────────────────────────────────────

function AboutPageEditor() {
  const {
    data,
    loading,
    error,
    hasChanges,
    saving,
    toast,
    clearToast,
    updateContent,
    updatePillar,
    updateStaffMember,
    handleMediaSuccess,
    handleSave,
    getSection,
    addStaffMember,
    removeStaffMember,
  } = useAboutEditor();

  // ── Loading / error ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-20 text-center">
        <div className="w-12 h-12 border-4 border-[#FFAA14] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-black italic text-stone-300 text-sm">
          Wiibi is loading…
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">Editor Error</h1>
          <p className="text-gray-500">{error || "Page not found."}</p>
        </div>
      </div>
    );
  }

  // ── Resolve section ────────────────────────────────────────────────────────

  const aboutHero = getSection("about_hero");
  const { brand_info, hero_section, pillars, staff_header, staff_grid } =
    aboutHero.content;

  // Shorthand: all content changes route through updateContent("about_hero", ...)
  const onUpdateContent = (dotPath, value) =>
    updateContent("about_hero", dotPath, value);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pb-32">

      {/* Reused sticky toolbar */}
      <EditorToolbar
        hasChanges={hasChanges}
        saving={saving}
        onSave={handleSave}
        onToggleAddPanel={() => {}} // no add-section needed for about page
      />

      <main className="bg-white selection:bg-amber-100 font-sans mt-14">

        {/* ── Breadcrumb + page title ── */}
        <AboutBreadcrumbHeader
          brandInfo={brand_info}
          onUpdateContent={onUpdateContent}
        />

        <SectionDivider />

        {/* ── Hero: brand name, display title, hero image ── */}
        <AboutHeroSection
          brandInfo={brand_info}
          heroSection={hero_section}
          sectionId={aboutHero.id}
          onUpdateContent={onUpdateContent}
          onMediaSuccess={(role, url) =>
            handleMediaSuccess("about_hero", role, url)
          }
        />

        {/* ── Value pillars ── */}
        <AboutPillarsSection
          pillars={pillars}
          sectionId={aboutHero.id}
          onUpdatePillar={(index, field, value) =>
            updatePillar(index, field, value)
          }
          onMediaSuccess={(role, url) =>
            handleMediaSuccess("about_hero", role, url)
          }
        />

        <SectionDivider />

        {/* ── Staff grid ── */}
     <AboutStaffSection
  staffHeader={staff_header}
  staffGrid={staff_grid}
  sectionId={aboutHero.id}
  onUpdateContent={onUpdateContent}
  onUpdateStaffMember={(index, field, value) => updateStaffMember(index, field, value)}
  onAddStaff={addStaffMember}
  onRemoveStaff={removeStaffMember}
  onMediaSuccess={(role, url) => handleMediaSuccess("about_hero", role, url)}
/>

        <SectionDivider />

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

export default AboutPageEditor;