/**
 * CtaSection.jsx
 *
 * Renders the CTA section with a large image on the left and
 * editable heading + button on the right.
 */

import EditableText    from "../components/EditableText";
import EditableImage   from "../components/EditableImage";
import EditableButton  from "../components/EditableButton";
import EditableSection from "../components/EditableSection";
import { ROLE }        from "../api/homepageApi";

/**
 * @param {{
 *   cta             : object,
 *   ctaImageUrl     : string | null,
 *   onUpdateContent : (field: string, value: string) => void,
 *   onMediaSuccess  : (role: string, url: string) => void,
 *   onDelete        : () => void,
 * }} props
 */
const CtaSection = ({
  cta,
  ctaImageUrl,
  onUpdateContent,
  onMediaSuccess,
  onDelete,
}) => (
  <EditableSection label="CTA" onDelete={onDelete}>
    <section className="bg-white">
      <div className="container mx-auto flex flex-col lg:flex-row min-h-[500px]">

        {/* Left: CTA image */}
        <div className="lg:w-2/3 flex items-center justify-center p-6 lg:p-0 my-8">
          <div className="relative w-full max-w-3xl h-[400px] lg:h-[500px]">
            <EditableImage
              src={ctaImageUrl}
              alt="CTA"
              sectionId={cta.id}
              role={ROLE.CTA}
              onUrlChange={(url) => onMediaSuccess(ROLE.CTA, url)}
              className="w-full h-full object-cover rounded-sm shadow-2xl"
              emptyLabel="Add CTA Image"
            />
          </div>
        </div>

        {/* Right: text + button */}
        <div className="lg:w-1/3 p-12 lg:p-20 flex flex-col justify-center border-l border-gray-100">
          <EditableText
            content={cta.content.title || "Optimize"}
            onChange={(v) => onUpdateContent("title", v)}
            className="text-[#FFAA14] text-sm font-semibold uppercase tracking-wider mb-8 block"
            placeholder="Label…"
          />
          <div className="mb-10 space-y-2">
            <EditableText
              content={cta.content.heading_one}
              onChange={(v) => onUpdateContent("heading_one", v)}
              className="text-4xl md:text-5xl font-medium text-gray-500 block"
              tag="h2"
              placeholder="Heading line 1…"
            />
            <EditableText
              content={cta.content.heading_two}
              onChange={(v) => onUpdateContent("heading_two", v)}
              className="text-4xl md:text-5xl font-bold text-gray-800 block"
              tag="h2"
              placeholder="Heading line 2…"
            />
          </div>
          <EditableButton
            text={cta.content.button_text}
            href={cta.content.button_link}
            onTextChange={(v) => onUpdateContent("button_text", v)}
            onHrefChange={(v) => onUpdateContent("button_link", v)}
            className="inline-block bg-[#1A1102] text-white px-10 py-4 rounded-md font-bold text-sm hover:bg-black transition-all shadow-lg"
          />
        </div>
      </div>
    </section>
  </EditableSection>
);

export default CtaSection;
