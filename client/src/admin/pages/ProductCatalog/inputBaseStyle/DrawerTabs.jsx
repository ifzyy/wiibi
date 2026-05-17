import React from "react";
import { COLORS, RADIUS } from "../constants";
import { fmt } from "../utils";
import { Field, SectionLabel, Toggle, StatusBadge, inputBaseStyle } from "./Primitives";
import { ImageUploadField } from "./ImageUploadField";
import { GalleryManager } from "./GalleryManager";

// ─────────────────────────────────────────────────────────────────────────────
// InfoTab — unchanged
// ─────────────────────────────────────────────────────────────────────────────
export const InfoTab = ({ form, set, onSlugBlur }) => (
  <>
    <SectionLabel title="Basic Information" />

    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Field label="Product Name" required htmlFor="field-name">
        <input
          id="field-name"
          type="text"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          onBlur={onSlugBlur}
          placeholder="e.g. 5kWh Lithium Battery"
          style={inputBaseStyle}
        />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Category" htmlFor="field-category">
          <input id="field-category" type="text" value={form.category || ""} onChange={(e) => set("category", e.target.value)} placeholder="Batteries, Inverters…" style={inputBaseStyle} />
        </Field>
        <Field label="Brand" htmlFor="field-brand">
          <input id="field-brand" type="text" value={form.brand || ""} onChange={(e) => set("brand", e.target.value)} placeholder="Luminous, Felicity…" style={inputBaseStyle} />
        </Field>
      </div>

      <Field label="URL Slug" hint="Auto-generated from name. Must be unique." htmlFor="field-slug">
        <input id="field-slug" type="text" value={form.slug || ""} onChange={(e) => set("slug", e.target.value)} placeholder="5kwh-lithium-battery" style={inputBaseStyle} />
      </Field>

      <Field label="SKU" hint="Your internal product code." htmlFor="field-sku">
        <input id="field-sku" type="text" value={form.sku || ""} onChange={(e) => set("sku", e.target.value)} placeholder="BAT-5KWH-001" style={inputBaseStyle} />
      </Field>
    </div>

    <Divider />
    <SectionLabel title="Descriptions" />

    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Field label="Short Description" hint="Shown on product cards — keep under 160 characters." htmlFor="field-short-desc">
        <textarea
          id="field-short-desc"
          rows={2}
          value={form.short_description || ""}
          onChange={(e) => set("short_description", e.target.value)}
          maxLength={500}
          placeholder="High-performance lithium battery for solar storage…"
          style={{ ...inputBaseStyle, resize: "vertical", lineHeight: 1.6 }}
        />
      </Field>

      <Field label="Full Description" htmlFor="field-desc">
        <textarea
          id="field-desc"
          rows={5}
          value={form.description || ""}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Detailed specs, features, warranty, compatibility info…"
          style={{ ...inputBaseStyle, resize: "vertical", lineHeight: 1.6 }}
        />
      </Field>
    </div>
  </>
);

// ─────────────────────────────────────────────────────────────────────────────
// PricingTab — unchanged
// ─────────────────────────────────────────────────────────────────────────────
export const PricingTab = ({ form, set }) => {
  const effectivePrice  = form.sale_price || form.price;
  const hasDiscount     = form.sale_price && Number(form.sale_price) < Number(form.price);
  const discountPercent = hasDiscount ? Math.round((1 - form.sale_price / form.price) * 100) : 0;

  return (
    <>
      <SectionLabel title="Pricing" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Regular Price (₦)" required htmlFor="field-price">
          <input id="field-price" type="number" min={0} value={form.price || ""} onChange={(e) => set("price", e.target.value)} placeholder="850000" style={inputBaseStyle} />
        </Field>
        <Field label="Sale Price (₦)" hint="Leave blank for no sale." htmlFor="field-sale-price">
          <input id="field-sale-price" type="number" min={0} value={form.sale_price || ""} onChange={(e) => set("sale_price", e.target.value || null)} placeholder="750000" style={inputBaseStyle} />
        </Field>
      </div>

      {form.price && (
        <div style={{ background: COLORS.cardBg, border: `1.5px solid ${COLORS.border}`, borderRadius: RADIUS.lg, padding: "12px 16px" }}>
          <p style={{ color: COLORS.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>
            Customer sees
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <p style={{ color: COLORS.ink, fontSize: 20, fontWeight: 800, margin: 0 }}>₦{fmt(effectivePrice)}</p>
            {hasDiscount && (
              <>
                <p style={{ color: COLORS.textMuted, fontSize: 14, textDecoration: "line-through", margin: 0 }}>₦{fmt(form.price)}</p>
                <span style={{ background: COLORS.dangerBg, color: COLORS.danger, border: `1px solid ${COLORS.dangerLight}`, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                  {discountPercent}% OFF
                </span>
              </>
            )}
          </div>
        </div>
      )}

      <Divider />
      <SectionLabel title="Stock" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Stock Quantity" htmlFor="field-stock">
          <input id="field-stock" type="number" min={0} value={form.stock ?? 0} onChange={(e) => set("stock", Number(e.target.value))} placeholder="45" style={inputBaseStyle} />
        </Field>
        <Field label="Status Override" hint="Overrides auto-detection from quantity." htmlFor="field-stock-status">
          <select
            id="field-stock-status"
            value={form.stock_status || "auto"}
            onChange={(e) => set("stock_status", e.target.value === "auto" ? null : e.target.value)}
            style={{ ...inputBaseStyle, cursor: "pointer" }}
          >
            <option value="auto">Auto (from quantity)</option>
            <option value="pre_order">Pre-Order</option>
          </select>
        </Field>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <p style={{ color: COLORS.textMuted, fontSize: 11, margin: 0 }}>Live status preview:</p>
        <StatusBadge stock={form.stock} manualStatus={form.stock_status} />
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ImagesTab
//
// CHANGED: Now works in both create and edit modes with no "save first" gate.
//
// Props:
//   form                   — product form values
//   set(key, val)          — form field setter
//   token                  — Bearer token
//   product                — existing product (null when creating)
//
//   // Featured image callbacks (from useProductMedia via ProductDrawer):
//   onFeaturedUpload(media) — called when featured image upload completes
//   onFeaturedClear()       — called when featured image is removed
//
//   // Gallery callbacks (from useProductMedia via ProductDrawer):
//   galleryItems            — [{ id, url }] current gallery list
//   onGalleryAdd(media)     — called when a gallery image upload completes
//   onGalleryRemove(id)     — called when a gallery image is removed
// ─────────────────────────────────────────────────────────────────────────────
export const ImagesTab = ({
  form,
  token,
  product,
  onFeaturedUpload,
  onFeaturedClear,
  galleryItems,
  onGalleryAdd,
  onGalleryRemove,
}) => {
  const isCreateMode = !product?.id;

  return (
    <>
      {/* ── Featured Image ── */}
      <SectionLabel title="Featured Image" />
      <div style={{ background: COLORS.cardBg, border: `1.5px solid ${COLORS.border}`, borderRadius: RADIUS.lg, padding: 14 }}>
        <p style={{ color: COLORS.textSec, fontSize: 12, margin: "0 0 12px", lineHeight: 1.5 }}>
          The <strong>featured image</strong> is the main product photo shown in listings.
          {isCreateMode && (
            <span style={{ color: COLORS.textMuted }}> It will be linked to the product when you click Create Product.</span>
          )}
        </p>
        <ImageUploadField
          token={token}
          currentImageUrl={form.featured_image_url}
          role="main"
          // Pass entityId only in edit mode — in create mode uploads go unattached
          entityId={product?.id || null}
          onUploadComplete={onFeaturedUpload}
          onClear={onFeaturedClear}
        />
      </div>

      <Divider />

      {/* ── Gallery Images ── */}
      <SectionLabel title="Gallery Images" />
      <div style={{
        background: COLORS.cardBg,
        border: `1.5px dashed ${COLORS.borderMid}`,
        borderRadius: RADIUS.lg,
        padding: 14,
      }}>
        <p style={{ color: COLORS.textSec, fontSize: 12, margin: "0 0 12px", lineHeight: 1.5 }}>
          <strong>Gallery images</strong> appear in the product detail page carousel.
          {isCreateMode && (
            <span style={{ color: COLORS.textMuted }}> Images uploaded here will be staged and linked when you save.</span>
          )}
        </p>

        {/* Gallery works immediately in BOTH modes — no blocking gate */}
        <GalleryManager
          token={token}
          entityId={product?.id || null}  // null in create mode → staged upload
          items={galleryItems}
          onAdd={onGalleryAdd}
          onRemove={onGalleryRemove}
        />
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SettingsTab — unchanged
// ─────────────────────────────────────────────────────────────────────────────
export const SettingsTab = ({ form, set }) => (
  <>
    <SectionLabel title="Visibility & Flags" />
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Toggle
        id="toggle-visible"
        checked={!!form.is_visible}
        onChange={(e) => set("is_visible", e.target.checked)}
        label="Visible in store"
        desc="Customers can browse and purchase this product"
      />
      <Toggle
        id="toggle-featured"
        checked={!!form.is_featured}
        onChange={(e) => set("is_featured", e.target.checked)}
        label="Featured product"
        desc="Appears in homepage carousel and featured sections"
      />
    </div>
  </>
);

// ─────────────────────────────────────────────────────────────────────────────
// Shared divider
// ─────────────────────────────────────────────────────────────────────────────
const Divider = () => <div style={{ height: 1, background: COLORS.surface }} />;