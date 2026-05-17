/**
 * ServicesMainSection.jsx
 *
 * Renders the "main" section: a list of service steps in an alternating
 * two-column layout (image left / text right, then text left / image right).
 *
 * Each step is independently editable:
 *   step.main_heading  — heading (amber, large)
 *   step.support_text  — body text
 *   step.image_url     — the step's image (via EditableImage)
 *
 * Images use role "featured" with displayOrder = step index so each
 * maps to a distinct media record on the backend.
 */

import EditableText from "../../HomePageEditor/components/EditableText";
import EditableImage from "../../HomePageEditor/components/EditableImage";
import { ROLE }      from "../../HomePageEditor/api/homepageApi";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=1000&auto=format&fit=crop";

/**
 * @param {{
 *   section         : { id: string, content: { main_steps: Array } },
 *   onUpdateStep    : (index: number, field: string, value: string) => void,
 *   onMediaSuccess  : (role: string, url: string) => void,
 * }} props
 */
const ServicesMainSection = ({ section, onUpdateStep, onMediaSuccess }) => (
  <section className="max-w-7xl mx-auto px-6 py-20 space-y-32">
    {section.content.main_steps?.map((step, index) => (
      <div
        key={index}
        className="grid md:grid-cols-2 gap-12 md:gap-24 items-center"
      >
        {/* Image — alternates side on even/odd index */}
        <div
          className={`bg-amber-50 rounded-2xl aspect-[4/3] overflow-hidden relative
            ${index % 2 !== 0 ? "md:order-2" : ""}`}
        >
          <EditableImage
            src={step.image_url || FALLBACK_IMAGE}
            alt={step.main_heading}
            sectionId={section.id}
            role={ROLE.FEATURED}
            onUrlChange={(url) => {
              onUpdateStep(index, "image_url", url);
              onMediaSuccess(ROLE.FEATURED, url);
            }}
            className="w-full h-full object-cover mix-blend-multiply opacity-80"
            emptyLabel="Add Step Image"
          />
        </div>

        {/* Text */}
        <div className="space-y-4">
          <EditableText
            content={step.main_heading}
            onChange={(v) => onUpdateStep(index, "main_heading", v)}
            tag="h3"
            className="text-3xl font-black text-[#FFAA14] leading-tight"
            placeholder="Step heading…"
          />
          <EditableText
            content={step.support_text}
            onChange={(v) => onUpdateStep(index, "support_text", v)}
            tag="p"
            className="text-[#606060] text-lg leading-relaxed max-w-md"
            placeholder="Support text…"
          />
        </div>
      </div>
    ))}
  </section>
);

export default ServicesMainSection;