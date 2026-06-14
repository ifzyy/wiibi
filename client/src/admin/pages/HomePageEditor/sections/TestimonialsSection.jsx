/**
 * TestimonialsSection.jsx
 *
 * Editable header for the homepage testimonials/projects carousel.
 *
 * The carousel CARDS are pulled live from the Projects manager (case studies
 * and projects), so they are not edited here — same convention as the FAQ
 * teaser, whose accordion items live in the FAQ manager. What IS editable here
 * is the section's eyebrow label, heading, sub-heading, and CTA button (text +
 * link) — previously the whole section rendered the read-only carousel, so
 * none of this copy could be changed.
 */

import EditableText    from "../components/EditableText";
import EditableButton  from "../components/EditableButton";
import EditableSection from "../components/EditableSection";

/**
 * @param {{
 *   testimonials    : object,
 *   onUpdateContent : (field: string, value: string) => void,
 *   onDelete        : () => void,
 * }} props
 */
const TestimonialsSection = ({ testimonials, onUpdateContent, onDelete }) => {
  const c = testimonials.content ?? {};

  return (
    <EditableSection label="Testimonials" onDelete={onDelete}>
      <section className="py-20 bg-white font-sans">
        <div className="container mx-auto px-6">

          {/* ── Editable header ──────────────────────────────────────────── */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <EditableText
              content={c.title}
              onChange={(v) => onUpdateContent("title", v)}
              className="text-[#FFAA14] text-sm font-medium uppercase tracking-wider block mb-2"
              placeholder="Eyebrow label…"
            />
            <EditableText
              content={c.heading}
              onChange={(v) => onUpdateContent("heading", v)}
              tag="h2"
              className="text-4xl md:text-5xl font-bold text-black mb-4 block"
              placeholder="Heading…"
            />
            <EditableText
              content={c.sub_heading}
              onChange={(v) => onUpdateContent("sub_heading", v)}
              className="text-lg text-gray-600 mb-8 leading-relaxed block"
              placeholder="Sub-heading…"
            />
            <EditableButton
              text={c.button_text}
              href={c.button_link}
              onTextChange={(v) => onUpdateContent("button_text", v)}
              onHrefChange={(v) => onUpdateContent("button_link", v)}
              className="inline-block bg-[#1A1102] text-white px-8 py-3 rounded-md font-semibold text-sm hover:bg-black transition-colors"
            />
          </div>

          {/* ── Cards preview (managed in Projects) ──────────────────────── */}
          <div className="relative max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 opacity-50 pointer-events-none select-none">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-gray-100">
                  <div className="bg-stone-100" style={{ aspectRatio: "16/9" }} />
                  <div className="p-4">
                    <div className="h-2.5 w-16 bg-[#FFAA14]/40 rounded mb-2" />
                    <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
                    <div className="h-3 w-full bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>

            {/* Overlay note */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/95 backdrop-blur-sm border border-gray-100 shadow-lg rounded-xl px-6 py-5 text-center max-w-sm mx-4">
                <p className="text-gray-700 font-semibold text-sm mb-1">
                  Carousel cards come from your Projects
                </p>
                <p className="text-gray-500 text-xs leading-relaxed">
                  The slides shown here are your latest projects and case studies.
                  Add, edit, or reorder them in the <strong>Projects</strong> manager —
                  the heading and button above are edited here.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>
    </EditableSection>
  );
};

export default TestimonialsSection;
