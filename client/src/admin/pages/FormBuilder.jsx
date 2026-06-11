import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../utils/api.js";

// Auth is handled by the shared cookie-based adminApi instance (httpOnly cookie
// + automatic token refresh). The previous `Bearer ${localStorage.token}` was
// broken — nothing in this app ever sets a "token" key, so those requests went
// out unauthenticated — and storing a JWT in localStorage would expose it to XSS.

const FIELD_TYPES = [
  { value: "input",    label: "Text Input" },
  { value: "email",    label: "Email" },
  { value: "phone",    label: "Phone" },
  { value: "textarea", label: "Text Area" },
  { value: "dropdown", label: "Dropdown" },
];

// ─── blank templates ─────────────────────────────────────────────────────────
const blankField = (order) => ({
  _id: Math.random().toString(36).slice(2),   // temp client id
  label: "",
  field_type: "input",
  placeholder: "",
  is_required: false,
  sort_order: order,
  options: [],
});

const blankOption = () => ({
  _id: Math.random().toString(36).slice(2),
  label: "",
  value: "",
  sort_order: 0,
});

// ─── small pill badge ────────────────────────────────────────────────────────
function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#D4A853]/12 text-[#B8882E] text-[10px] font-semibold px-2 py-0.5 uppercase tracking-wider">
      {children}
    </span>
  );
}

// ─── icon button ─────────────────────────────────────────────────────────────
function IconBtn({ onClick, title, danger, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-colors ${
        danger
          ? "text-red-400 hover:bg-red-50 hover:text-red-600"
          : "text-[#ABABAB] hover:bg-[#F0F0EE] hover:text-[#1A1A1A]"
      }`}
    >
      {children}
    </button>
  );
}

// ─── option row ──────────────────────────────────────────────────────────────
function OptionRow({ opt, onChange, onDelete }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <input
        className="flex-1 bg-white border border-[#E8E8E8] rounded-lg px-3 py-1.5 text-xs placeholder-[#BEBEBE] focus:outline-none focus:border-[#D4A853]"
        placeholder="Label (shown to user)"
        value={opt.label}
        onChange={(e) => onChange({ ...opt, label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
      />
      <input
        className="w-28 bg-white border border-[#E8E8E8] rounded-lg px-3 py-1.5 text-xs font-mono placeholder-[#BEBEBE] focus:outline-none focus:border-[#D4A853]"
        placeholder="value"
        value={opt.value}
        onChange={(e) => onChange({ ...opt, value: e.target.value })}
      />
      <IconBtn danger onClick={onDelete} title="Remove option">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </IconBtn>
    </div>
  );
}

// ─── field card ──────────────────────────────────────────────────────────────
function FieldCard({ field, index, total, onChange, onDelete, onMove }) {
  const [expanded, setExpanded] = useState(!field.label);

  const update = (patch) => onChange({ ...field, ...patch });

  const addOption = () =>
    update({ options: [...field.options, { ...blankOption(), sort_order: field.options.length }] });

  const updateOption = (i, opt) => {
    const opts = [...field.options];
    opts[i] = opt;
    update({ options: opts });
  };

  const deleteOption = (i) =>
    update({ options: field.options.filter((_, j) => j !== i) });

  return (
    <div className="border border-[#EBEBEB] rounded-2xl bg-white overflow-hidden shadow-sm">
      {/* card header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-[#FAFAF8]"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="text-[#DCDCDC] text-xs font-mono w-5 text-center">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1A1A1A] truncate">
            {field.label || <span className="text-[#ABABAB] font-normal">Untitled field</span>}
          </p>
        </div>
        <Badge>{FIELD_TYPES.find((t) => t.value === field.field_type)?.label}</Badge>
        {field.is_required && <Badge>Required</Badge>}
        <div className="flex items-center gap-0.5 ml-1" onClick={(e) => e.stopPropagation()}>
          <IconBtn onClick={() => onMove(index, -1)} title="Move up" disabled={index === 0}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </IconBtn>
          <IconBtn onClick={() => onMove(index, 1)} title="Move down" disabled={index === total - 1}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </IconBtn>
          <IconBtn danger onClick={() => onDelete(field)} title="Delete field">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </IconBtn>
        </div>
        <svg
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
          className={`w-4 h-4 text-[#ABABAB] transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* card body */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-[#F0F0EE] space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#767676] mb-1 block">Label *</label>
              <input
                className="w-full bg-[#F7F7F5] border border-transparent rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#D4A853] focus:bg-white"
                placeholder="e.g. Business Name"
                value={field.label}
                onChange={(e) => update({ label: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-[#767676] mb-1 block">Field Type *</label>
              <div className="relative">
                <select
                  className="w-full bg-[#F7F7F5] border border-transparent rounded-xl px-3 py-2 text-sm appearance-none focus:outline-none focus:border-[#D4A853] focus:bg-white"
                  value={field.field_type}
                  onChange={(e) => update({ field_type: e.target.value, options: e.target.value !== "dropdown" ? [] : field.options })}
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#D4A853] text-xs">▾</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-[#767676] mb-1 block">Placeholder</label>
            <input
              className="w-full bg-[#F7F7F5] border border-transparent rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#D4A853] focus:bg-white"
              placeholder="e.g. Enter your business name"
              value={field.placeholder}
              onChange={(e) => update({ placeholder: e.target.value })}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <div
              onClick={() => update({ is_required: !field.is_required })}
              className={`w-9 h-5 rounded-full transition-colors relative ${field.is_required ? "bg-[#D4A853]" : "bg-[#DCDCDC]"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${field.is_required ? "translate-x-4" : ""}`} />
            </div>
            <span className="text-xs text-[#767676]">Required field</span>
          </label>

          {/* Dropdown options */}
          {field.field_type === "dropdown" && (
            <div className="bg-[#FAFAF8] rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#767676]">Dropdown Options</span>
                <button
                  onClick={addOption}
                  className="text-xs text-[#D4A853] hover:text-[#B8882E] font-medium flex items-center gap-1"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add option
                </button>
              </div>
              {field.options.length === 0 && (
                <p className="text-xs text-[#BEBEBE] italic py-1">No options yet — add one above.</p>
              )}
              {field.options.map((opt, i) => (
                <OptionRow
                  key={opt._id ?? opt.id ?? i}
                  opt={opt}
                  onChange={(updated) => updateOption(i, updated)}
                  onDelete={() => deleteOption(i)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── main admin builder ──────────────────────────────────────────────────────
export default function FormBuilder({ formId, onBack }) {
  const [formName, setFormName]       = useState("Request Form");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive]       = useState(true);
  const [fields, setFields]           = useState([]);
  const [loading, setLoading]         = useState(!!formId);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [error, setError]             = useState(null);

  // Load existing form
  useEffect(() => {
    if (!formId) return;
    let cancelled = false;
    adminApi.get(`/admin/forms/${formId}`)
      .then(({ data: { data } }) => {
        if (cancelled) return;
        setFormName(data.name);
        setDescription(data.description ?? "");
        setIsActive(data.is_active);
        setFields(
          [...(data.fields ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((f) => ({
            ...f,
            _id: f.id,
            options: (f.options ?? []).map((o) => ({ ...o, _id: o.id })),
          }))
        );
      })
      .catch((e) => { if (!cancelled) setError(e.response?.data?.message ?? e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [formId]);

  const addField = () =>
    setFields((prev) => [...prev, blankField(prev.length)]);

  const updateField = useCallback((index, updated) => {
    setFields((prev) => prev.map((f, i) => (i === index ? updated : f)));
  }, []);

  const deleteField = useCallback((field) => {
    setFields((prev) => prev.filter((f) => (f._id ?? f.id) !== (field._id ?? field.id)));
  }, []);

  const moveField = useCallback((index, dir) => {
    setFields((prev) => {
      const next = [...prev];
      const to = index + dir;
      if (to < 0 || to >= next.length) return prev;
      [next[index], next[to]] = [next[to], next[index]];
      return next.map((f, i) => ({ ...f, sort_order: i }));
    });
  }, []);

  const handleSave = async () => {
    if (!formName.trim()) { setError("Form name is required"); return; }
    setSaving(true);
    setError(null);

    const payload = {
      name: formName,
      description,
      is_active: isActive,
      fields: fields.map((f, i) => ({
        ...(f.id ? { id: f.id } : {}),
        label: f.label,
        field_type: f.field_type,
        placeholder: f.placeholder,
        is_required: f.is_required,
        sort_order: i,
        options: (f.options ?? []).map((o, j) => ({
          ...(o.id ? { id: o.id } : {}),
          label: o.label,
          value: o.value,
          sort_order: j,
        })),
      })),
    };

    try {
      if (formId) await adminApi.put(`/admin/forms/${formId}`, payload);
      else        await adminApi.post(`/admin/forms`, payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.response?.data?.message ?? e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-2 h-2 rounded-full bg-[#D4A853] animate-bounce" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500&display=swap');
        * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.35s ease both; }
      `}</style>

      <div className="min-h-screen bg-[#FAFAF8]">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-[#FAFAF8]/90 backdrop-blur-sm border-b border-[#EBEBEB] px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-[#767676] hover:text-[#1A1A1A] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <span className="text-[#DCDCDC]">|</span>
            <span className="text-xs text-[#ABABAB]">Form Builder</span>
          </div>

          <div className="flex items-center gap-2">
            {saved && (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 fade-up">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-[#1A1A1A] text-white text-sm font-medium hover:bg-[#D4A853] disabled:opacity-50 transition-all duration-200"
            >
              {saving ? "Saving…" : formId ? "Save changes" : "Create form"}
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
          {/* Form meta */}
          <div className="bg-white border border-[#EBEBEB] rounded-2xl p-5 shadow-sm fade-up">
            <h2 className="text-xs font-semibold text-[#ABABAB] uppercase tracking-widest mb-4">Form Details</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#767676] mb-1 block">Form Name *</label>
                <input
                  className="w-full bg-[#F7F7F5] border border-transparent rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4A853] focus:bg-white"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Request Form"
                />
              </div>
              <div>
                <label className="text-xs text-[#767676] mb-1 block">Description</label>
                <input
                  className="w-full bg-[#F7F7F5] border border-transparent rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4A853] focus:bg-white"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description shown to users"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <div
                  onClick={() => setIsActive((v) => !v)}
                  className={`w-9 h-5 rounded-full transition-colors relative ${isActive ? "bg-[#D4A853]" : "bg-[#DCDCDC]"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isActive ? "translate-x-4" : ""}`} />
                </div>
                <span className="text-xs text-[#767676]">Form is active (accepting submissions)</span>
              </label>
            </div>
          </div>

          {/* Fields */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-[#ABABAB] uppercase tracking-widest">
                Fields ({fields.length})
              </h2>
            </div>

            {fields.length === 0 && (
              <div className="border-2 border-dashed border-[#E8E8E8] rounded-2xl p-10 text-center fade-up">
                <p className="text-sm text-[#ABABAB]">No fields yet.</p>
                <p className="text-xs text-[#BEBEBE] mt-1">Add your first field below.</p>
              </div>
            )}

            <div className="space-y-3">
              {fields.map((field, i) => (
                <div key={field._id ?? field.id ?? i} className="fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                  <FieldCard
                    field={field}
                    index={i}
                    total={fields.length}
                    onChange={(updated) => updateField(i, updated)}
                    onDelete={deleteField}
                    onMove={moveField}
                  />
                </div>
              ))}
            </div>

            {/* Add field */}
            <div className="mt-3 flex gap-2">
              <button
                onClick={addField}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#D4A853] text-[#D4A853] text-sm font-medium hover:bg-[#D4A853]/5 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Input Field
              </button>
              <button
                onClick={() => setFields((prev) => [...prev, { ...blankField(prev.length), field_type: "dropdown" }])}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#DCDCDC] text-[#767676] text-sm font-medium hover:bg-[#F0F0EE] transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Dropdown
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 fade-up">
              {error}
            </div>
          )}
        </div>
      </div>
    </>
  );
}