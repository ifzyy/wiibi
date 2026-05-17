/**
 * HeroSection.jsx
 *
 * Renders the homepage hero section with full inline editing.
 * All edits flow up to useHomeEditor via the passed callbacks.
 */

import EditableText    from "../components/EditableText";
import EditableImage   from "../components/EditableImage";
import EditableButton  from "../components/EditableButton";
import EditableSection from "../components/EditableSection";
import { ROLE }        from "../api/homepageApi";

/**
 * @param {{
 *   hero              : object,   section data from useHomeEditor.getSection("hero")
 *   heroImageUrl      : string | null,
 *   onUpdateContent   : (field: string, value: string) => void,
 *   onMediaSuccess    : (role: string, url: string) => void,
 *   onDelete          : () => void,
 * }} props
 */
const HeroSection = ({
  hero,
  heroImageUrl,
  onUpdateContent,
  onMediaSuccess,
  onDelete,
}) => (
  <EditableSection label="Hero" onDelete={onDelete}>
    <section className="bg-white">

      {/* ── Main hero layout ── */}
      <div className="min-h-[85vh] flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-screen-2xl mx-auto flex flex-col lg:flex-row items-center gap-12">

          {/* Left column: editable text */}
          <div className="flex-[0.9] lg:pr-12 space-y-6">
            <EditableText
              content={hero.content.subtitle}
              onChange={(v) => onUpdateContent("subtitle", v)}
              className="text-[#FFAA14] font-semibold uppercase tracking-wider text-sm block"
              placeholder="Subtitle…"
            />
            <EditableText
              content={hero.content.title}
              onChange={(v) => onUpdateContent("title", v)}
              className="text-[#1A1102] text-5xl xl:text-7xl font-bold leading-tight block"
              tag="h1"
              placeholder="Main headline…"
            />
            <EditableText
              content={hero.content.main_support_text}
              onChange={(v) => onUpdateContent("main_support_text", v)}
              className="text-[#606060] text-lg xl:text-xl max-w-xl leading-relaxed block"
              placeholder="Support text…"
            />

            <EditableButton
              text={hero.content.button_text || "View our packages"}
              href={hero.content.button_link || "#"}
              onTextChange={(v) => onUpdateContent("button_text", v)}
              onHrefChange={(v) => onUpdateContent("button_link", v)}
              className="bg-[#1A1102] px-8 py-4 text-white font-bold rounded-md hover:bg-black transition-colors"
            />

            <EditableText
              content={hero.content.second_support_text}
              onChange={(v) => onUpdateContent("second_support_text", v)}
              className="font-light text-[#606060] text-[17px] max-w-[260px] block"
              placeholder="Secondary support text…"
            />

            <a className="inline-flex items-center gap-2 border-b-2 border-[#606060] pb-1 text-[#606060] hover:text-[#FFAA14] hover:border-[#FFAA14] transition-colors cursor-pointer">
              <EditableText
                content={hero.content.learn_more_text || "learn more"}
                onChange={(v) => onUpdateContent("learn_more_text", v)}
                className="inline"
              />
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 7h10v10" /><path d="M7 17 17 7" />
              </svg>
            </a>
          </div>

          {/* Right column: hero image */}
          <div className="flex-[1.1] w-full aspect-[4/3] rounded-sm overflow-hidden relative">
            <EditableImage
              src={heroImageUrl}
              alt="Hero"
              sectionId={hero.id}
              role={ROLE.HERO}
              onUrlChange={(url) => onMediaSuccess(ROLE.HERO, url)}
              className="w-full h-full object-cover"
              emptyLabel="Add Hero Image"
            />
          </div>
        </div>
      </div>

      {/* ── Solar calculator bar ── */}
      <div className="w-full border-t border-b border-gray-100 flex flex-col md:flex-row">

        {/* Left: question */}
        <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-100">
          <div className="flex items-center gap-4 mb-2">
            <EditableText
              content={hero.content.question_text}
              onChange={(v) => onUpdateContent("question_text", v)}
              className="text-xl font-bold uppercase tracking-tighter"
              tag="h3"
              placeholder="Question…"
            />
            <div className="flex gap-1 text-[#FFAA14]">
              <span className="font-bold">›</span>
              <span className="font-bold">›</span>
              <span className="font-bold opacity-50">›</span>
            </div>
          </div>
          <EditableText
            content={hero.content.confidence_text}
            onChange={(v) => onUpdateContent("confidence_text", v)}
            className="text-gray-500 font-medium block"
            placeholder="Confidence sub-text…"
          />
        </div>

        {/* Right: calculator amount */}
        <div className="flex-1 p-8 lg:p-12 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-500 mb-2">Solar Calculator</span>
            <EditableText
              content={hero.content.calculator_amount || "₦125,000"}
              onChange={(v) => onUpdateContent("calculator_amount", v)}
              className="text-4xl lg:text-5xl font-bold block"
              tag="h4"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="text-[#FFAA14] p-2 hover:bg-gray-50 rounded-full">‹</button>
            <span className="bg-gray-50 px-4 py-2 rounded-md text-sm font-bold">Monthly</span>
            <button className="text-[#FFAA14] p-2 hover:bg-gray-50 rounded-full">›</button>
          </div>
        </div>

        {/* Arrow CTA */}
        <div className="w-full md:w-[120px] bg-[#FFAA14] flex items-center justify-center cursor-pointer hover:bg-yellow-500 transition-colors">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </div>
    </section>
  </EditableSection>
);

export default HeroSection;
