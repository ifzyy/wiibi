/**
 * AboutBreadcrumbHeader.jsx
 *
 * Breadcrumb nav + page title block (brand_info).
 *
 * Editable fields:
 *   brand_info.sub_heading
 *   brand_info.main_heading
 */

import { ChevronRight } from "lucide-react";
import EditableText from "../../HomePageEditor/components/EditableText";

/**
 * @param {{
 *   brandInfo       : { sub_heading: string, main_heading: string },
 *   onUpdateContent : (dotPath: string, value: string) => void,
 * }} props
 */
const AboutBreadcrumbHeader = ({ brandInfo, onUpdateContent }) => (
  <header className="max-w-7xl mx-auto px-8 pt-16 pb-8">
    <nav className="flex items-center gap-2 text-[10px] font-normal uppercase tracking-widest text-[#ffaa14] mb-8">
      <a href="/" className="text-black hover:text-[#ffaa14] transition-colors">
        Home
      </a>
      <ChevronRight size={10} strokeWidth={4} />
      <span className="text-[#ffaa14]">{brandInfo?.main_heading}</span>
    </nav>

    <EditableText
      content={brandInfo?.sub_heading}
      onChange={(v) => onUpdateContent("brand_info.sub_heading", v)}
      tag="p"
      className="text-[#ffaa14] text-[14px]"
      placeholder="Sub-heading…"
    />
    <EditableText
      content={brandInfo?.main_heading}
      onChange={(v) => onUpdateContent("brand_info.main_heading", v)}
      tag="h2"
      className="text-black text-[20px] font-bold"
      placeholder="Main heading…"
    />
  </header>
);

export default AboutBreadcrumbHeader;
