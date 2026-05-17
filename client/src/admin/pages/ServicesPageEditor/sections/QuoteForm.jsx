/**
 * QuoteForm.jsx
 *
 * The right column of the contact_process section.
 *
 * ── Features ─────────────────────────────────────────────────────────────────
 *  • Property Type toggle (Commercial / Residential) that mutates visible
 *    fields and their labels/placeholders via FIELD_OVERRIDES.
 *  • Nigeria State dropdown — fetched from nga-states-lga.onrender.com
 *  • LGA dropdown — fetched dynamically when state changes
 *  • Location Description textarea — always rendered, not from form_settings
 *  • Success UI shown after submit
 *  • Submit button text is editable via EditableText
 *
 * ── Editing model ─────────────────────────────────────────────────────────────
 *  Each form field's label and placeholder are editable inline (EditableText).
 *  Changes call onUpdateFormField(index, field, value) which updates
 *  form_settings.fields[index] in the section content and marks it dirty.
 *  The submit button text is also editable via onUpdateSubmitText.
 *
 *  NOTE: Field type (text/select/textarea) is NOT editable in-editor —
 *  that would require adding/removing DOM elements mid-render. Change field
 *  types via the CMS directly if needed.
 */

import { useEffect, useState } from "react";
import {
  ChevronDown,
  ArrowUpRight,
  Check,
  MapPin,
  Loader2,
} from "lucide-react";
import EditableText from "../../HomePageEditor/components/EditableText";

// ─── Per-field label/placeholder overrides keyed by field.label + propertyType ─

const FIELD_OVERRIDES = {
  "Business Name": {
    Commercial: { label: "Business Name",  placeholder: "Enter your business name" },
    Residential: { label: "Customer Name", placeholder: "Enter your full name"     },
  },
  "Business Email": {
    Commercial: { label: "Business Email",  placeholder: "Enter business email"        },
    Residential: { label: "Email Address",  placeholder: "Enter your email address"    },
  },
  "Phone Number": {
    Commercial: { label: "Business Phone", placeholder: "" },
    Residential: { label: "Phone Number",  placeholder: "" },
  },
  "Business Description": {
    Commercial: { label: "Business Description", placeholder: "What is your business about?" },
    Residential: null, // hidden for Residential
  },
};

/**
 * Resolve the displayed label + placeholder for a field based on propertyType.
 * Returns null if the field should be hidden for this type.
 */
const resolveField = (field, propertyType) => {
  const override = FIELD_OVERRIDES[field.label];
  if (!override) return { label: field.label, placeholder: field.placeholder };
  const resolved = override[propertyType];
  if (!resolved) return null;
  return {
    label:       resolved.label,
    placeholder: resolved.placeholder || field.placeholder,
  };
};

// ─── SuccessUI ────────────────────────────────────────────────────────────────

const SuccessUI = ({ onReset }) => (
  <div className="flex flex-col items-center justify-center text-center p-12 bg-stone-50/50 rounded-[2.5rem] border border-stone-100 animate-in fade-in zoom-in duration-500">
    <div className="bg-[#F9F9F9] w-full max-w-[360px] rounded-[32px] p-12 text-center shadow-2xl">
      <div className="w-20 h-20 bg-white border border-stone-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
        <div className="w-10 h-10 rounded-full border-2 border-stone-100 flex items-center justify-center">
          <Check size={20} strokeWidth={3} className="text-[#FFAA14]" />
        </div>
      </div>
      <p className="text-stone-500 font-bold text-sm mb-10 px-4 leading-relaxed">
        We have gotten your submission
      </p>
      <button
        onClick={onReset}
        className="w-full bg-[#FFAA14] text-white font-black py-4 rounded-2xl hover:bg-amber-500 transition-all shadow-lg"
      >
        Continue
      </button>
    </div>
  </div>
);

// ─── FieldEditor ──────────────────────────────────────────────────────────────

/**
 * Wraps a form field to make its label and placeholder editable.
 * The actual input/select/textarea is rendered as children.
 *
 * @param {{
 *   label            : string,
 *   placeholder      : string,
 *   fieldIndex       : number,
 *   onUpdateLabel    : (value: string) => void,
 *   onUpdatePlaceholder: (value: string) => void,
 *   children         : React.ReactNode,
 *   fullWidth        : boolean,
 * }} props
 */
const FieldEditor = ({
  label,
  onUpdateLabel,
  fullWidth,
  children,
}) => (
  <div className={`flex flex-col gap-2 ${fullWidth ? "col-span-2" : "col-span-1"}`}>
    <label className="text-xs font-black text-black ml-1">
      <EditableText
        content={label}
        onChange={onUpdateLabel}
        tag="span"
        className="inline"
        placeholder="Field label…"
      />
    </label>
    {children}
  </div>
);

// ─── StateSelect ──────────────────────────────────────────────────────────────

const StateSelect = ({ states, selected, onChange, loading }) => (
  <div className="flex flex-col gap-2 col-span-1">
    <label className="text-xs font-black text-black ml-1">State</label>
    <div className="relative">
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="w-full bg-[#F9F9F9] border border-stone-100 rounded-xl px-4 py-3.5 text-sm font-medium appearance-none outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all disabled:opacity-60"
      >
        {loading
          ? <option>Loading…</option>
          : states.map((s) => <option key={s} value={s}>{s}</option>)
        }
      </select>
      {loading
        ? <Loader2 className="w-4 h-4 text-[#FFAA14] animate-spin absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        : <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFAA14] pointer-events-none" />
      }
    </div>
  </div>
);

// ─── LgaSelect ────────────────────────────────────────────────────────────────

const LgaSelect = ({ lgas, selected, onChange, loading }) => (
  <div className="flex flex-col gap-2 col-span-1">
    <label className="text-xs font-black text-black ml-1">LGA</label>
    <div className="relative">
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading || lgas.length === 0}
        className="w-full bg-[#F9F9F9] border border-stone-100 rounded-xl px-4 py-3.5 text-sm font-medium appearance-none outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all disabled:opacity-60"
      >
        {loading
          ? <option>Loading…</option>
          : lgas.length === 0
          ? <option>Select a state first</option>
          : lgas.map((l) => <option key={l} value={l}>{l}</option>)
        }
      </select>
      {loading
        ? <Loader2 className="w-4 h-4 text-[#FFAA14] animate-spin absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        : <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFAA14] pointer-events-none" />
      }
    </div>
  </div>
);

// ─── QuoteForm ────────────────────────────────────────────────────────────────

/**
 * @param {{
 *   formSettings         : { fields: Array, submit_button_text: string },
 *   onUpdateFormField    : (index: number, field: string, value: string) => void,
 *   onUpdateSubmitText   : (value: string) => void,
 * }} props
 */
const QuoteForm = ({ formSettings, onUpdateFormField, onUpdateSubmitText }) => {
  const [propertyType, setPropertyType]     = useState("Commercial");
  const [isSubmitted, setIsSubmitted]       = useState(false);
  const [locationDetail, setLocationDetail] = useState("");

  // Nigeria State / LGA state
  const [ngStates, setNgStates]           = useState([]);
  const [ngLgas, setNgLgas]               = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedLGA, setSelectedLGA]     = useState("");
  const [statesLoading, setStatesLoading] = useState(true);
  const [lgasLoading, setLgasLoading]     = useState(false);

  // ── Fetch Nigerian states on mount ─────────────────────────────────────────
  useEffect(() => {
    fetch("https://nga-states-lga.onrender.com/fetch")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setNgStates(list);
        if (list.length > 0) setSelectedState(list[0]);
      })
      .catch(() => setNgStates([]))
      .finally(() => setStatesLoading(false));
  }, []);

  // ── Fetch LGAs whenever selected state changes ─────────────────────────────
  useEffect(() => {
    if (!selectedState) return;
    setLgasLoading(true);
    setSelectedLGA("");
    setNgLgas([]);
    fetch(`https://nga-states-lga.onrender.com/?state=${encodeURIComponent(selectedState)}`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setNgLgas(list);
        if (list.length > 0) setSelectedLGA(list[0]);
      })
      .catch(() => setNgLgas([]))
      .finally(() => setLgasLoading(false));
  }, [selectedState]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return <SuccessUI onReset={() => setIsSubmitted(false)} />;
  }

  return (
    <div className="bg-white min-h-[500px] flex flex-col justify-center">
      {/* Form heading — static display, not a CMS field */}
      <h2 className="text-black text-[20px] pb-2">Request Quote</h2>
      <p className="text-[#606060] text-[14px] pb-4">Fill in details</p>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-4 gap-y-6">

        {formSettings?.fields?.map((field, i) => {
          // ── State dropdown ────────────────────────────────────────────────
          if (field.label === "State") {
            return (
              <StateSelect
                key={i}
                states={ngStates}
                selected={selectedState}
                onChange={setSelectedState}
                loading={statesLoading}
              />
            );
          }

          // ── LGA dropdown ──────────────────────────────────────────────────
          if (field.label === "LGA") {
            return (
              <LgaSelect
                key={i}
                lgas={ngLgas}
                selected={selectedLGA}
                onChange={setSelectedLGA}
                loading={lgasLoading}
              />
            );
          }

          // ── Resolve label/placeholder for this property type ───────────────
          const resolved = resolveField(field, propertyType);
          if (!resolved) return null; // hidden for this property type

          const { label: labelText, placeholder: resolvedPlaceholder } = resolved;

          const isFullWidth =
            field.type === "textarea" || labelText.includes("Name");

          // ── Property Type select ──────────────────────────────────────────
          if (field.label === "Property Type") {
            return (
              <FieldEditor
                key={i}
                label={labelText}
                onUpdateLabel={(v) => onUpdateFormField(i, "label", v)}
                fullWidth={false}
              >
                <div className="relative">
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full bg-[#F9F9F9] border border-stone-100 rounded-xl px-4 py-3.5 text-sm font-black text-[#FFAA14] appearance-none outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                  >
                    <option value="Commercial">Commercial</option>
                    <option value="Residential">Residential</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFAA14] pointer-events-none" />
                </div>
              </FieldEditor>
            );
          }

          // ── Generic select ────────────────────────────────────────────────
          if (field.type === "select") {
            return (
              <FieldEditor
                key={i}
                label={labelText}
                onUpdateLabel={(v) => onUpdateFormField(i, "label", v)}
                fullWidth={isFullWidth}
              >
                <div className="relative">
                  <select className="w-full bg-[#F9F9F9] border border-stone-100 rounded-xl px-4 py-3.5 text-sm font-medium appearance-none outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer">
                    <option>{resolvedPlaceholder}</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFAA14] pointer-events-none" />
                </div>
              </FieldEditor>
            );
          }

          // ── Textarea ──────────────────────────────────────────────────────
          if (field.type === "textarea") {
            return (
              <FieldEditor
                key={i}
                label={labelText}
                onUpdateLabel={(v) => onUpdateFormField(i, "label", v)}
                fullWidth={true}
              >
                <textarea
                  rows={4}
                  placeholder={resolvedPlaceholder}
                  className="w-full bg-[#F9F9F9] border border-stone-100 rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
                />
              </FieldEditor>
            );
          }

          // ── Default: text / email / number / tel ──────────────────────────
          return (
            <FieldEditor
              key={i}
              label={labelText}
              onUpdateLabel={(v) => onUpdateFormField(i, "label", v)}
              fullWidth={isFullWidth}
            >
              <input
                type={field.type}
                placeholder={resolvedPlaceholder}
                className="w-full bg-[#F9F9F9] border border-stone-100 rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </FieldEditor>
          );
        })}

        {/* ── Location Description — always last, not from form_settings ── */}
        <div className="col-span-2 flex flex-col gap-2">
          <label className="text-xs font-black text-black ml-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#FFAA14]" />
            Location Description
          </label>
          <textarea
            rows={2}
            value={locationDetail}
            onChange={(e) => setLocationDetail(e.target.value)}
            placeholder="e.g. No. 12, Adebayo Street, off Ikorodu Road, beside First Bank…"
            className="w-full bg-[#F9F9F9] border border-stone-100 rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
          />
        </div>

        {/* ── Submit button ── */}
        <div className="col-span-2 pt-4">
          <button
            type="submit"
            className="w-fit bg-[#FDB927] hover:bg-amber-500 text-white font-black px-10 py-4 rounded-xl shadow-lg shadow-amber-200/50 transition-all active:scale-95 flex items-center gap-2"
          >
            <EditableText
              content={formSettings?.submit_button_text || "Submit Request"}
              onChange={onUpdateSubmitText}
              tag="span"
              className="pointer-events-none"
              placeholder="Button text…"
            />
            <ArrowUpRight size={18} className="shrink-0 pointer-events-none" />
          </button>
        </div>

      </form>
    </div>
  );
};

export default QuoteForm;