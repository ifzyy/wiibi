/**
 * HomePageEditor.jsx
 *
 * The main editor entry point. This component is intentionally thin —
 * it only wires together the hook, the toolbar, and the section components.
 *
 * ── File structure ───────────────────────────────────────────────────────────
 *
 *  editor/
 *   ├── api/
 *   │   └── homepageApi.js          All axios calls + ROLE constants
 *   ├── hooks/
 *   │   └── useHomeEditor.js        All state, mutations, save logic
 *   ├── components/
 *   │   ├── EditableText.jsx        contenteditable (fixes the reset bug)
 *   │   ├── FloatingToolbar.jsx     Rich-text toolbar on text selection
 *   │   ├── EditableImage.jsx       Image with edit overlay
 *   │   ├── ImageEditor.jsx         Upload/URL modal → upload → attach
 *   │   ├── EditableButton.jsx      Button with inline text + link editor
 *   │   ├── EditableSection.jsx     Hover wrapper with label + remove
 *   │   └── EditorUI.jsx            EditorToolbar, Toast, SectionDivider
 *   ├── sections/
 *   │   ├── HeroSection.jsx
 *   │   ├── StatsSection.jsx
 *   │   ├── BlogTeaserSection.jsx
 *   │   ├── FaqTeaserSection.jsx
 *   │   └── CtaSection.jsx
 *   └── HomePageEditor.jsx          ← you are here
 */

import StoreCarousel      from "../../../components/StoreCarousel";
import TestimonialCarousel from "../../../components/TestimonialCarousel";

import { useHomeEditor }  from "./hooks/useHomeEditor";
import { ROLE }           from "./api/homepageApi";

import { EditorToolbar, Toast, SectionDivider } from "./components/EditorUI";
import EditableSection    from "./components/EditableSection";

import HeroSection        from "./sections/HeroSection";
import StatsSection       from "./sections/StatsSection";
import BlogTeaserSection  from "./sections/BlogTeaserSection";
import FaqTeaserSection   from "./sections/FaqTeaserSection";
import CtaSection         from "./sections/CtaSection";
import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────

function HomePageEditor() {
  const {
    data, loading, error,
    hasChanges, saving,
    toast, clearToast,
    updateContent, updateStat, updateFaq, updatePost,
    handleMediaSuccess, handleDeleteSection, handleSave,
    getSection, getMediaUrl,
  } = useHomeEditor();

  const [showAddPanel, setShowAddPanel] = useState(false);

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
          <p className="text-gray-500">{error || "Failed to load page data."}</p>
        </div>
      </div>
    );
  }

  // ── Resolve sections ───────────────────────────────────────────────────────

  const hero         = getSection("hero");
  const storePreview = getSection("store-preview");
  const stats        = getSection("stats");
  const blogTeaser   = getSection("blog-teaser");
  const testimonials = getSection("testimonials");
  const faqTeaser    = getSection("faq-teaser");
  const cta          = getSection("cta");

  const heroImageUrl = getMediaUrl(hero, ROLE.HERO);
  const ctaImageUrl  = getMediaUrl(cta,  ROLE.CTA);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pb-32">

      {/* Sticky toolbar */}
      <EditorToolbar
        hasChanges={hasChanges}
        saving={saving}
        onSave={handleSave}
        onToggleAddPanel={() => setShowAddPanel((v) => !v)}
      />

      {/* Add Section panel */}
      {showAddPanel && (
        <div className="fixed top-14 right-6 bg-white shadow-2xl border border-gray-100 rounded-2xl p-4 z-50 w-56">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-3 px-1">
            Add Section
          </p>
          {["hero", "stats", "blog-teaser", "testimonials", "faq-teaser", "cta"].map((t) => (
            <button
              key={t}
              onClick={() => {
                // TODO: call createSection API then refresh
                setShowAddPanel(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-amber-50 rounded-lg capitalize transition"
            >
              {t.replace(/-/g, " ")}
            </button>
          ))}
        </div>
      )}

      {/* Page sections */}
      <div className="mt-14">

        {hero.content && (
          <HeroSection
            hero={hero}
            heroImageUrl={heroImageUrl}
            onUpdateContent={(field, value) => updateContent("hero", field, value)}
            onMediaSuccess={(role, url) => handleMediaSuccess("hero", role, url)}
            onDelete={() => handleDeleteSection("hero")}
          />
        )}

        <SectionDivider />

        {storePreview.content && (
          <EditableSection label="Store Preview" onDelete={() => handleDeleteSection("store-preview")}>
            <StoreCarousel storePreview={storePreview} />
          </EditableSection>
        )}

        <SectionDivider />

        {stats.content && (
          <StatsSection
            stats={stats}
            onUpdateContent={(field, value) => updateContent("stats", field, value)}
            onUpdateStat={(i, field, value) => updateStat(i, field, value)}
            onDelete={() => handleDeleteSection("stats")}
          />
        )}

        <SectionDivider />

        {blogTeaser.content && (
          <BlogTeaserSection
            blogTeaser={blogTeaser}
            onUpdateContent={(field, value) => updateContent("blog-teaser", field, value)}
            onUpdatePost={(i, field, value) => updatePost(i, field, value)}
            onMediaSuccess={(role, url) => handleMediaSuccess("blog-teaser", role, url)}
            onDelete={() => handleDeleteSection("blog-teaser")}
          />
        )}

        <SectionDivider />

        {testimonials.content && (
          <EditableSection label="Testimonials" onDelete={() => handleDeleteSection("testimonials")}>
            {/* TestimonialCarousel is a read-only component. Add its own editor when ready. */}
            <TestimonialCarousel testimonials={testimonials} />
          </EditableSection>
        )}

        <SectionDivider />

        {faqTeaser.content && (
          <FaqTeaserSection
            faqTeaser={faqTeaser}
            onUpdateContent={(field, value) => updateContent("faq-teaser", field, value)}
            onUpdateFaq={(i, field, value) => updateFaq(i, field, value)}
            onDelete={() => handleDeleteSection("faq-teaser")}
          />
        )}

        <SectionDivider />

        {cta.content && (
          <CtaSection
            cta={cta}
            ctaImageUrl={ctaImageUrl}
            onUpdateContent={(field, value) => updateContent("cta", field, value)}
            onMediaSuccess={(role, url) => handleMediaSuccess("cta", role, url)}
            onDelete={() => handleDeleteSection("cta")}
          />
        )}

      </div>

      {/* Toast notification */}
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

export default HomePageEditor;