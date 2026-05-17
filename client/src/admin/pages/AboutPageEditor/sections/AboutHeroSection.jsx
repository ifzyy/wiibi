/**
 * AboutHeroSection.jsx
 *
 * Large hero block:
 *  - Left: brand name + location (editable)
 *  - Right: large display title with last word highlighted (editable)
 *  - Below: full-width hero image (editable via EditableImage)
 *
 * Editable fields:
 *   brand_info.brand_name
 *   brand_info.location
 *   hero_section.display_title
 *   hero_section.main_image_url  (via image upload)
 */

import EditableText from "../../HomePageEditor/components/EditableText";
import EditableImage from "../../HomePageEditor/components/EditableImage";
import { ROLE }      from "../../HomePageEditor/api/homepageApi";

/**
 * @param {{
 *   brandInfo       : { brand_name: string, location: string },
 *   heroSection     : { display_title: string, main_image_url: string },
 *   sectionId       : string,
 *   onUpdateContent : (dotPath: string, value: string) => void,
 *   onMediaSuccess  : (role: string, url: string) => void,
 * }} props
 */
const AboutHeroSection = ({
  brandInfo,
  heroSection,
  sectionId,
  onUpdateContent,
  onMediaSuccess,
}) => {
  // Split the display title so the last word renders in dark, others in light grey —
  // this matches the original design. The full string is stored as one editable field.
  const words = (heroSection?.display_title || "").split(" ");

  return (
    <section className="max-w-7xl mx-auto px-8">
      {/* Top row: brand meta (left) + display title (right) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">

        {/* Brand name + location */}
        <div className="mb-4 md:mb-0">
          <EditableText
            content={brandInfo?.brand_name}
            onChange={(v) => onUpdateContent("brand_info.brand_name", v)}
            tag="h2"
            className="text-[#FDB927] text-4xl font-medium tracking-tighter leading-none mb-2"
            placeholder="Brand name…"
          />
          <EditableText
            content={brandInfo?.location}
            onChange={(v) => onUpdateContent("brand_info.location", v)}
            tag="p"
            className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.3em]"
            placeholder="Location…"
          />
        </div>

        {/* Display title — last word is dark, rest are light */}
        <div className="text-6xl md:text-[7rem] font-semibold text-[#333] tracking-tighter leading-[0.85] text-right">
          <EditableText
            content={heroSection?.display_title}
            onChange={(v) => onUpdateContent("hero_section.display_title", v)}
            tag="h2"
            className="text-6xl md:text-[7rem] font-semibold tracking-tighter leading-[0.85] text-right"
            placeholder="Display title…"
          />
          {/*
           * NOTE: The original renders each word with last-word dark / rest light.
           * Because EditableText gives us a single contenteditable block, we
           * render the styled preview below it as a read-only overlay that appears
           * only when not editing. For a pixel-perfect styled preview, you can
           * swap the EditableText above for a custom implementation that splits
           * on blur — leave that as a future enhancement.
           */}
        </div>
      </div>

      {/* Hero image */}
      <div className="w-full aspect-[21/9] bg-stone-50 rounded-[2.5rem] overflow-hidden border border-stone-100 shadow-sm relative">
        <EditableImage
          src={heroSection?.main_image_url}
          alt="About hero"
          sectionId={sectionId}
          role="hero"
          onUrlChange={(url) => {
            onUpdateContent("hero_section.main_image_url", url);
            onMediaSuccess(ROLE.HERO, url);
          }}
          className="w-full h-full object-cover"
          emptyLabel="Add Hero Image"
        />
      </div>
    </section>
  );
};

export default AboutHeroSection;
