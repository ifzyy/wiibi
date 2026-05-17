import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronDown,
  Loader2,
  Plus,
  Trash2,
  X,
  ArrowLeft,
  Check,
  AlertCircle,
  ChevronUp,
} from "lucide-react";
import api from "../../../utils/api";

const QUOTE_FORM_ID = 1;

const FIELD_TYPES = [
  { value: "input",    label: "Input Field" },
  { value: "dropdown", label: "Drop down" },
  { value: "email",    label: "Email" },
  { value: "phone",    label: "Phone" },
  { value: "textarea", label: "Business Description" },
];

const uid = () => Math.random().toString(36).slice(2);

const inpStyle =
  "w-full bg-[#F3F3F3] border-none rounded-lg px-4 py-4 text-sm text-stone-600 placeholder-stone-400 outline-none focus:ring-2 focus:ring-amber-400/20 transition-all";

const smallInp =
  "w-full bg-[#F3F3F3] border-none rounded-lg px-3 py-2.5 text-xs text-stone-600 placeholder-stone-400 outline-none focus:ring-2 focus:ring-amber-400/20 transition-all";

// ─── Dropdown option row ──────────────────────────────────────────────────────
function OptionRow({ opt, onChange, onDelete }) {
  return (
    <div className="flex items-center gap-2">
      <input
        className={`${smallInp} flex-1`}
        placeholder="Option label e.g. Commercial"
        value={opt.label}
        onChange={(e) => {
          const label = e.target.value;
          onChange({
            ...opt,
            label,
            value: label.toLowerCase().replace(/\s+/g, "_"),
          });
        }}
      />
      <button
        type="button"
        onClick={onDelete}
        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ─── Single field row ─────────────────────────────────────────────────────────
function FieldRow({ field, index, onChange, onDelete }) {
  const [optionsOpen, setOptionsOpen] = useState(false);

  const updateOption = (i, updated) => {
    const opts = [...(field.options ?? [])];
    opts[i] = updated;
    onChange({ ...field, options: opts });
  };

  const addOption = () => {
    onChange({
      ...field,
      options: [
        ...(field.options ?? []),
        { _uid: uid(), label: "", value: "", sort_order: (field.options ?? []).length },
      ],
    });
  };

  const deleteOption = (i) => {
    onChange({ ...field, options: field.options.filter((_, j) => j !== i) });
  };

  return (
    <div className="relative group">
      {/* Editable label + delete */}
      <div className="flex items-center gap-2 mb-3">
        <input
          className="flex-1 text-sm font-semibold bg-transparent border-b border-dashed border-stone-200 focus:border-amber-400 outline-none pb-0.5 transition-colors placeholder-stone-300"
          placeholder="Field name"
          value={field.label}
          onChange={(e) => onChange({ ...field, label: e.target.value })}
        />
        {field._new && (
          <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
            New
          </span>
        )}
        <button
          onClick={() => onDelete(index)}
          className="p-2 bg-red-50 rounded-md text-red-500 hover:bg-red-100 transition-colors flex-shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Field preview */}
      <div className="flex-1 relative">
        {field.field_type === "dropdown" ? (
          <>
            <div className={`${inpStyle} text-stone-400 truncate`}>
              {(field.options ?? []).length > 0
                ? (field.options ?? []).map((o) => o.label).filter(Boolean).join(", ") || "Select option"
                : "Select option"}
            </div>
            <ChevronDown
              className="absolute right-4 top-1/2 -translate-y-1/2 text-black pointer-events-none"
              size={18}
            />
          </>
        ) : field.field_type === "textarea" ? (
          <textarea
            className={`${inpStyle} resize-none`}
            rows={3}
            placeholder={field.placeholder || `Enter ${(field.label || "text").toLowerCase()}`}
            readOnly
          />
        ) : (
          <input
            className={inpStyle}
            placeholder={field.placeholder || `Enter ${(field.label || "text").toLowerCase()}`}
            readOnly
          />
        )}
      </div>

      {/* Dropdown options editor */}
     {field.field_type === "dropdown" && !["State", "LGA"].includes(field.label) && (
        <div className="mt-3 bg-[#FAFAFA] rounded-xl border border-stone-100 overflow-hidden">
          <button
            type="button"
            onClick={() => setOptionsOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-black text-stone-500 hover:bg-stone-50 transition-colors"
          >
            <span>
              Options{" "}
              <span className="text-amber-500">({(field.options ?? []).length})</span>
            </span>
            {optionsOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {optionsOpen && (
            <div className="px-4 pb-4 space-y-2 border-t border-stone-100 pt-3">
              {(field.options ?? []).length === 0 && (
                <p className="text-[11px] text-stone-300 italic">
                  No options yet — add one below.
                </p>
              )}
              {(field.options ?? []).map((opt, i) => (
                <OptionRow
                  key={opt._uid ?? opt.id ?? i}
                  opt={opt}
                  onChange={(updated) => updateOption(i, updated)}
                  onDelete={() => deleteOption(i)}
                />
              ))}
              <button
                type="button"
                onClick={addOption}
                className="flex items-center gap-1.5 text-[11px] font-black text-amber-500 hover:text-amber-600 mt-1 transition-colors"
              >
                <Plus size={11} />
                Add option
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function RequestFormAdmin({ onBack }) {
  const [fields, setFields]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [error, setError]             = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const saveTimeoutRef = useRef(null);

  // ── fetch ──
  useEffect(() => {
    const fetchForm = async () => {
      try {
        const { data } = await api.get(`/admin/forms/${QUOTE_FORM_ID}`);
        
        // Validate response structure
        if (!data || !data.data || !Array.isArray(data.data.fields)) {
          console.error("Invalid response structure:", data);
          setError("Invalid form data received from server");
          setFields([]);
          return;
        }
        
        const fetchedFields = data.data.fields
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((f) => ({
            ...f,
            _uid: f.id,
            options: (f.options || []).sort((a, b) => a.sort_order - b.sort_order),
          }));
        
        setFields(fetchedFields);
      } catch (err) {
        console.error("Error fetching form:", err);
        setError(err?.response?.data?.message ?? "Failed to load form");
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, []);

  const addField = (type) => {
    const newField = {
      _uid:        uid(),
      label:       "",
      field_type:  type,
      placeholder: "",
      is_required: false,
      is_active:   true,
      sort_order:  fields.length,
      options:     [],
      _new:        true,
    };
    
    setFields((prev) => [...prev, newField]);
    setShowAddMenu(false);
  };

  const updateField = useCallback((index, updated) => {
    setFields((prev) => prev.map((f, i) => i === index ? updated : f));
  }, []);

  const deleteField = useCallback(async (index) => {
    const field = fields[index];
    setError(null);
    
    if (field.id) {
      try {
        await api.delete(`/admin/forms/${QUOTE_FORM_ID}/fields/${field.id}`);
      } catch (err) {
        console.error("Error deleting field:", err);
        setError(err?.response?.data?.message ?? "Failed to delete field");
        return;
      }
    }
    
    setFields((prev) => prev.filter((_, i) => i !== index));
  }, [fields]);

  const validateFields = () => {
    for (const f of fields) {
      if (!f.label.trim()) {
        setError("All fields must have a name");
        return false;
      }
      
      const NGA_FIELDS = ["State", "LGA"];
      if (f.field_type === "dropdown" && !NGA_FIELDS.includes(f.label) && (f.options ?? []).length === 0) {
        setError(`"${f.label}" dropdown needs at least one option`);
        return false;
      }
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateFields()) {
      return;
    }

    setSaving(true);
    setError(null);

    // Prepare payload
    const payload = {
      fields: fields.map((f, i) => {
        const fieldPayload = {
          ...(f.id ? { id: f.id } : {}),
          label:       f.label,
          field_type:  f.field_type,
          placeholder: f.placeholder || "",
          is_required: f.is_required || false,
          is_active:   f.is_active !== undefined ? f.is_active : true,
          sort_order:  i,
          options: (f.options || []).map((o, j) => ({
            ...(o.id ? { id: o.id } : {}),
            label:      o.label,
            value:      o.value || o.label.toLowerCase().replace(/\s+/g, "_"),
            sort_order: j,
          })),
        };
        
        // Remove temporary flags
        delete fieldPayload._new;
        delete fieldPayload._uid;
        
        return fieldPayload;
      }),
    };

    try {
      const { data } = await api.put(`/admin/forms/${QUOTE_FORM_ID}`, payload);
      
      // CRITICAL FIX: Validate response before updating state
      if (!data || !data.data) {
        console.error("Invalid response - missing data property:", data);
        throw new Error("Server returned invalid response structure");
      }
      
      // Check if fields array exists and is valid
      const responseFields = data.data.fields;
      if (!Array.isArray(responseFields)) {
        console.error("Response fields is not an array:", responseFields);
        throw new Error("Server returned invalid fields data");
      }
      
      // If server returned empty fields but we had fields before, this might be an error
      if (responseFields.length === 0 && fields.length > 0) {
        console.warn("Server returned empty fields array but we had fields before");
        console.warn("This might indicate a server error. Keeping existing fields.");
        setError("Warning: Server returned empty form data. Your changes may not have saved correctly. Please refresh and check.");
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        return;
      }
      
      // Process the response
      const updatedFields = responseFields
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((f) => ({
          ...f,
          _uid: f.id,
          options: (f.options || []).sort((a, b) => a.sort_order - b.sort_order),
        }));
      
      setFields(updatedFields);
      setSaved(true);
      
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        setSaved(false);
      }, 2500);
      
    } catch (err) {
      console.error("Error saving form:", err);
      
      // Provide more detailed error message
      let errorMessage = "Failed to save form";
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      // Check for specific HTTP status codes
      if (err?.response?.status === 400) {
        errorMessage = "Bad request: " + errorMessage;
      } else if (err?.response?.status === 404) {
        errorMessage = "Form not found on server";
      } else if (err?.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-amber-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-[#1A1A1A] pb-20">
      <div className="max-w-xl mx-auto pt-10 px-6">

        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[10px] font-medium text-stone-800 mb-8 hover:opacity-70 transition-opacity"
        >
          <ArrowLeft size={12} /> Back
        </button>

        {/* Title + Save */}
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <div className="w-6 h-0.5 bg-black" />
              <div className="w-6 h-0.5 bg-black" />
              <div className="w-4 h-0.5 bg-black" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Request Form</h1>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-[#FFAA14] hover:bg-amber-500 text-white text-[11px] font-black px-4 py-2 rounded-lg shadow shadow-amber-200/60 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
          >
            {saving ? (
              <Loader2 size={12} className="animate-spin" />
            ) : saved ? (
              <Check size={12} strokeWidth={3} />
            ) : null}
            {saving ? "Saving…" : saved ? "Saved" : "Save"}
          </button>
        </div>

        <p className="text-xs text-stone-500 mb-10">Manage form fields</p>

        {/* Error Display */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 text-sm text-red-700">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Error</p>
              <p className="text-red-600">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="flex-shrink-0 text-red-400 hover:text-red-600"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Empty State */}
        {fields.length === 0 && (
          <div className="text-center py-12 px-6 bg-stone-50 rounded-2xl mb-8">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus size={24} className="text-stone-400" />
            </div>
            <h3 className="text-lg font-semibold text-stone-700 mb-2">No form fields yet</h3>
            <p className="text-sm text-stone-500 mb-6">Add your first field to start building your form</p>
            <button
              onClick={() => setShowAddMenu(true)}
              className="inline-flex items-center gap-2 bg-[#FFAA14] text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-amber-500 transition-colors"
            >
              <Plus size={14} />
              Add Field
            </button>
          </div>
        )}

        {/* Fields */}
        <div className="space-y-8">
          {fields.map((field, idx) => (
            <FieldRow
              key={field._uid ?? field.id ?? idx}
              field={field}
              index={idx}
              onChange={(updated) => updateField(idx, updated)}
              onDelete={deleteField}
            />
          ))}
        </div>

        {/* Add Button */}
        {fields.length > 0 && (
          <div className="mt-10 relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-2 text-xs font-bold text-stone-800 hover:opacity-70 transition-opacity"
            >
              <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                <Plus size={12} className="text-white" />
              </div>
              Add Field
            </button>

            {showAddMenu && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setShowAddMenu(false)}
                />
                <div className="absolute bottom-10 left-0 w-56 bg-white border border-stone-100 shadow-xl rounded-lg p-1 z-30">
                  <div className="flex items-center justify-between p-2 border-b border-stone-50 mb-1">
                    <span className="text-[10px] font-bold bg-stone-800 text-white px-2 py-0.5 rounded">
                      Add Field
                    </span>
                    <X
                      size={14}
                      className="cursor-pointer text-stone-400 hover:text-stone-600"
                      onClick={() => setShowAddMenu(false)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1 p-1">
                    {FIELD_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => addField(type.value)}
                        className="flex items-center gap-1 text-[10px] font-bold text-stone-700 hover:bg-stone-50 p-2 rounded transition-colors text-left"
                      >
                        {type.label}
                        <Plus size={10} className="ml-auto text-stone-400" />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}