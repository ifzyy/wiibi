/**
 * ProcessSteps.jsx
 *
 * Left column of the contact_process section.
 * Renders an ordered list of process steps with icons.
 *
 * Each step's heading and support_text are editable.
 * step_number is display-only (matches the PROCESS_ICONS map).
 *
 * The vertical connector line between steps is purely decorative CSS.
 */

import { Building2, ClipboardList, FileSearch, Zap } from "lucide-react";
import EditableText from "../../HomePageEditor/components/EditableText";

/**
 * Icon map keyed by step_number (1-based).
 * Add more entries here as new steps are introduced.
 */
const STEP_ICONS = {
  1: <Building2   className="w-5 h-5 text-[#FFAA14]" />,
  2: <ClipboardList className="w-5 h-5 text-[#FFAA14]" />,
  3: <FileSearch  className="w-5 h-5 text-[#FFAA14]" />,
  4: <Zap         className="w-5 h-5 text-[#FFAA14]" />,
};

/**
 * @param {{
 *   steps    : Array<{ step_number: number, heading: string, support_text: string }>,
 *   onUpdate : (index: number, field: string, value: string) => void,
 * }} props
 */
const ProcessSteps = ({ steps, onUpdate }) => (
  <div className="space-y-16">
    {steps?.map((step, index) => (
      <div key={index} className="relative flex flex-col group">

        {/* Vertical connector line — shown between all but the last step */}
        {index !== steps.length - 1 && (
          <div className="absolute left-[26px] top-14 w-[1px] h-full bg-amber-100" />
        )}

        <div>
          {/* Icon */}
          <div className="pb-2 rounded-2xl group-hover:bg-white group-hover:shadow-md transition-all duration-300 w-fit">
            {STEP_ICONS[step.step_number] || <Zap className="w-5 h-5 text-[#FFAA14]" />}
          </div>

          {/* Step number + heading */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-[14px] font-black text-[#FFAA14]">
              {step.step_number}
            </span>
            <EditableText
              content={step.heading}
              onChange={(v) => onUpdate(index, "heading", v)}
              tag="h4"
              className="text-[14px] font-black text-[#FFAA14]"
              placeholder="Step heading…"
            />
          </div>

          {/* Support text */}
          <EditableText
            content={step.support_text}
            onChange={(v) => onUpdate(index, "support_text", v)}
            tag="p"
            className="text-stone-500 text-sm leading-relaxed max-w-sm"
            placeholder="Support text…"
          />
        </div>
      </div>
    ))}
  </div>
);

export default ProcessSteps;