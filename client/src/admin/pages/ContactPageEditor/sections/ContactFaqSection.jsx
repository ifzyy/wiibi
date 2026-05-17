/**
 * ContactFaqSection.jsx
 *
 * FAQ accordion section with editable questions and answers.
 * FAQs are separate records from page sections — they have their own IDs
 * and are saved via a dedicated /admin/faqs/:id endpoint.
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import EditableText from "../../HomePageEditor/components/EditableText";

/**
 * @param {{
 *   faqs      : Array<{ id: number, question: string, answer: string }>,
 *   onUpdate  : (faqId: number, field: "question"|"answer", value: string) => void,
 * }} props
 */
const ContactFaqSection = ({ faqs, onUpdate }) => (
  <section className="max-w-7xl mx-auto px-6 py-32">
    <div className="grid lg:grid-cols-2 gap-20">

      {/* Left: section heading */}
      <div>
        <EditableText
          content="Frequently asked questions"
          onChange={() => {}} // static label — wire up if needed
          tag="span"
          className="text-[#FFAA14] font-bold text-[11px] uppercase tracking-[0.3em] block mb-4"
          placeholder="Enter section label…"
        />
        <EditableText
          content="Questions we have been asked"
          onChange={() => {}} // static label — wire up if needed
          tag="h2"
          className="text-5xl font-black text-[#1A1102] tracking-tighter leading-tight"
          placeholder="Enter section title…"
        />
      </div>

      {/* Right: FAQ accordion */}
      <div className="divide-y divide-stone-100">
        {faqs.map((faq) => (
          <details key={faq.id} className="group py-8">
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <EditableText
                content={faq.question}
                onChange={(v) => onUpdate(faq.id, "question", v)}
                tag="p"
                className="text-xl font-bold text-stone-900 group-hover:text-[#FFAA14] transition-colors pr-8 flex-1"
                placeholder="Enter question…"
              />
              <span className="text-3xl font-light text-stone-300 group-open:rotate-45 transition-transform duration-300 shrink-0">
                +
              </span>
            </summary>
            <div className="pt-6">
              <EditableText
                content={faq.answer}
                onChange={(v) => onUpdate(faq.id, "answer", v)}
                tag="div"
                className="text-stone-500 text-lg leading-relaxed max-w-xl"
                placeholder="Enter answer…"
              />
            </div>
          </details>
        ))}

        {/* Pagination controls (decorative — wire up logic as needed) */}
        <div className="pt-12 flex items-center justify-between">
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-[#FFAA14]" />
            <div className="w-2 h-2 rounded-full bg-stone-200" />
            <div className="w-2 h-2 rounded-full bg-stone-200" />
          </div>
          <div className="flex gap-3">
            <button
              title="Previous"
              className="w-12 h-12 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:border-[#FFAA14] hover:text-[#FFAA14] transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              title="Next"
              className="w-12 h-12 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:border-[#FFAA14] hover:text-[#FFAA14] transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default ContactFaqSection;