// =============================================================================
// DrawerTabs.jsx
//
// The four step panels rendered inside ProductDrawer's right column.
//
//   GeneralTab    — listing type, name, price, SKU, tags, captions, units, warranty
//   DescriptionTab — free-text product description
//   SpecsTab       — system specs paired with marketing images (both listing types)
//   ComponentsTab  — component list (Package only)
//
// ⚠️  NO API calls are made in this file.
//     Files selected in SpecsTab are stored locally as { file, preview } in
//     form.marketing_images[]. Upload happens in useProductSubmit.handleSubmit.
// =============================================================================

import React, { useState, useEffect, useRef } from "react";
import {
  C, R, inputBase,
  FieldLabel, StepHeader, Divider, Stepper, Toggle,
  UploadZone, FileRow, AddButton, TagChip, SelectField,
  ALL_TAGS, MAX_TAGS, MAX_SPECS,
} from "./drawerConstants";


// ─────────────────────────────────────────────────────────────────────────────
// PricePreview
// Shown beneath a price input once the user starts typing.
// Shows formatted price and, for sale price, the discount % off original.
// ─────────────────────────────────────────────────────────────────────────────
const PricePreview = ({ value, originalPrice }) => {
  const formatted = Number(value).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const discount =
    originalPrice &&
    !isNaN(originalPrice) &&
    Number(originalPrice) > 0 &&
    Number(value) < Number(originalPrice)
      ? Math.round((1 - Number(value) / Number(originalPrice)) * 100)
      : null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      marginTop: 5, padding: "4px 8px",
      background: C.amberLight,
      border: `1px solid ${C.amberBorder}`,
      borderRadius: 6,
      width: "fit-content",
      maxWidth: "100%",
    }}>
      {/* Eye icon */}
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
        stroke={C.amberText} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>

      <span style={{ fontSize: 11, fontWeight: 700, color: C.amberText, letterSpacing: "0.01em" }}>
        ₦{formatted}
      </span>

      {discount !== null && (
        <span style={{
          fontSize: 10, fontWeight: 800,
          color: "#1A7F3C",
          background: "#EBF7F0",
          border: "1px solid #B6E6C8",
          borderRadius: 20,
          padding: "1px 7px",
          letterSpacing: "0.02em",
        }}>
          {discount}% off
        </span>
      )}
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────────
// SolarMatchingSection — tags a product for the solar calculator.
// Maps to products.solar_component_type + products.solar_specs.
// The spec inputs change with the chosen component type; specs reset when the
// type changes because each type stores a different shape.
// ─────────────────────────────────────────────────────────────────────────────
const SOLAR_TYPE_OPTIONS = [
  { label: "None",              value: ""                  },
  { label: "Inverter",          value: "inverter"          },
  { label: "Battery",           value: "battery"           },
  { label: "Solar Panel",       value: "solar-panel"       },
  { label: "Charge Controller", value: "charge-controller" },
];
const SOLAR_CHEMISTRIES = ["lithium", "tubular", "dry-cell"];

const SolarMatchingSection = ({ form, set }) => {
  const type  = form.solar_component_type || "";
  const specs = form.solar_specs || {};

  const setSpec = (key, val) => set("solar_specs", { ...specs, [key]: val });
  const setType = (label) => {
    const next = SOLAR_TYPE_OPTIONS.find(o => o.label === label)?.value ?? "";
    set("solar_component_type", next);
    set("solar_specs", next === "battery" ? { chemistry: "lithium" } : {});
  };

  const currentLabel = SOLAR_TYPE_OPTIONS.find(o => o.value === type)?.label ?? "None";

  const numberField = (label, key, placeholder) => (
    <div>
      <FieldLabel required>{label}</FieldLabel>
      <input
        type="number" min="0" step="any"
        value={specs[key] ?? ""}
        onChange={(e) => setSpec(key, e.target.value)}
        placeholder={placeholder}
        style={inputBase}
      />
    </div>
  );

  return (
    <div>
      <FieldLabel hint="tagged products appear in solar calculator results">Solar Matching</FieldLabel>
      <SelectField
        value={currentLabel}
        onChange={setType}
        options={SOLAR_TYPE_OPTIONS.map(o => o.label)}
      />

      {type === "inverter" && (
        <div style={{ marginTop: 10 }}>
          {numberField("Capacity (kVA)", "kva", "e.g. 5")}
        </div>
      )}

      {type === "battery" && (
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {numberField("Capacity (Ah)", "ah", "e.g. 200")}
          <div>
            <FieldLabel required>Chemistry</FieldLabel>
            <SelectField
              value={specs.chemistry ?? "lithium"}
              onChange={(v) => setSpec("chemistry", v)}
              options={SOLAR_CHEMISTRIES}
            />
          </div>
        </div>
      )}

      {type === "solar-panel" && (
        <div style={{ marginTop: 10 }}>
          {numberField("Output (Watts)", "watts", "e.g. 400")}
        </div>
      )}

      {type === "charge-controller" && (
        <div style={{ marginTop: 10 }}>
          {numberField("Rating (Amps)", "ampere", "e.g. 60")}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 1.  GENERAL TAB
// ─────────────────────────────────────────────────────────────────────────────
export const GeneralTab = ({ form, set, totalSteps }) => {
  const [tagOpen, setTagOpen] = useState(false);
  const dropRef = useRef();

  useEffect(() => {
    const fn = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setTagOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const addTag    = (t) => { if (form.tags.includes(t) || form.tags.length >= MAX_TAGS) return; set("tags", [...form.tags, t]); if (form.tags.length + 1 >= MAX_TAGS) setTagOpen(false); };
  const removeTag = (t) => set("tags", form.tags.filter(x => x !== t));
  const generateSKU = () => set("sku", `WII-${Math.random().toString(36).slice(2, 9).toUpperCase()}`);

  return (
    <div className="" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <StepHeader label="General" step={1} total={totalSteps} />

      {/* Listing type */}
      <div>
        <FieldLabel>Listing Type</FieldLabel>
        <SelectField value={form.listing_type} onChange={(v) => set("listing_type", v)} options={["Single", "Package"]} />
      </div>

      {/* Name */}
      <div>
        <FieldLabel required>Product name or title</FieldLabel>
        <input  type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Lithium Battery 5kWh" style={inputBase} />
      </div>

      {/* Category + Brand */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <FieldLabel required>Category</FieldLabel>
          <input type="text" value={form.category} onChange={(e) => set("category", e.target.value)}
            placeholder="e.g. Batteries" style={inputBase} />
        </div>
        <div>
          <FieldLabel>Brand</FieldLabel>
          <input type="text" value={form.brand} onChange={(e) => set("brand", e.target.value)}
            placeholder="e.g. Wiibi Premium" style={inputBase} />
        </div>
      </div>

{/* Price + Sale Price */}
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
  <div>
    <FieldLabel required>Price</FieldLabel>
    <div style={{ position: "relative" }}>
      <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 800, color: C.muted, pointerEvents: "none" }}>₦</span>
      <input
        type="number" value={form.price}
        onChange={(e) => set("price", e.target.value)}
        placeholder="0.00"
        style={{ ...inputBase, paddingLeft: 26 }}
      />
    </div>
    {form.price && !isNaN(form.price) && Number(form.price) > 0 && (
      <PricePreview value={form.price} />
    )}
  </div>

  <div>
    <FieldLabel>Sale Price</FieldLabel>
    <div style={{ position: "relative" }}>
      <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 800, color: C.muted, pointerEvents: "none" }}>₦</span>
      <input
        type="number" value={form.sale_price}
        onChange={(e) => set("sale_price", e.target.value)}
        placeholder="Optional"
        style={{ ...inputBase, paddingLeft: 26 }}
      />
    </div>
    {form.sale_price && !isNaN(form.sale_price) && Number(form.sale_price) > 0 && (
      <PricePreview
        value={form.sale_price}
        originalPrice={form.price}
      />
    )}
  </div>
</div>

      {/* SKU + Stock */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
            <FieldLabel>SKU</FieldLabel>
            <button type="button" onClick={generateSKU}
              style={{ fontSize: 11, fontWeight: 700, color: C.amber, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              Generate
            </button>
          </div>
          <input type="text" value={form.sku} onChange={(e) => set("sku", e.target.value)}
            placeholder="e.g. BAT-LI-5K-001" style={inputBase} />
        </div>
        <div>
          <FieldLabel>Stock</FieldLabel>
          <input type="number" value={form.stock} onChange={(e) => set("stock", e.target.value)}
            placeholder="0" min="0" style={inputBase} />
        </div>
      </div>

      {/* Delivery fee override */}
      <div>
        <FieldLabel hint="leave empty to use the default fee from Settings">
          Delivery Fee (₦)
        </FieldLabel>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 800, color: C.muted, pointerEvents: "none" }}>₦</span>
          <input
            type="number" min="0" step="any"
            value={form.delivery_fee}
            onChange={(e) => set("delivery_fee", e.target.value)}
            placeholder="Default"
            style={{ ...inputBase, paddingLeft: 26 }}
          />
        </div>
        <p style={{ margin: "5px 0 0", fontSize: 10, color: C.muted, lineHeight: 1.5 }}>
          For bulky items (inverters, batteries). Orders are charged the highest
          delivery fee among the items in the cart.
        </p>
      </div>

 

      <Divider gap={4} />

      {/* Tags */}
      <div>
        <p style={{ margin: "0 0 7px", fontSize: 11, color: C.secondary, fontWeight: 600 }}>
          Tags <span style={{ fontWeight: 400, color: C.muted }}>— max two tags.</span>
        </p>

        {form.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
            {form.tags.map(t => <TagChip key={t} label={t} onRemove={() => removeTag(t)} />)}
          </div>
        )}

        {form.tags.length < MAX_TAGS && (
          <div style={{ position: "relative" }} ref={dropRef}>
            <AddButton onClick={() => setTagOpen(o => !o)} small />
            {tagOpen && (
              <div style={{
                position: "absolute", top: 32, left: 0, zIndex: 200,
                background: C.white, border: `1.5px solid ${C.border}`,
                borderRadius: R.xl, padding: 14,
                boxShadow: "0 12px 40px rgba(24,20,12,0.12)", width: 290,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.secondary, textTransform: "uppercase", letterSpacing: "0.07em" }}>Choose Tags</span>
                  <button type="button" onClick={() => setTagOpen(false)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.muted, lineHeight: 1 }}>×</button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ALL_TAGS.map(t => {
                    const on = form.tags.includes(t);
                    return (
                      <button key={t} type="button" onClick={() => addTag(t)}
                        style={{ padding: "4px 11px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: on ? "default" : "pointer", background: on ? C.amberLight : C.surface, border: `1.5px solid ${on ? C.amberBorder : C.border}`, color: on ? C.amberText : C.secondary, display: "flex", alignItems: "center", gap: 4 }}>
                        {t} <span style={{ fontSize: 13, opacity: 0.5 }}>{on ? "−" : "+"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Divider gap={4} />

      {/* Visibility + Featured toggles */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Toggle
          checked={form.is_visible}
          onChange={(v) => set("is_visible", v)}
          label="Visible"
          desc="Product appears in the store"
        />
        <Toggle
          checked={form.is_featured}
          onChange={(v) => set("is_featured", v)}
          label="Featured"
          desc="Highlighted on homepage and category pages"
        />
      </div>

      <Divider gap={4} />

      {/* Solar calculator matching */}
      <SolarMatchingSection form={form} set={set} />

      <Divider gap={4} />

      {/* Warranty */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <FieldLabel>Warranty</FieldLabel>
          <Toggle checked={form.warranty_enabled} onChange={(v) => set("warranty_enabled", v)} />
        </div>
        {form.warranty_enabled && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Stepper value={form.warranty} onChange={(v) => set("warranty", v)} />
            <span style={{ fontSize: 12, color: C.muted }}>
              year{form.warranty !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// useAutoResize — expands a textarea to fit its content
// ─────────────────────────────────────────────────────────────────────────────
const useAutoResize = (value) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);
  return ref;
};

// ─────────────────────────────────────────────────────────────────────────────
// 2.  DESCRIPTION TAB
// ─────────────────────────────────────────────────────────────────────────────
// Remove from GeneralTab — delete the short_description and caption <div> blocks

// Replace DescriptionTab entirely:
export const ContentTab = ({ form, set, totalSteps }) => {
  const captionRef     = useAutoResize(form.caption);
  const shortDescRef   = useAutoResize(form.short_description);
  const descriptionRef = useAutoResize(form.description);

  const autoTextarea = {
    ...inputBase,
    resize: "none",
    overflow: "hidden",
    lineHeight: 1.65,
    minHeight: 38,   // same visual height as a single-line input
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <StepHeader label="Content" step={2} total={totalSteps} />

      <div>
        <FieldLabel hint="marketing line beneath product name">Caption</FieldLabel>
        <textarea
          ref={captionRef}
          value={form.caption}
          onChange={(e) => set("caption", e.target.value)}
          placeholder="e.g. Built for daily solar cycling. 3000+ charge cycles guaranteed."
          maxLength={255}
          rows={1}
          style={autoTextarea}
        />
      </div>

      <div>
        <FieldLabel hint="shown on listing cards, max 500 chars">Short Description</FieldLabel>
        <textarea
          ref={shortDescRef}
          value={form.short_description}
          onChange={(e) => set("short_description", e.target.value)}
          placeholder="e.g. 5kWh lithium battery – reliable power backup"
          maxLength={500}
          rows={1}
          style={autoTextarea}
        />
      </div>

      <Divider gap={4} />

      <div>
        <FieldLabel>About Product</FieldLabel>
        <textarea
          ref={descriptionRef}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Summary information about the product — features, compatibility, warranty info…"
          rows={5}
          style={{ ...autoTextarea, minHeight: 120 }}
        />
        <p style={{ margin: "5px 0 0", fontSize: 10, color: C.muted, textAlign: "right" }}>
          {form.description.length} characters
        </p>
      </div>
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────────
// 3.  SPECS TAB
//
// Two-column layout: left = spec title/info, right = paired marketing image.
//
// Marketing images are stored locally as { file: File, preview: string } at
// form.marketing_images[i] — indexed to match form.specs[i].
//
// ⚠️  No upload here. Files go to useProductSubmit → STEP 3.
// ─────────────────────────────────────────────────────────────────────────────
export const SpecsTab = ({ form, set, totalSteps }) => {
  // ── Spec helpers ──────────────────────────────────────────────────────
  const addSpec    = () => { if (form.specs.length >= MAX_SPECS) return; set("specs", [...form.specs, { title: "", info: "" }]); };
  const removeSpec = (i) => {
    set("specs",            form.specs.filter((_, j) => j !== i));
    set("marketing_images", form.marketing_images.filter((_, j) => j !== i));
  };
  const updateSpec = (i, key, val) => {
    const a = [...form.specs]; a[i] = { ...a[i], [key]: val }; set("specs", a);
  };

  // ── Marketing image helpers (local staging only) ───────────────────────
  const setMarketingImage = (i, file) => {
    const updated = [...form.marketing_images];
    if (updated[i]?.preview) URL.revokeObjectURL(updated[i].preview);
    updated[i] = { file, preview: URL.createObjectURL(file) };
    set("marketing_images", updated);
  };
  const removeMarketingImage = (i) => {
    const updated = [...form.marketing_images];
    if (updated[i]?.preview) URL.revokeObjectURL(updated[i].preview);
    updated[i] = null;
    set("marketing_images", updated);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <StepHeader label="System Specification" step={3} total={totalSteps} />

      {/* Column headers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <FieldLabel>System Specifications</FieldLabel>
          <span style={{ fontSize: 10, color: C.muted }}>{form.specs.length}/{MAX_SPECS}</span>
        </div>
        <FieldLabel>Marketing Images</FieldLabel>
      </div>

      {/* Spec rows */}
      {form.specs.map((spec, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" }}>

          {/* Left — spec fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.secondary }}>Spec {i + 1}.</span>
              {form.specs.length > 1 && (
                <button type="button" onClick={() => removeSpec(i)}
                  style={{ fontSize: 10, fontWeight: 700, color: C.danger, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  Remove
                </button>
              )}
            </div>
            <input type="text" value={spec.title} onChange={(e) => updateSpec(i, "title", e.target.value)}
              placeholder="Spec. Title" style={inputBase} />
            <input type="text" value={spec.info}  onChange={(e) => updateSpec(i, "info",  e.target.value)}
              placeholder="Spec. Info"  style={inputBase} />
          </div>

          {/* Right — paired marketing image (locally staged, no upload yet) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.secondary }}>Image {i + 1}.</span>
            {form.marketing_images[i] ? (
              <FileRow
                file={form.marketing_images[i].file}
                preview={form.marketing_images[i].preview}
                onRemove={() => removeMarketingImage(i)}
              />
            ) : (
              <UploadZone compact onFiles={(files) => setMarketingImage(i, files[0])} />
            )}
          </div>
        </div>
      ))}

      {/* Add spec row */}
      {form.specs.length < MAX_SPECS && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <button type="button" onClick={addSpec}
            style={{ padding: "10px", background: C.amber, border: "none", borderRadius: R.md, cursor: "pointer", fontSize: 20, fontWeight: 700, color: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
            +
          </button>
          <div /> {/* keep grid aligned */}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 4.  COMPONENTS TAB  (Package listing type only)
// ─────────────────────────────────────────────────────────────────────────────
const style = {
  container: {
    padding: "24px",
    background: "#fff"
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px"
  },
  title: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#1a1a1a",
    margin: 0
  },
  addButton: {
    background: "#f9b233",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 18px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  grid: {
    display: "grid", 
    gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", 
    gap: "32px",
    alignItems: "start"
  },
  card: {
    background: "#fff",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  badge: {
    background: "#555",
    color: "#fff",
    padding: "4px 10px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "500",
    width: "fit-content"
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#44413c",
    marginBottom: "10px",
    display: "block"
  },
  input: {
    width: "100%",
    padding: "14px",
    background: "#f9f9fb",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none"
  },
  textarea: {
    width: "100%",
    padding: "14px",
    background: "#f9f9fb",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#333",
    minHeight: "120px",
    resize: "none",
    outline: "none",
    lineHeight: "1.5"
  }
};

export const ComponentsTab = ({ form, set }) => {
  const add = () => set("components", [...form.components, { name: "", quantity: 1, brand: "", price: "", description: "", image: null, specs: [{ title: "", info: "" }] }]);
  
  const update = (i, key, val) => {
    const a = [...form.components];
    a[i] = { ...a[i], [key]: val };
    set("components", a);
  };

  const addComponentSpec = (componentIndex) => {
    const updated = [...form.components];
    const component = { ...updated[componentIndex] };
    const specs = Array.isArray(component.specs) ? [...component.specs] : [];
    specs.push({ title: "", info: "" });
    updated[componentIndex] = { ...component, specs };
    set("components", updated);
  };

  const removeComponentSpec = (componentIndex, specIndex) => {
    const updated = [...form.components];
    const component = { ...updated[componentIndex] };
    const specs = (component.specs || []).filter((_, j) => j !== specIndex);
    updated[componentIndex] = { ...component, specs };
    set("components", updated);
  };

  const updateComponentSpec = (componentIndex, specIndex, key, value) => {
    const updated = [...form.components];
    const component = { ...updated[componentIndex] };
    const specs = Array.isArray(component.specs) ? [...component.specs] : [];
    specs[specIndex] = { ...specs[specIndex], [key]: value };
    updated[componentIndex] = { ...component, specs };
    set("components", updated);
  };

  return (
    <div style={style.container}>
      <div style={style.headerRow}>
        <h2 style={style.title}>Components</h2>
        <button type="button" onClick={add} style={style.addButton}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Component
        </button>
      </div>
      
      <div style={style.grid}>
        {form.components.map((comp, i) => (
          <div key={i} style={style.card}>
            <div style={style.badge}>Compnent {i + 1}</div>

            <div style={{ display: "flex", gap: "20px", alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <label style={style.label}>Name</label>
                <input 
                  style={style.input} 
                  value={comp.name} 
                  onChange={(e) => update(i, "name", e.target.value)} 
                />
              </div>
              <div style={{ width: "130px" }}>
                <label style={style.label}>Units</label>
                {/* Your Stepper Component here */}
                <Stepper 
                  value={comp.quantity} 
                  onChange={(v) => update(i, "quantity", v)} 
                />
              </div>
            </div>

            <div>
              <label style={style.label}>Component Image</label>
              <UploadZone 
                onFiles={(files) => update(i, "image", files[0])} 
              />
            </div>

            <div>
              <label style={style.label}>About Component</label>
              <textarea 
                style={style.textarea}
                placeholder="Summary information about the product"
                value={comp.description}
                onChange={(e) => update(i, "description", e.target.value)}
              />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={style.label}>Component Specs</span>
                <button
                  type="button"
                  onClick={() => addComponentSpec(i)}
                  style={{
                    background: "none",
                    border: "1px solid #D8C2A0",
                    borderRadius: 8,
                    color: C.ink,
                    padding: "8px 12px",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Add spec
                </button>
              </div>

              {(Array.isArray(comp.specs) ? comp.specs : []).map((spec, j) => (
                <div key={j} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, marginBottom: 10, alignItems: "flex-end" }}>
                  <input
                    style={style.input}
                    value={spec.title || ""}
                    onChange={(e) => updateComponentSpec(i, j, "title", e.target.value)}
                    placeholder="Spec name"
                  />
                  <input
                    style={style.input}
                    value={spec.info || ""}
                    onChange={(e) => updateComponentSpec(i, j, "info", e.target.value)}
                    placeholder="Spec value"
                  />
                  <button
                    type="button"
                    onClick={() => removeComponentSpec(i, j)}
                    style={{
                      background: "none",
                      border: "none",
                      color: C.danger,
                      cursor: "pointer",
                      fontSize: 18,
                      lineHeight: 1,
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #eee", marginTop: "10px" }} />
          </div>
        ))}
      </div>
    </div>
  );
};// =============================================================================
// CompatibilityTab.jsx
//
// Step 5 — Package listing type only.
//
// Maps to: products.powered_devices  (JSON column)
// Shape saved:  [{ label: "Tv", icon: "tv" }, { label: "Fan", icon: "fan" }, ...]
//
// UI: simple two-column icon+label grid with amber toggle checkboxes.
// Matches the "Compatibility" widget shown on the product detail page.
// =============================================================================


// ─── Device catalogue ─────────────────────────────────────────────────────────
const ALL_DEVICES = [
  { label: "Tv",              icon: "tv"          },
  { label: "Fan",             icon: "fan"         },
  { label: "Light",           icon: "light"       },
  { label: "Air Condition",   icon: "ac"          },
  { label: "Gadgets",         icon: "gadgets"     },
  { label: "Smart Pump",      icon: "smart-pump"  },
  { label: "Fridge",          icon: "fridge"      },
  { label: "Washing Machine", icon: "washer"      },
  { label: "Microwave",       icon: "microwave"   },
  { label: "Router",          icon: "router"      },
  { label: "CCTV",            icon: "cctv"        },
  { label: "Water Pump",      icon: "water-pump"  },
];

// ─── SVG icons ────────────────────────────────────────────────────────────────
const DeviceIcon = ({ icon }) => {
  const s = {
    width: 22, height: 22, fill: "none",
    stroke: "currentColor", strokeWidth: 1.8,
    strokeLinecap: "round", strokeLinejoin: "round",
  };
  switch (icon) {
    case "tv":
      return <svg {...s} viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
    case "fan":
      return <svg {...s} viewBox="0 0 24 24"><path d="M12 12c1-2 3.5-3 5-1.5s.5 4-1.5 5"/><path d="M12 12c-2-1-3-3.5-1.5-5s4-.5 5 1.5"/><path d="M12 12c-1 2-3.5 3-5 1.5S6.5 9 8.5 8"/><path d="M12 12c2 1 3 3.5 1.5 5s-4 .5-5-1.5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>;
    case "light":
      return <svg {...s} viewBox="0 0 24 24"><line x1="12" y1="2" x2="12" y2="4"/><path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 4a6 6 0 0 1 6 6c0 2.5-1.5 4.5-3 6H9c-1.5-1.5-3-3.5-3-6a6 6 0 0 1 6-6z"/></svg>;
    case "ac":
      return <svg {...s} viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="9" rx="2"/><path d="M7 19l2-5"/><path d="M12 19v-5"/><path d="M17 19l-2-5"/><line x1="6" y1="9" x2="18" y2="9"/></svg>;
    case "gadgets":
      return <svg {...s} viewBox="0 0 24 24"><rect x="2" y="3" width="13" height="10" rx="1"/><path d="M8 21v-4"/><path d="M5 21h6"/><rect x="16" y="13" width="6" height="8" rx="1"/><path d="M19 13V8a2 2 0 0 0-2-2h-2"/></svg>;
    case "smart-pump":
      return <svg {...s} viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>;
    case "fridge":
      return <svg {...s} viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="5" y1="10" x2="19" y2="10"/><line x1="9" y1="6" x2="9" y2="8"/><line x1="9" y1="14" x2="9" y2="18"/></svg>;
    case "washer":
      return <svg {...s} viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="12" cy="13" r="4"/><circle cx="8" cy="6" r="1" fill="currentColor" stroke="none"/><line x1="12" y1="7" x2="12" y2="4"/></svg>;
    case "microwave":
      return <svg {...s} viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><rect x="5" y="8" width="11" height="8" rx="1"/><circle cx="20" cy="12" r="1" fill="currentColor" stroke="none"/></svg>;
    case "router":
      return <svg {...s} viewBox="0 0 24 24"><rect x="2" y="14" width="20" height="6" rx="2"/><line x1="6" y1="14" x2="6" y2="11"/><line x1="12" y1="14" x2="12" y2="8"/><line x1="18" y1="14" x2="18" y2="11"/><path d="M9 8a5 5 0 0 1 6 0"/><path d="M6.5 5.5a9 9 0 0 1 11 0"/></svg>;
    case "cctv":
      return <svg {...s} viewBox="0 0 24 24"><path d="M14.5 7l5 3-5 3V7z"/><rect x="2" y="8" width="12" height="8" rx="2"/><line x1="7" y1="20" x2="7" y2="16"/><line x1="4" y1="20" x2="10" y2="20"/></svg>;
    case "water-pump":
      return <svg {...s} viewBox="0 0 24 24"><rect x="3" y="11" width="10" height="8" rx="1"/><path d="M13 15h4a2 2 0 0 0 0-4h-4"/><path d="M8 11V7"/><path d="M5 7h6"/><circle cx="8" cy="5" r="2"/></svg>;
    default:
      return <svg {...s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg>;
  }
};

// ─── Amber checkbox ───────────────────────────────────────────────────────────
const AmberCheck = ({ checked }) => (
  <div style={{
    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
    background: checked ? C.amber : C.white,
    border: `1.5px solid ${checked ? C.amber : C.border}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.15s",
  }}>
    {checked && (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
        stroke={C.ink} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// CompatibilityTab
// ─────────────────────────────────────────────────────────────────────────────
export const CompatibilityTab = ({ form, set, totalSteps }) => {
  const selected = Array.isArray(form.powered_devices) ? form.powered_devices : [];
  console.log(form);
console.log(selected)
  const isSelected = (icon) => selected.some(d => d.icon === icon);

  const toggle = (device) => {
    if (isSelected(device.icon)) {
      set("powered_devices", selected.filter(d => d.icon !== device.icon));
    } else {
      set("powered_devices", [...selected, { label: device.label, icon: device.icon }]);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <StepHeader label="Compatibility" step={5} total={totalSteps} />

      <p style={{ margin: 0, fontSize: 12, color: C.muted, lineHeight: 1.65 }}>
        Select the appliances this package can power. These appear on the product page to help customers confirm the package suits their needs.
      </p>

      {/* Two-column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        {ALL_DEVICES.map((device, i) => {
          const active = isSelected(device.icon);
          const isLastRow = i >= ALL_DEVICES.length - (ALL_DEVICES.length % 2 === 0 ? 2 : 1);
          return (
            <button
              key={device.icon}
              type="button"
              onClick={() => toggle(device)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "13px 14px",
                background: "transparent",
                border: "none",
                borderBottom: isLastRow ? "none" : `1px solid ${C.border}`,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ color: C.secondary, flexShrink: 0, display: "flex" }}>
                <DeviceIcon icon={device.icon} />
              </span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: C.ink }}>
                {device.label}
              </span>
              <AmberCheck checked={active} />
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <p style={{ margin: 0, fontSize: 11, color: C.muted }}>
          {selected.length} device{selected.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
};