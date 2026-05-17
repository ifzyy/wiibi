/**
 * ContactProcessHeader.jsx
 *
 * The full-width bordered header band that sits above the
 * two-column process + form grid.
 *
 * Editable fields:
 *   header.sub_heading
 *   header.main_heading
 */

import EditableText from "../../HomePageEditor/components/EditableText";

/**
 * @param {{
 *   header          : { sub_heading: string, main_heading: string },
 *   onUpdateContent : (dotPath: string, value: string) => void,
 * }} props
 */
const ContactProcessHeader = ({ header, onUpdateContent }) => (
  <div className="border border-[#D9D9D9] w-full">
    <div className="max-w-7xl mx-auto px-6 py-8">
      <EditableText
        content={header?.sub_heading}
        onChange={(v) => onUpdateContent("header.sub_heading", v)}
        tag="p"
        className="text-[#FFAA14] font-medium"
        placeholder="Sub-heading…"
      />
      <EditableText
        content={header?.main_heading}
        onChange={(v) => onUpdateContent("header.main_heading", v)}
        tag="h3"
        className="text-3xl font-black text-black mb-2"
        placeholder="Main heading…"
      />
    </div>
  </div>
);

export default ContactProcessHeader;