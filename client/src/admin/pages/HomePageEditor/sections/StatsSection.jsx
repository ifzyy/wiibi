/**
 * StatsSection.jsx
 *
 * Renders the stats section with a left text panel and a 2-column stats grid.
 * Each stat's value, label, and description are individually editable.
 */

import EditableText    from "../components/EditableText";
import EditableSection from "../components/EditableSection";

/**
 * @param {{
 *   stats           : object,   section data
 *   onUpdateContent : (field: string, value: string) => void,
 *   onUpdateStat    : (index: number, field: string, value: string) => void,
 *   onDelete        : () => void,
 * }} props
 */
const StatsSection = ({ stats, onUpdateContent, onUpdateStat, onDelete }) => (
  <EditableSection label="Stats" onDelete={onDelete}>
    <section className="bg-white border-t border-gray-100">
      <div className="container mx-auto flex flex-col lg:flex-row">

        {/* Left: heading + description + CTA link */}
        <div className="lg:w-1/3 p-8 lg:p-16 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200">
          <EditableText
            content={stats.content.title}
            onChange={(v) => onUpdateContent("title", v)}
            className="text-[#FFAA14] text-sm font-semibold uppercase tracking-wide mb-4 block"
            placeholder="Label…"
          />
          <EditableText
            content={stats.content.heading}
            onChange={(v) => onUpdateContent("heading", v)}
            className="text-4xl font-bold text-gray-800 mb-6 block"
            tag="h2"
            placeholder="Heading…"
          />
          <EditableText
            content={stats.content.paragraph_text}
            onChange={(v) => onUpdateContent("paragraph_text", v)}
            className="text-gray-600 leading-relaxed mb-8 block"
            placeholder="Description…"
          />
          <a className="inline-flex items-center gap-2 text-gray-700 font-medium border-b-2 border-gray-300 pb-1 hover:text-[#FFAA14] hover:border-[#FFAA14] transition-all cursor-pointer">
            <EditableText
              content={stats.content.button_text}
              onChange={(v) => onUpdateContent("button_text", v)}
              className="inline"
              placeholder="CTA text…"
            />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 17l10-10M7 7h10v10" />
            </svg>
          </a>
        </div>

        {/* Right: 2-column stats grid */}
        <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2">
          {stats.content.stats?.map((stat, i) => (
            <div
              key={i}
              className={`p-10 lg:p-14 border-b border-gray-200 hover:bg-gray-50 transition-colors
                ${i % 2 === 0 ? "md:border-r" : ""}
                ${i >= stats.content.stats.length - 2 ? "md:border-b-0" : ""}`}
            >
              <EditableText
                content={stat.value}
                onChange={(v) => onUpdateStat(i, "value", v)}
                className={`text-5xl font-bold block mb-2 ${i === 0 ? "text-[#FFAA14]" : "text-gray-800"}`}
                tag="span"
                placeholder="0"
              />
              <EditableText
                content={stat.label}
                onChange={(v) => onUpdateStat(i, "label", v)}
                className="text-lg font-semibold text-gray-700 mb-4 capitalize block"
                placeholder="Label…"
              />
              <EditableText
                content={stat.description}
                onChange={(v) => onUpdateStat(i, "description", v)}
                className="text-gray-500 leading-snug max-w-sm block"
                placeholder="Description…"
              />
            </div>
          ))}
        </div>

      </div>
    </section>
  </EditableSection>
);

export default StatsSection;
