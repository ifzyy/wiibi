/**
 * FaqTeaserSection.jsx
 *
 * Renders the FAQ teaser section with a left text panel and an accordion.
 * The accordion is display-only - FAQs must be edited in the FAQ manager.
 */

import EditableText    from "../components/EditableText";
import EditableSection from "../components/EditableSection";
import { useNavigate } from "react-router-dom";

const NAV_BUTTONS = [
  { title: "Previous", path: "M15 18l-6-6 6-6" },
  { title: "Next",     path: "M9 18l6-6-6-6"   },
];

/**
 * @param {{
 *   faqTeaser       : object,
 *   onUpdateContent : (field: string, value: string) => void,
 *   onDelete        : () => void,
 *   activeNavId     : string,
 *   onSetActiveNav  : (navId: string) => void,
 * }} props
 */
const FaqTeaserSection = ({ 
  faqTeaser, 
  onUpdateContent, 
  onDelete,
  activeNavId,
  onSetActiveNav 
}) => {
  const navigate = useNavigate();

  const handleManageFaqs = () => {
    // Set active nav to 'faq' and navigate to FAQ manager
    onSetActiveNav('faq');
    navigate('/admin/faq');
  };

  return (
    <EditableSection label="FAQ" onDelete={onDelete}>
      <section className="bg-white border-t border-gray-100 relative">
        {/* Blur overlay for FAQ accordion */}
        <div className="absolute right-0 top-0 bottom-0 lg:w-2/3 pointer-events-none z-10">
          <div className="h-full w-full bg-white/50 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-white/90 p-6 rounded-lg shadow-lg text-center max-w-xs mx-4 pointer-events-auto">
              <p className="text-gray-700 font-medium mb-4">
                Edit FAQs in the FAQ Manager
              </p>
              <button
                onClick={handleManageFaqs}
                className="bg-[#FFAA14] text-white px-6 py-2.5 rounded-md font-semibold text-sm hover:bg-[#FF9914] transition shadow-sm"
              >
                Go to FAQ Manager
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto flex flex-col lg:flex-row">
          {/* Left: heading + CTAs - remains editable */}
          <div className="lg:w-1/3 p-8 lg:p-16 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200">
            <EditableText
              content={faqTeaser.content.title}
              onChange={(v) => onUpdateContent("title", v)}
              className="text-[#FFAA14] text-sm font-semibold uppercase tracking-wide mb-4 block"
              placeholder="Label…"
            />
            <EditableText
              content={faqTeaser.content.heading}
              onChange={(v) => onUpdateContent("heading", v)}
              className="text-4xl font-bold text-gray-800 mb-6 leading-tight block"
              tag="h2"
              placeholder="Heading…"
            />
            <EditableText
              content={faqTeaser.content.sub_heading}
              onChange={(v) => onUpdateContent("sub_heading", v)}
              className="text-gray-500 mb-8 block"
              placeholder="Sub-heading…"
            />
            <div className="flex flex-wrap items-center gap-6">
              <button className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-md font-semibold text-sm shadow-sm hover:bg-gray-50 transition">
                Request a quote
              </button>
              <a href="/contact" className="inline-flex items-center gap-2 text-gray-500 font-medium border-b border-gray-300 pb-0.5 hover:text-black transition-colors text-sm">
                Contact Us
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M7 17l10-10M7 7h10v10" />
                </svg>
              </a>
            </div>
          </div>

          {/* Right: FAQ accordion - display only, not editable */}
          <div className="lg:w-2/3 flex flex-col relative">
            <div className="flex-grow opacity-50">
              {faqTeaser.content.faqs?.map((faq, i) => (
                <details key={i} className="group border-b border-gray-200 last:border-b-0">
                  <summary className="flex items-center justify-between p-8 lg:p-12 cursor-pointer list-none hover:bg-gray-50 transition-colors">
                    <span className="text-xl md:text-2xl font-medium text-gray-800 pr-4 flex-1">
                      {faq.question}
                    </span>
                    <span className="text-2xl text-gray-400 group-open:rotate-45 transition-transform duration-200 ml-4 shrink-0">
                      +
                    </span>
                  </summary>
                  <div className="px-8 lg:px-12 pb-12 text-gray-600 text-lg leading-relaxed">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>

            {/* Pagination controls (decorative) */}
            <div className="p-8 lg:p-12 flex items-center justify-between border-t border-gray-200 opacity-50">
              <div className="flex gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-800" />
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
              </div>
              <div className="flex gap-4">
                {NAV_BUTTONS.map(({ title, path }) => (
                  <button
                    key={title}
                    title={title}
                    className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50 transition shadow-sm"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d={path} />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </EditableSection>
  );
};

export default FaqTeaserSection;