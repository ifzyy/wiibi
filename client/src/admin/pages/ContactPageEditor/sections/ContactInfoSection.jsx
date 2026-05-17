/**
 * ContactInfoSection.jsx
 *
 * Two-column layout:
 *  Left  — Contact methods (phone, email, hours) — each label and value is editable
 *  Right — Address + embedded Google Map
 *
 * Map URL editing is handled via a simple inline input that appears on hover.
 */

import { useState } from "react";
import { MapPin } from "lucide-react";
import EditableText from "../../HomePageEditor/components/EditableText";

// ─── ContactMethod ────────────────────────────────────────────────────────────

/**
 * Single contact method row (e.g. Phone, Email, Hours).
 *
 * @param {{
 *   method          : { icon: Component, label: string, values: string[] },
 *   methodIndex     : number,
 *   onUpdateContent : (dotPath: string, value: any) => void,
 *   connectInfo     : object,   full connect_info block needed to update values array
 * }} props
 */
const ContactMethod = ({ method, methodIndex, onUpdateContent, connectInfo }) => {
  const Icon = method.icon;

  return (
    <div className="group">
      {/* Label row */}
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon size={16} className="text-[#FFAA14] shrink-0" />}
        <EditableText
          content={method.label}
          onChange={(v) =>
            onUpdateContent(
              `connect_info.contact_methods.${methodIndex}.label`,
              v
            )
          }
          tag="p"
          className="text-[#FFAA14] text-[11px] font-black uppercase tracking-widest"
          placeholder="Enter label…"
        />
      </div>

      {/* Value rows */}
      <div className="space-y-3">
        {method.values?.map((val, valueIndex) => (
          <EditableText
            key={valueIndex}
            content={val}
            onChange={(newVal) => {
              // Replace the specific value in the array, keep everything else
              const updatedMethods = connectInfo.contact_methods.map((m, mi) =>
                mi === methodIndex
                  ? {
                      ...m,
                      values: m.values.map((v, vi) =>
                        vi === valueIndex ? newVal : v
                      ),
                    }
                  : m
              );
              onUpdateContent("connect_info.contact_methods", updatedMethods);
            }}
            tag="p"
            className="text-stone-900 font-bold text-base"
            placeholder="Enter value…"
          />
        ))}
      </div>
    </div>
  );
};

// ─── MapEmbed ─────────────────────────────────────────────────────────────────

/**
 * Google Maps embed with a hover overlay that lets the editor update the URL.
 */
const MapEmbed = ({ mapEmbedUrl, onUpdateUrl }) => {
  const [editing, setEditing] = useState(false);
  const [draftUrl, setDraftUrl] = useState(mapEmbedUrl || "");

  const handleSave = () => {
    onUpdateUrl(draftUrl);
    setEditing(false);
  };

  return (
    <div className="relative group">
      <div className="w-full aspect-[21/9] rounded-[2rem] overflow-hidden bg-stone-100 border border-stone-100 shadow-sm relative">
        {mapEmbedUrl && (
          <iframe
            title="Map"
            src={mapEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0, filter: "grayscale(0.2) contrast(1.1)" }}
            loading="lazy"
            className="pointer-events-none"
          />
        )}

        {/* Edit overlay — shown on hover */}
        <div
          onClick={() => setEditing(true)}
          className="absolute inset-0 bg-transparent hover:bg-black/10 transition-colors cursor-pointer flex items-center justify-center opacity-0 hover:opacity-100"
        >
          <span className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold shadow-lg">
            Click to update map URL
          </span>
        </div>
      </div>

      {/* URL input popover */}
      {editing && (
        <div className="mt-3 p-4 bg-white border border-gray-200 rounded-xl shadow-xl">
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
            Google Maps Embed URL
          </label>
          <input
            type="url"
            value={draftUrl}
            onChange={(e) => setDraftUrl(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-[#FFAA14]"
            placeholder="https://www.google.com/maps/embed?…"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-[#FFAA14] text-white text-sm py-2 rounded-lg font-semibold hover:bg-yellow-500"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex-1 bg-gray-100 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── ContactInfoSection ───────────────────────────────────────────────────────

/**
 * @param {{
 *   visitInfo       : { address: string, map_embed_url: string },
 *   connectInfo     : { contact_methods: Array },
 *   onUpdateContent : (dotPath: string, value: any) => void,
 * }} props
 */
const ContactInfoSection = ({ visitInfo, connectInfo, onUpdateContent }) => (
  <section className="max-w-7xl mx-auto px-6 pb-24">
    <EditableText
      content="Let us know how we can help"
      onChange={(v) => onUpdateContent("section_title", v)}
      tag="h2"
      className="text-4xl font-black text-[#1A1102] mb-16 tracking-tight max-w-2xl leading-tight"
      placeholder="Enter section title…"
    />

    <div className="grid lg:grid-cols-12 gap-16">

      {/* Left: contact methods */}
      <div className="lg:col-span-3">
        <EditableText
          content="Connect with Us"
          onChange={(v) => onUpdateContent("connect_heading", v)}
          tag="h3"
          className="text-2xl font-black text-[#1A1102] mb-10"
          placeholder="Enter section title…"
        />

        <div className="space-y-10">
          {connectInfo?.contact_methods?.map((method, i) => (
            <ContactMethod
              key={i}
              method={method}
              methodIndex={i}
              connectInfo={connectInfo}
              onUpdateContent={onUpdateContent}
            />
          ))}
        </div>
      </div>

      {/* Right: map + address */}
      <div className="lg:col-span-9">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={20} className="text-[#FFAA14] shrink-0" />
          <EditableText
            content="Visit Us"
            onChange={(v) => onUpdateContent("visit_heading", v)}
            tag="h3"
            className="text-2xl font-black text-[#1A1102]"
            placeholder="Enter section title…"
          />
        </div>

        <EditableText
          content={visitInfo?.address}
          onChange={(v) => onUpdateContent("visit_info.address", v)}
          tag="p"
          className="text-stone-500 text-base font-medium mb-8"
          placeholder="Enter address…"
        />

        <MapEmbed
          mapEmbedUrl={visitInfo?.map_embed_url}
          onUpdateUrl={(url) => onUpdateContent("visit_info.map_embed_url", url)}
        />
      </div>
    </div>
  </section>
);

export default ContactInfoSection;