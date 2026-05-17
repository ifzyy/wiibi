import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Building2,
  ClipboardList,
  FileSearch,
  ChevronRight,
  Zap,
  ChevronDown,
  ArrowUpRight,
  Check,
  MapPin,
  Loader2,
} from "lucide-react";

import api from "../utils/api";

// ─── Change this to match your form's ID in the database ─────────────────────
const QUOTE_FORM_ID = 1;

// ─── Field label/placeholder overrides per property type ─────────────────────
const FIELD_OVERRIDES = {
  "Business Name": {
    Commercial: { label: "Business Name",    placeholder: "Enter your business name" },
    Residential: { label: "Customer Name",   placeholder: "Enter your full name" },
  },
  "Business Email": {
    Commercial: { label: "Business Email",   placeholder: "Enter business email" },
    Residential: { label: "Email Address",   placeholder: "Enter your email address" },
  },
  "Phone Number": {
    Commercial: { label: "Business Phone",   placeholder: "" },
    Residential: { label: "Phone Number",    placeholder: "" },
  },
  "Business Description": {
    Commercial: { label: "Business Description", placeholder: "What is your business about?" },
    Residential: null, // hidden for residential
  },
};

// ─── helpers ──────────────────────────────────────────────────────────────────
function resolveField(field, propertyType) {
  const override = FIELD_OVERRIDES[field.label];
  if (!override) return { label: field.label, placeholder: field.placeholder ?? "" };
  const resolved = override[propertyType];
  if (!resolved) return null;
  return { label: resolved.label, placeholder: resolved.placeholder || field.placeholder || "" };
}

function buildSubmissionData({ fields, values, propertyType, selectedState, selectedLGA, locationDetail }) {
  const data = {};
  fields.forEach((field) => {
    const resolved = resolveField(field, propertyType);
    if (!resolved) return;
    if (field.label === "State")         { data["State"]         = selectedState; return; }
    if (field.label === "LGA")           { data["LGA"]           = selectedLGA;   return; }
    if (field.label === "Property Type") { data["Property Type"] = propertyType;  return; }
    data[resolved.label] = values[field.label] ?? "";
  });
  data["Location Description"] = locationDetail;
  return data;
}

// ─── sub-components ───────────────────────────────────────────────────────────
function SelectWrapper({ children, loading }) {
  return (
    <div className="relative group">
      {children}
      {loading ? (
        <Loader2 className="w-4 h-4 text-[#FFAA14] animate-spin absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
      ) : (
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFAA14] pointer-events-none" />
      )}
    </div>
  );
}

const selectCls =
  "w-full bg-[#F9F9F9] border border-stone-100 rounded-xl px-4 py-3.5 text-sm font-medium appearance-none outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer disabled:opacity-60";

const inputCls =
  "w-full bg-[#F9F9F9] border border-stone-100 rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all";

// ─── skeleton while schema loads ──────────────────────────────────────────────
function FormSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 animate-pulse">
      {[2, 1, 1, 1, 1, 2].map((span, i) => (
        <div key={i} className={`flex flex-col gap-2 col-span-${span}`}>
          <div className="h-3 bg-stone-100 rounded w-1/3" />
          <div className="h-12 bg-stone-100 rounded-xl" />
        </div>
      ))}
      <div className="col-span-2 flex flex-col gap-2">
        <div className="h-3 bg-stone-100 rounded w-1/4" />
        <div className="h-20 bg-stone-100 rounded-xl" />
      </div>
      <div className="col-span-2 pt-4">
        <div className="h-14 bg-stone-100 rounded-xl w-40" />
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export const QuoteRequestForm = () => {
  // ── schema ──
  const [formSchema, setFormSchema]       = useState(null);
  const [schemaLoading, setSchemaLoading] = useState(true);
  const [schemaError, setSchemaError]     = useState(null);

  // ── field values ──
  const [values, setValues]               = useState({});
  const [propertyType, setPropertyType]   = useState("Commercial");
  const [locationDetail, setLocationDetail] = useState("");

  // ── Nigerian location ──
  const [ngStates, setNgStates]           = useState([]);
  const [ngLgas, setNgLgas]               = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedLGA, setSelectedLGA]     = useState("");
  const [statesLoading, setStatesLoading] = useState(true);
  const [lgasLoading, setLgasLoading]     = useState(false);

  // ── submission ──
  const [submitting, setSubmitting]       = useState(false);
  const [submitError, setSubmitError]     = useState(null);
  const [isSubmitted, setIsSubmitted]     = useState(false);

  // ── fetch form schema ──
  useEffect(() => {
    api
      .get(`/admin/forms/${QUOTE_FORM_ID}`)
      .then(({ data }) => setFormSchema(data.data))
      .catch((err) =>
        setSchemaError(err?.response?.data?.message ?? "Failed to load form")
      )
      .finally(() => setSchemaLoading(false));
  }, []);

  // ── fetch Nigerian states ──
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

  // ── fetch LGAs on state change ──
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

  const handleChange = (fieldLabel, val) =>
    setValues((prev) => ({ ...prev, [fieldLabel]: val }));

  const sortedFields = [...(formSchema?.fields ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  // ── submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const data = buildSubmissionData({
        fields: sortedFields,
        values,
        propertyType,
        selectedState,
        selectedLGA,
        locationDetail,
      });
      await api.post(`/forms/${QUOTE_FORM_ID}/submit`, { data });
      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(
        err?.response?.data?.message ?? err?.message ?? "Submission failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setValues({});
    setLocationDetail("");
    setSubmitError(null);
  };

  // ── success ──
  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 bg-stone-50/50 rounded-[2.5rem] border border-stone-100 animate-in fade-in zoom-in duration-500">
        <div className="bg-[#F9F9F9] w-full max-w-[360px] rounded-[32px] p-12 text-center shadow-2xl animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-white border border-stone-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
            <div className="w-10 h-10 rounded-full border-2 border-stone-100 flex items-center justify-center">
              <Check size={20} strokeWidth={3} className="text-[#FFAA14]" />
            </div>
          </div>
          <p className="text-stone-500 font-bold text-sm mb-10 px-4 leading-relaxed">
            We have gotten your submission
          </p>
          <button
            onClick={handleReset}
            className="w-full bg-[#FFAA14] text-white font-black py-4 rounded-2xl hover:bg-amber-500 transition-all shadow-lg"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // ── schema error ──
  if (schemaError) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 text-sm text-red-600">
        {schemaError}
      </div>
    );
  }

  return (
    <>
      <h2 className="text-black text-[20px] pb-2">
        {schemaLoading ? "Request Quote" : (formSchema?.name ?? "Request Quote")}
      </h2>
      <p className="text-[#606060] text-[14px] pb-4">
        {schemaLoading ? "Fill in details" : (formSchema?.description ?? "Fill in details")}
      </p>

      {schemaLoading ? (
        <FormSkeleton />
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-4 gap-y-6">
          {sortedFields.map((field, i) => {

            // ── State ──
            if (field.label === "State") {
              return (
                <div key={i} className="flex flex-col gap-2 col-span-1">
                  <label className="text-xs font-black text-black ml-1">State</label>
                  <SelectWrapper loading={statesLoading}>
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      disabled={statesLoading}
                      className={selectCls}
                    >
                      {statesLoading ? (
                        <option>Loading…</option>
                      ) : (
                        ngStates.map((s) => <option key={s} value={s}>{s}</option>)
                      )}
                    </select>
                  </SelectWrapper>
                </div>
              );
            }

            // ── LGA ──
            if (field.label === "LGA") {
              return (
                <div key={i} className="flex flex-col gap-2 col-span-1">
                  <label className="text-xs font-black text-black ml-1">LGA</label>
                  <SelectWrapper loading={lgasLoading}>
                    <select
                      value={selectedLGA}
                      onChange={(e) => setSelectedLGA(e.target.value)}
                      disabled={lgasLoading || ngLgas.length === 0}
                      className={selectCls}
                    >
                      {lgasLoading ? (
                        <option>Loading…</option>
                      ) : ngLgas.length === 0 ? (
                        <option>Select a state first</option>
                      ) : (
                        ngLgas.map((l) => <option key={l} value={l}>{l}</option>)
                      )}
                    </select>
                  </SelectWrapper>
                </div>
              );
            }

            // ── All other fields ──
            const resolved = resolveField(field, propertyType);
            if (!resolved) return null;

            const { label: labelText, placeholder: resolvedPlaceholder } = resolved;
            const isFullWidth =
              field.field_type === "textarea" || labelText.includes("Name");

            return (
              <div
                key={i}
                className={`flex flex-col gap-2 ${isFullWidth ? "col-span-2" : "col-span-1"}`}
              >
                <label className="text-xs font-black text-black ml-1">{labelText}</label>
                <div className="relative group">

                  {/* Property Type */}
                  {field.label === "Property Type" ? (
                    <SelectWrapper>
                      <select
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value)}
                        className={`${selectCls} font-black text-[#FFAA14]`}
                      >
                        {field.options?.length > 0 ? (
                          field.options
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map((opt) => (
                              <option key={opt.id ?? opt.value} value={opt.label}>
                                {opt.label}
                              </option>
                            ))
                        ) : (
                          <>
                            <option value="Commercial">Commercial</option>
                            <option value="Residential">Residential</option>
                          </>
                        )}
                      </select>
                    </SelectWrapper>

                  ) : field.field_type === "dropdown" ? (
                    <SelectWrapper>
                      <select
                        value={values[field.label] ?? ""}
                        onChange={(e) => handleChange(field.label, e.target.value)}
                        className={selectCls}
                      >
                        {resolvedPlaceholder && (
                          <option value="" disabled>{resolvedPlaceholder}</option>
                        )}
                        {(field.options ?? [])
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .map((opt) => (
                            <option key={opt.id ?? opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                      </select>
                    </SelectWrapper>

                  ) : field.field_type === "textarea" ? (
                    <textarea
                      rows={4}
                      value={values[field.label] ?? ""}
                      onChange={(e) => handleChange(field.label, e.target.value)}
                      placeholder={resolvedPlaceholder}
                      className={`${inputCls} resize-none`}
                    />

                  ) : (
                    <input
                      type={
                        field.field_type === "email" ? "email"
                        : field.field_type === "phone" ? "tel"
                        : "text"
                      }
                      value={values[field.label] ?? ""}
                      onChange={(e) => handleChange(field.label, e.target.value)}
                      placeholder={resolvedPlaceholder}
                      className={inputCls}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {/* Location Description — always shown */}
          <div className="col-span-2 flex flex-col gap-2">
            <label className="text-xs font-black text-black ml-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#FFAA14]" />
              Location Description
            </label>
            <textarea
              rows={2}
              value={locationDetail}
              onChange={(e) => setLocationDetail(e.target.value)}
              placeholder="e.g. No. 12, Adebayo Street, off Ikorodu Road, beside First Bank..."
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Error */}
          {submitError && (
            <div className="col-span-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
              {submitError}
            </div>
          )}

          {/* Submit */}
          <div className="col-span-2 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-fit bg-[#FDB927] hover:bg-amber-500 text-white font-black px-10 py-4 rounded-xl shadow-lg shadow-amber-200/50 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  {formSchema?.submit_button_text ?? "Submit Request"}
                  <ArrowUpRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </>
  );
};
// ── Page ──────────────────────────────────────────────────────────────────────
const ServicesPage = () => {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);

  const getFallbackImage = () =>
    `https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=1000&auto=format&fit=crop`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/public/pages/services");
        setPageData(response.data);
      } catch (error) {
        console.error("Error fetching page data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-20 text-center font-bold">Loading...</div>;
  if (!pageData) return <div className="p-20 text-center font-bold">Page not found.</div>;

  return (
    <main className="bg-white min-h-screen">
      {pageData.sections
        .sort((a, b) => a.order - b.order)
        .map((section) => {
          switch (section.type) {
            case "hero":
              return (
                <React.Fragment key={section.id}>
                  <header className="max-w-7xl mx-auto px-6 pt-4 pb-12 border-b border-stone-50">
                    <nav className="flex items-center gap-2 text-[10px] font-normal uppercase tracking-widest text-[#ffaa14] mb-8">
                      <a href="/" className="text-black">Home</a>
                      <ChevronRight size={10} strokeWidth={4} />
                      <span className="text-[#ffaa14]">service</span>
                    </nav>
                    <p className="text-[#FFAA14] font-bold text-xs uppercase tracking-widest mb-3">
                      {section.content.title}
                    </p>
                    <h1 className="text-4xl md:text-5xl font-black">
                      {section.content.subtitle}
                    </h1>
                  </header>
                  <div className="border-[1px] border-[#f1f1f1] p-0" />
                </React.Fragment>
              );

            case "main":
              return (
                <section key={section.id} className="max-w-7xl mx-auto px-6 py-20 space-y-32">
                  {section.content.main_steps.map((step, index) => (
                    <div key={index} className="grid md:grid-cols-2 gap-12 md:gap-24">
                      <div className={`bg-stone-100 rounded-2xl aspect-[4/3] overflow-hidden ${index % 2 !== 0 ? "md:order-2" : ""}`}>
                        <img
                          src={getFallbackImage()}
                          alt={step.main_heading}
                          className="w-full h-full object-cover mix-blend-multiply opacity-80"
                        />
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-3xl font-black text-[#FFAA14] leading-tight">
                          {step.main_heading}
                        </h3>
                        <p className="text-[#606060] line-clamp-4 text-lg leading-relaxed max-w-md">
                          {step.support_text}
                        </p>
                      </div>
                    </div>
                  ))}
                </section>
              );

            case "contact_process":
              return (
                <section key={section.id} className="py-24">
                  <div className="border border-[#D9D9D9] w-full">
                    <div className="max-w-7xl mx-auto px-6 py-8">
                      <p className="text-[#FFAA14] font-medium">
                        {section.content.header.sub_heading}
                      </p>
                      <h3 className="text-3xl font-black text-black mb-2">
                        {section.content.header.main_heading}
                      </h3>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-20 max-w-7xl mx-auto px-6 py-8">
                    {/* LEFT: PROCESS STEPS */}
                    <div className="space-y-16">
                      {section.content.process_steps.map((step, idx) => (
                        <div key={idx} className="relative flex flex-col group">
                          {idx !== section.content.process_steps.length - 1 && (
                            <div className="absolute left-[26px] top-14 w-[1px] h-full bg-amber-100" />
                          )}
                          <div>
                            <div className="pb-2 rounded-2xl group-hover:bg-white group-hover:shadow-md transition-all duration-300">
                              {PROCESS_ICONS[step.step_number] || <Zap size={20} />}
                            </div>
                            <h4 className="text-[14px] font-black text-[#FFAA14] mb-3">
                              {step.step_number} {step.heading}
                            </h4>
                            <p className="text-stone-500 text-sm leading-relaxed max-w-sm">
                              {step.support_text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* RIGHT: FORM */}
                    <div className="bg-white min-h-[500px] flex flex-col justify-center">
                      <QuoteRequestForm formSettings={section.content.form_settings} />
                    </div>
                  </div>
                </section>
              );

            default:
              return null;
          }
        })}
    </main>
  );
};

export default ServicesPage;