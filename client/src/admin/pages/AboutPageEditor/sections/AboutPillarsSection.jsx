/**
 * AboutPillarsSection.jsx
 *
 * Two value-pillar layouts:
 *
 *  Pillar 1 — "Hands On Service"
 *    Three-column: [heading + faded sub-headings] [large image] [support text]
 *    All three columns are editable.
 *
 *  Pillar 2 — "We Care"
 *    Full-width coloured card: [large image left 2/3] [icon + heading + text right 1/3]
 *    bg_color is editable via a colour picker.
 *
 * Images are uploaded through EditableImage → ImageEditor → backend upload + attach.
 */

import { useState } from "react";
import { Leaf }      from "lucide-react";
import EditableText from "../../HomePageEditor/components/EditableText";
import EditableImage from "../../HomePageEditor/components/EditableImage";
import { ROLE }      from "../../HomePageEditor/api/homepageApi";

// ─── Pillar 1 ─────────────────────────────────────────────────────────────────

/**
 * Three-column pillar layout.
 *
 * @param {{
 *   pillar        : object,
 *   sectionId     : string,
 *   onUpdate      : (field: string, value: any) => void,
 *   onMediaSuccess: (role: string, url: string) => void,
 * }} props
 */
const PillarOne = ({ pillar, sectionId, onUpdate, onMediaSuccess }) => (
  <div className="max-w-7xl mx-auto px-8">
    <div className="grid grid-cols-[1fr_2fr_1fr] gap-8 items-start">

      {/* Left: main heading + faded sub-headings */}
      <div className="pt-2">
        <EditableText
          content={pillar.main_heading}
          onChange={(v) => onUpdate("main_heading", v)}
          tag="h3"
          className="text-4xl font-medium text-black tracking-tight mb-3"
          placeholder="Heading…"
        />
        {pillar.sub_headings?.map((sh, i) => (
          <EditableText
            key={i}
            content={sh}
            onChange={(v) => {
              const updated = [...pillar.sub_headings];
              updated[i] = v;
              onUpdate("sub_headings", updated);
            }}
            tag="span"
            className="text-4xl font-medium text-stone-200 cursor-default block"
            placeholder="Sub-heading…"
          />
        ))}
      </div>

      {/* Centre: large image */}
      <div className="w-full aspect-[4/3] bg-stone-50 rounded-[2rem] overflow-hidden border border-stone-100 relative">
        <EditableImage
          src={pillar.main_image_url}
          alt={pillar.main_heading}
          sectionId={sectionId}
          role="pillar1-image"
          onUrlChange={(url) => {
            onUpdate("main_image_url", url);
            onMediaSuccess(ROLE.FEATURED, url);
          }}
          className="w-full h-full object-cover"
          emptyLabel="Add Pillar Image"
        />
      </div>

      {/* Right: support text */}
      <div className="pt-2">
        <EditableText
          content={pillar.support_text}
          onChange={(v) => onUpdate("support_text", v)}
          tag="p"
          className="text-stone-500 text-base leading-relaxed"
          placeholder="Support text…"
        />
      </div>
    </div>
  </div>
);

// ─── Pillar 2 ─────────────────────────────────────────────────────────────────

/**
 * Full-width coloured card pillar layout.
 *
 * @param {{
 *   pillar        : object,
 *   sectionId     : string,
 *   onUpdate      : (field: string, value: any) => void,
 *   onMediaSuccess: (role: string, url: string) => void,
 * }} props
 */
const PillarTwo = ({ pillar, sectionId, onUpdate, onMediaSuccess }) => {
  const [editingColor, setEditingColor] = useState(false);
  const [draftColor, setDraftColor]     = useState(pillar.bg_color || "#f5f7ee");

  const handleColorSave = () => {
    onUpdate("bg_color", draftColor);
    setEditingColor(false);
  };

  return (
    <div
      className="mt-24 relative group/card"
      style={{ backgroundColor: pillar.bg_color || "#f5f7ee" }}
    >
      {/* Background colour editor — appears on card hover */}
      <div className="absolute top-4 right-4 z-10 opacity-0 group-hover/card:opacity-100 transition-opacity">
        {editingColor ? (
          <div className="bg-white rounded-xl shadow-xl p-3 flex items-center gap-2">
            <input
              type="color"
              value={draftColor}
              onChange={(e) => setDraftColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border-0"
            />
            <input
              type="text"
              value={draftColor}
              onChange={(e) => setDraftColor(e.target.value)}
              className="w-24 border border-gray-200 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-[#FFAA14]"
            />
            <button
              onClick={handleColorSave}
              className="bg-[#FFAA14] text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-yellow-500"
            >
              Save
            </button>
            <button
              onClick={() => setEditingColor(false)}
              className="text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingColor(true)}
            className="bg-white/90 backdrop-blur text-xs font-bold px-3 py-1.5 rounded-full shadow flex items-center gap-1.5 hover:bg-white transition"
          >
            <span
              className="w-3 h-3 rounded-full border border-gray-200"
              style={{ backgroundColor: pillar.bg_color || "#f5f7ee" }}
            />
            Edit colour
          </button>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-[2fr_1fr] gap-8 items-stretch">

          {/* Left: large image */}
          <div className="w-full min-h-[360px] bg-stone-100 rounded-[2rem] overflow-hidden border border-stone-200 relative">
            <EditableImage
              src={pillar.main_image_url}
              alt={pillar.main_heading}
              sectionId={sectionId}
              role="pillar2-image"
              onUrlChange={(url) => {
                onUpdate("main_image_url", url);
                onMediaSuccess(ROLE.BACKGROUND, url);
              }}
              className="w-full h-full object-cover"
              emptyLabel="Add Pillar Image"
            />
          </div>

          {/* Right: icon + heading + text */}
          <div className="flex flex-col justify-center pl-4">
            {pillar.icon === "leaf-icon" && (
              <Leaf className="text-emerald-700 mb-4" size={28} />
            )}
            <EditableText
              content={pillar.main_heading}
              onChange={(v) => onUpdate("main_heading", v)}
              tag="h3"
              className="text-4xl font-black text-stone-700 tracking-tight mb-4"
              placeholder="Heading…"
            />
            <EditableText
              content={pillar.support_text}
              onChange={(v) => onUpdate("support_text", v)}
              tag="p"
              className="text-stone-500 text-base leading-relaxed"
              placeholder="Support text…"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── AboutPillarsSection ──────────────────────────────────────────────────────

/**
 * @param {{
 *   pillars       : Array,
 *   sectionId     : string,
 *   onUpdatePillar: (index: number, field: string, value: any) => void,
 *   onMediaSuccess: (role: string, url: string) => void,
 * }} props
 */
const AboutPillarsSection = ({
  pillars,
  sectionId,
  onUpdatePillar,
  onMediaSuccess,
}) => (
  <section className="py-24 space-y-0">
    <PillarOne
      pillar={pillars[0]}
      sectionId={sectionId}
      onUpdate={(field, value) => onUpdatePillar(0, field, value)}
      onMediaSuccess={onMediaSuccess}
    />
    <PillarTwo
      pillar={pillars[1]}
      sectionId={sectionId}
      onUpdate={(field, value) => onUpdatePillar(1, field, value)}
      onMediaSuccess={onMediaSuccess}
    />
  </section>
);

export default AboutPillarsSection;
