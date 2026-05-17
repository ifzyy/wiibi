/**
 * AboutStaffSection.jsx
 *
 * Staff grid with add / remove / edit support.
 * Each card has an editable name, role, and image.
 *
 * Props:
 *   staffHeader        { main_heading, sub_headings[], support_text }
 *   staffGrid          [{ name, role, image_url }]
 *   sectionId          string  — PageSection UUID for image attachment
 *   onUpdateContent    (dotPath, value) => void
 *   onUpdateStaffMember(index, field, value) => void
 *   onAddStaff         () => void
 *   onRemoveStaff      (index) => void
 *   onMediaSuccess     (role, url) => void
 */

import { useState } from "react";
import EditableText  from "../../HomePageEditor/components/EditableText";
import EditableImage from "../../HomePageEditor/components/EditableImage";

const EMPTY_STAFF = { name: "New Member", role: "Title", image_url: null };

const AboutStaffSection = ({
  staffHeader,
  staffGrid = [],
  sectionId,
  onUpdateContent,
  onUpdateStaffMember,
  onAddStaff,
  onRemoveStaff,
  onMediaSuccess,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <section className="max-w-7xl mx-auto px-8 py-24">

      {/* Header */}
      <div className="flex justify-between items-center mb-20">
        <div>
          <EditableText
            content={staffHeader?.main_heading}
            onChange={(v) => onUpdateContent("staff_header.main_heading", v)}
            tag="h3"
            className="text-3xl font-bold text-black tracking-tight mb-1"
            placeholder="Heading…"
          />
          {staffHeader?.sub_headings?.map((heading, i) => (
            <EditableText
              key={i}
              content={heading}
              onChange={(v) => {
                const updated = [...(staffHeader.sub_headings || [])];
                updated[i] = v;
                onUpdateContent("staff_header.sub_headings", updated);
              }}
              tag="p"
              className="text-3xl font-bold text-stone-300 leading-snug"
              placeholder="Sub-heading…"
            />
          ))}
        </div>
        <div className="flex items-start justify-start pt-1 max-w-sm w-full">
          <EditableText
            content={staffHeader?.support_text}
            onChange={(v) => onUpdateContent("staff_header.support_text", v)}
            tag="p"
            className="text-stone-500 text-base leading-relaxed"
            placeholder="Support text…"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-x-8 gap-y-12">

        {staffGrid.map((staff, i) => (
          <div
            key={i}
            className="group relative"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Remove button — shows on hover */}
            {hoveredIndex === i && (
              <button
                type="button"
                onClick={() => onRemoveStaff(i)}
                className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow hover:bg-red-600 transition"
              >
                Remove
              </button>
            )}

            {/* Image */}
            <div className="w-full aspect-[3/4] bg-stone-50 rounded-3xl mb-4 overflow-hidden border border-stone-100 relative">
              <EditableImage
                src={staff.image_url}
                alt={staff.name}
                sectionId={sectionId}
                role={`staff-media-${i+1}`} // e.g. "staff-1", "staff-2" — used for media association
                onUrlChange={(url) => onUpdateStaffMember(i, "image_url", url)}
                className="w-full h-full object-cover"
                emptyLabel="Add Photo"
              />
            </div>

            {/* Name */}
            <EditableText
              content={staff.name}
              onChange={(v) => onUpdateStaffMember(i, "name", v)}
              tag="h5"
              className="font-semibold text-stone-800 text-base mb-1 tracking-tight"
              placeholder="Full name…"
            />

            {/* Role */}
            <EditableText
              content={staff.role}
              onChange={(v) => onUpdateStaffMember(i, "role", v)}
              tag="p"
              className="text-stone-400 text-sm font-normal"
              placeholder="Job title…"
            />
          </div>
        ))}

        {/* Add card */}
        <button
          type="button"
          onClick={onAddStaff}
          className="w-full aspect-[3/4] rounded-3xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center gap-3 text-stone-400 hover:border-[#FFAA14] hover:text-[#FFAA14] transition-all group"
        >
          <span className="text-4xl font-light group-hover:scale-110 transition-transform">+</span>
          <span className="text-sm font-semibold uppercase tracking-widest">Add Member</span>
        </button>

      </div>
    </section>
  );
};

export default AboutStaffSection;