/**
 * ContactHeaderSection.jsx
 *
 * Page header: editable sub-heading + main heading.
 */

import EditableText from "../../HomePageEditor/components/EditableText";

/**
 * @param {{
 *   header          : { sub_heading: string, main_heading: string },
 *   onUpdateContent : (dotPath: string, value: string) => void,
 * }} props
 */
const ContactHeaderSection = ({ header, onUpdateContent }) => (
  <header className="max-w-7xl mx-auto px-6 mt-8 mb-16 space-y-4">
    <EditableText
      content={header?.sub_heading}
      onChange={(v) => onUpdateContent("header.sub_heading", v)}
      tag="p"
      className="text-[#FFAA14] font-bold text-xs uppercase tracking-widest"
      placeholder="Enter subheading…"
    />
    <EditableText
      content={header?.main_heading}
      onChange={(v) => onUpdateContent("header.main_heading", v)}
      tag="h1"
      className="text-4xl md:text-5xl font-black text-[#1A1102]"
      placeholder="Enter main heading…"
    />
  </header>
);

export default ContactHeaderSection;