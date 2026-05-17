/**
 * ServicesHeroSection.jsx
 *
 * Page header: breadcrumb nav + editable title (label) + subtitle (heading).
 *
 * Editable fields:
 *   content.title     — the amber label above the heading
 *   content.subtitle  — the main h1 heading
 */

import { ChevronRight } from "lucide-react";
import EditableText from "../../HomePageEditor/components/EditableText";

/**
 * @param {{
 *   section         : { content: { title: string, subtitle: string } },
 *   onUpdateContent : (dotPath: string, value: string) => void,
 * }} props
 */
const ServicesHeroSection = ({ section, onUpdateContent }) => (
  <>
    <header className="max-w-7xl mx-auto px-6 pt-4 pb-12 border-b border-stone-50">
      <nav className="flex items-center gap-2 text-[10px] font-normal uppercase tracking-widest text-[#ffaa14] mb-8">
        <a href="/" className="text-black hover:text-[#ffaa14] transition-colors">
          Home
        </a>
        <ChevronRight size={10} strokeWidth={4} />
        <span className="text-[#ffaa14]">Services</span>
      </nav>

      <EditableText
        content={section.content.title}
        onChange={(v) => onUpdateContent("title", v)}
        tag="p"
        className="text-[#FFAA14] font-bold text-xs uppercase tracking-widest mb-3"
        placeholder="Label…"
      />
      <EditableText
        content={section.content.subtitle}
        onChange={(v) => onUpdateContent("subtitle", v)}
        tag="h1"
        className="text-4xl md:text-5xl font-black"
        placeholder="Page heading…"
      />
    </header>

    <div className="border border-[#f1f1f1]" />
  </>
);

export default ServicesHeroSection;