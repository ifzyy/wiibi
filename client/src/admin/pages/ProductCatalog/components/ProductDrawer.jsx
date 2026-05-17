// =============================================================================
// ProductDrawer.jsx
//
// Main drawer shell.
//
// ─── Image slot shape ─────────────────────────────────────────────────────────
// Every entry in form.main_image / form.other_images[] is ONE of:
//
//   null
//   { type: "staged",   file: File, preview: string }   ← new, not yet uploaded
//   { type: "existing", url: string, mediaId: string }  ← already on server
//
// This typing is what lets useProductSubmit know whether to upload a file
// or simply preserve its server URL in the product payload.
//
// ─── Edit-mode hydration ──────────────────────────────────────────────────────
// When the drawer opens with an existing product, useProductForm maps:
//   product.featured_image_url → form.main_image  { type:"existing", url, mediaId:null }
//   product.images[]           → form.other_images [{ type:"existing", url, mediaId }]
//
// So the image panel always renders current images in edit mode.
// =============================================================================

import React, { useState, useEffect, useCallback } from "react";
import {
  C,
  R,
  BLANK_FORM,
  STEPS_SINGLE,
  STEPS_PACKAGE,
  MAX_IMAGES,
  UploadZone,
  FileRow,
} from "./drawerConstants";
import {
  GeneralTab,
  ContentTab,
  SpecsTab,
  ComponentsTab,
  CompatibilityTab,
} from "./DrawerTabs";
import { useProductSubmit } from "../hooks/useProductSubmit";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — build typed image slots from a server product object
// ─────────────────────────────────────────────────────────────────────────────

/** Map product.featured_image_url → main_image slot */
const hydrateMainImage = (product) => {
  if (!product?.featured_image_url) return null;
  return {
    type: "existing",
    url: product.featured_image_url,
    mediaId: null, // featured_image_url is a plain URL; we don't have a mediaId here
  };
};

/**
 * Map product.images[] → other_images slots.
 * product.images comes from formatters.product() as:
 *   [{ url, caption, role }]  — the main image is included at index 0 with role:"main"
 * We skip role:"main" here since it's already in main_image.
 */
const hydrateOtherImages = (product) => {
  if (!product?.images?.length) return [];
  return product.images
    .filter((img) => img.role !== "main" && img.url)
    .map((img) => ({
      type: "existing",
      url: img.url,
      mediaId: img.mediaId ?? null,
    }));
};

const parsePoweredDevices = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

// =============================================================================
// useProductForm
// =============================================================================
const useProductForm = (product, isOpen) => {
  const [form, setForm] = useState(BLANK_FORM);

  useEffect(() => {
    if (!isOpen) return;

    if (product) {
      // Edit mode — map every DB column back to its form field
      setForm({
        ...BLANK_FORM,

        // ── Core ──────────────────────────────────────────────────────
        listing_type: product.listing_type === "package" ? "Package" : "Single",
        name: product.name || "",
        category: product.category || "",
        brand: product.brand || "",
        sku: product.sku || "",

        // ── Pricing & stock ───────────────────────────────────────────
        price: product.price || "",
        sale_price: product.sale_price || "",
        stock: product.stock ?? 0,

        // ── Flags ─────────────────────────────────────────────────────
        is_visible: product.is_visible ?? true,
        is_featured: product.is_featured ?? false,

        // ── Content ───────────────────────────────────────────────────
        short_description: product.short_description || "",
        caption: product.caption || "",
        description: product.description || "",

        // ── Taxonomy / warranty ───────────────────────────────────────
        tags: product.tags || [],
        powered_devices: parsePoweredDevices(product.powered_devices ?? product.poweredDevices),
        warranty_enabled: !!(product.warranty_duration ?? product.warrantyDuration),
        // "2 years" → 2, "1 year" → 1, fallback 1
        warranty: parseInt(product.warranty_duration ?? product.warrantyDuration) || 1,

        // ── Specs: DB stores [{label, value}], form uses [{title, info}]
        specs: Array.isArray(product.specifications) && product.specifications.length > 0
          ? product.specifications.map((s) => ({
              title: s.label || "",
              info: s.value || "",
            }))
          : [{ title: "", info: "" }],

        // ── Package components ─────────────────────────────────────────
        components: Array.isArray(product.components) && product.components.length > 0
          ? product.components.map((c) => ({
              name:        c.name || "",
              quantity:    c.qty ?? 1,
              brand:       c.brand || "",
              price:       c.price || "",
              image:       c.image || null,
              description: c.description || "",
              specs:       Array.isArray(c.specs) && c.specs.length > 0
                            ? c.specs.map((s) => ({ title: s.label || "", info: s.value || "" }))
                            : [],
            }))
          : [{ name: "", quantity: 1, brand: "", price: "", description: "", image: null, specs: [{ title: "", info: "" }] }],
        compatibility: product.compatibility?.length
          ? product.compatibility
          : [],
        // ── Image slots ───────────────────────────────────────────────
        main_image: hydrateMainImage(product),
        other_images: hydrateOtherImages(product),
        marketing_images: [], // not returned by API yet — start blank
      });
    } else {
      // Create mode: completely blank
      setForm({ ...BLANK_FORM });
    }
  }, [isOpen, product]);

  const set = useCallback(
    (key, val) => setForm((f) => ({ ...f, [key]: val })),
    [],
  );

  return { form, set };
};
import { CircleAlert } from "lucide-react";
// =============================================================================
// ImagePanel
//
// Left column — always visible across all steps.
//
// Renders both "existing" (server URL thumbnail) and "staged" (blob preview)
// slots using the same FileRow component.
// New files get type:"staged". Removed existing images just disappear from
// the list — the server handles cleanup separately.
// =============================================================================
const ImagePanel = ({ form, set }) => {
  const otherCount = form.other_images.length;
  const totalShown = (form.main_image ? 1 : 0) + otherCount;
  const canAddOther = otherCount < MAX_IMAGES - 1;

  // Stage a new main image (replaces whatever was there)
  const handleMain = (files) => {
    // Revoke old blob URL if it was staged (don't revoke server URLs)
    if (form.main_image?.type === "staged")
      URL.revokeObjectURL(form.main_image.preview);
    set("main_image", {
      type: "staged",
      file: files[0],
      preview: URL.createObjectURL(files[0]),
    });
  };

  // Stage new other/gallery images
  const handleOther = (files) => {
    const slots = MAX_IMAGES - 1 - otherCount;
    const toAdd = files.slice(0, slots).map((f) => ({
      type: "staged",
      file: f,
      preview: URL.createObjectURL(f),
    }));
    set("other_images", [...form.other_images, ...toAdd]);
  };

  const removeMain = () => {
    if (form.main_image?.type === "staged")
      URL.revokeObjectURL(form.main_image.preview);
    set("main_image", null);
  };

  const removeOther = (i) => {
    const img = form.other_images[i];
    if (img?.type === "staged") URL.revokeObjectURL(img.preview);
    set(
      "other_images",
      form.other_images.filter((_, j) => j !== i),
    );
  };

  // Resolve the display URL for a slot — blob URL for staged, server URL for existing
  const slotUrl = (slot) =>
    slot?.type === "staged" ? slot.preview : (slot?.url ?? null);

  // Fake File-like object for display in FileRow when it's an existing image
  const slotFile = (slot) =>
    slot?.type === "staged"
      ? slot.file
      : { name: slot?.url?.split("/").pop() ?? "image", size: null };

  return (
    <aside
      style={{
        width: 305,
        flexShrink: 0,
        borderRight: `1px solid ${C.border}`,
        background: C.white,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div className="p-2">
        <p
          className="px-4 py-2"
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 800,
            color: C.ink,
            background: C.secondaryBackground,
          }}
        >
          Product Images
        </p>
      </div>

      {/* Warning */}
      <div
        style={{
          margin: "10px 10px 0",
          background: C.background,
          padding: "7px 10px",
          display: "flex",
          gap: 7,
          alignItems: "flex-start",
        }}
      >
        <span style={{ fontSize: 10 }}>
          <CircleAlert size={16} className="text-[#FFAA14]" />{" "}
        </span>
        <p
          className="font-normal"
          style={{ margin: 0, fontSize: 12, color: C.text, lineHeight: 1.55 }}
        >
          You can upload six images of the product.
        </p>
      </div>

      <div
        style={{
          padding: "14px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          flex: 1,
        }}
      >
        {/* ── Main Image → featured_image_url ── */}
        <section>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <p style={labelStyle}>Main Image</p>
          </div>

          {form.main_image ? (
            <>
              {/* Badge: existing vs staged */}
              <div style={{ marginBottom: 4, display: "flex", gap: 4 }}>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: 10,
                    background:
                      form.main_image.type === "existing"
                        ? (C.successBg ?? "#EBF7F0")
                        : C.amberLight,
                    color:
                      form.main_image.type === "existing"
                        ? (C.success ?? "#1A7F3C")
                        : C.amberText,
                    border: `1px solid ${form.main_image.type === "existing" ? "#B6E6C8" : C.amberBorder}`,
                  }}
                >
                  {form.main_image.type === "existing" ? "✓ saved" : "⬆ new"}
                </span>
              </div>
              <FileRow
                file={slotFile(form.main_image)}
                preview={slotUrl(form.main_image)}
                onRemove={removeMain}
              />
            </>
          ) : (
            <UploadZone onFiles={handleMain} />
          )}
        </section>

        {/* ── Other Images → images[] gallery ── */}
        <section>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <p style={labelStyle}>Other Images</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {form.other_images.map((img, i) => (
              <div key={i}>
                <div style={{ marginBottom: 3 }}>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: 10,
                      background:
                        img.type === "existing"
                          ? (C.successBg ?? "#EBF7F0")
                          : C.amberLight,
                      color:
                        img.type === "existing"
                          ? (C.success ?? "#1A7F3C")
                          : C.amberText,
                      border: `1px solid ${img.type === "existing" ? "#B6E6C8" : C.amberBorder}`,
                    }}
                  >
                    {img.type === "existing" ? "✓ saved" : "⬆ new"}
                  </span>
                </div>
                <FileRow
                  file={slotFile(img)}
                  preview={slotUrl(img)}
                  onRemove={() => removeOther(i)}
                />
              </div>
            ))}
            {canAddOther && <UploadZone onFiles={handleOther} compact />}
            {!canAddOther && (
              <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>
                Maximum reached (5)
              </p>
            )}
          </div>
        </section>
      </div>
    </aside>
  );
};

const labelStyle = {
  margin: 0,
  fontSize: 10,
  fontWeight: 700,
  color: C.secondary,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
};

// =============================================================================
// DrawerHeader
// =============================================================================
const DrawerHeader = ({
  isEdit,
  hasPrev,
  hasNext,
  onBack,
  onNext,
  onClose,
}) => (
  <header
    style={{
      padding: "13px 18px",
      borderBottom: `1px solid ${C.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexShrink: 0,
      background: C.white,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: R.md,
          background: isEdit ? C.amberLight : C.ink,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {isEdit ? <EditIcon /> : <PlusIcon />}
      </div>
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 800,
            color: C.ink,
            letterSpacing: "-0.02em",
          }}
        >
          {isEdit ? "Edit Product" : "Add Product"}
        </h2>
        <p style={{ margin: 0, fontSize: 10, color: C.muted }}>
          {isEdit ? "Update product details" : "Fill in the details below"}
        </p>
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      {hasPrev && <NavBtn onClick={onBack} label="Back" dir="left" />}
      {hasNext && <NavBtn onClick={onNext} label="Next" dir="right" />}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{
          width: 30,
          height: 30,
          borderRadius: R.sm,
          background: C.surface,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.secondary,
          marginLeft: 4,
        }}
      >
        <CloseIcon />
      </button>
    </div>
  </header>
);

// =============================================================================
// StepProgressBar
// =============================================================================
const StepProgressBar = ({ current, total }) => (
  <div style={{ height: 3, background: C.surface, flexShrink: 0 }}>
    <div
      style={{
        height: "100%",
        width: `${((current + 1) / total) * 100}%`,
        background: C.amber,
        transition: "width 0.3s ease",
        borderRadius: "0 2px 2px 0",
      }}
    />
  </div>
);

// =============================================================================
// DrawerFooter
// =============================================================================
const DrawerFooter = ({
  isEdit,
  submitting,
  hasPrev,
  hasNext,
  onBack,
  onNext,
  onCancel,
  onSubmit,
}) => (
  <footer
    style={{
      borderTop: `1px solid ${C.border}`,
      background: C.offWhite,
      padding: "12px 18px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexShrink: 0,
    }}
  >
    <button
      type="button"
      onClick={onCancel}
      style={{
        padding: "9px 20px",
        background: C.white,
        color: C.secondary,
        border: `1.5px solid ${C.border}`,
        borderRadius: R.md,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      Cancel
    </button>
    <div style={{ display: "flex", gap: 8 }}>
      {hasPrev && (
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: "9px 16px",
            background: C.surface,
            color: C.secondary,
            border: "none",
            borderRadius: R.md,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
      )}
      {hasNext ? (
        <button
          type="button"
          onClick={onNext}
          style={{
            padding: "9px 22px",
            background: C.ink,
            color: C.amber,
            border: "none",
            borderRadius: R.md,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Next →
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          style={{
            padding: "9px 26px",
            background: submitting ? C.borderMid : C.amber,
            color: C.ink,
            border: "none",
            borderRadius: R.md,
            fontSize: 13,
            fontWeight: 800,
            cursor: submitting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 7,
            opacity: submitting ? 0.75 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {submitting ? (
            <>
              <Spinner /> Saving…
            </>
          ) : isEdit ? (
            "Save Changes"
          ) : (
            "Save"
          )}
        </button>
      )}
    </div>
  </footer>
);

// =============================================================================
// ProductDrawer — root export
//
// Props:
//   isOpen   boolean
//   product  object | null   — null = create, object = edit
//   onClose  () => void
//   onSave   (savedProduct, isEdit) => void
// =============================================================================
export const ProductDrawer = ({ isOpen, product, onClose, onSave }) => {
  const isEdit = !!product;
  const { form, set } = useProductForm(product, isOpen);
  const [stepIdx, setStepIdx] = useState(0);

  const steps = form.listing_type === "Package" ? STEPS_PACKAGE : STEPS_SINGLE;
  const hasPrev = stepIdx > 0;
  const hasNext = stepIdx < steps.length - 1;

  // Clamp step when listing type switches Package→Single (drops step 4)
  useEffect(() => {
    if (stepIdx >= steps.length) setStepIdx(steps.length - 1);
  }, [form.listing_type]); // eslint-disable-line

  useEffect(() => {
    if (isOpen) setStepIdx(0);
  }, [isOpen]);

  const { submitting, error, setError, handleSubmit } = useProductSubmit({
    form,
    product,
    onSave,
    onClose,
  });

  if (!isOpen) return null;

  const currentStep = steps[stepIdx];

  const goBack = () => {
    setError("");
    setStepIdx((s) => s - 1);
  };
  const goNext = () => {
    setError("");
    setStepIdx((s) => s + 1);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(24,20,12,0.50)",
          zIndex: 40,
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Edit Product" : "Add Product"}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          maxWidth: 800,
          zIndex: 50,
          background: C.white,
          boxShadow: "-20px 0 70px rgba(24,20,12,0.14)",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'DM Sans', 'Geist', system-ui, sans-serif",
          animation: "drawerIn 0.32s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <style>{`
          @keyframes drawerIn { from { transform: translateX(100%); opacity: 0; } to { transform: none; opacity: 1; } }
          @keyframes spin      { to   { transform: rotate(360deg); } }
          input:focus, textarea:focus, select:focus {
            border-color: ${C.amber} !important;
            box-shadow: 0 0 0 3px rgba(245,166,35,0.14);
          }
        `}</style>

        <DrawerHeader
          isEdit={isEdit}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onBack={goBack}
          onNext={goNext}
          onClose={onClose}
        />

        <StepProgressBar current={stepIdx} total={steps.length} />

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Left — image panel */}
          <ImagePanel form={form} set={set} />

          {/* Right — step content */}
          <main
            className="bg-[#f9f9f9]"
            style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}
          >
            {error && (
              <div
                style={{
                  marginBottom: 14,
                  padding: "10px 14px",
                  background: C.dangerBg,
                  border: `1.5px solid ${C.dangerBorder}`,
                  borderRadius: R.md,
                  fontSize: 12,
                  color: C.danger,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <span>⚠ {error}</span>
                <button
                  type="button"
                  onClick={() => setError("")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: C.danger,
                    fontSize: 16,
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              </div>
            )}

            {currentStep.id === "general" && (
              <GeneralTab form={form} set={set} totalSteps={steps.length} />
            )}
            {currentStep.id === "content" && (
              <ContentTab form={form} set={set} totalSteps={steps.length} />
            )}
            {currentStep.id === "specs" && (
              <SpecsTab form={form} set={set} totalSteps={steps.length} />
            )}
            {currentStep.id === "components" && (
              <ComponentsTab form={form} set={set} totalSteps={steps.length} />
            )}
            {currentStep.id === "compatibility" && (
              <CompatibilityTab
                form={form}
                set={set}
                totalSteps={steps.length}
              />
            )}
          </main>
        </div>

        <DrawerFooter
          isEdit={isEdit}
          submitting={submitting}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onBack={goBack}
          onNext={goNext}
          onCancel={onClose}
          onSubmit={handleSubmit}
        />
      </div>
    </>
  );
};

// =============================================================================
// Icons
// =============================================================================
const PlusIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#FAFAF8"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const EditIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke={C.amberText}
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const CloseIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const Spinner = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    style={{ animation: "spin 0.75s linear infinite", flexShrink: 0 }}
  >
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
);
const NavBtn = ({ onClick, label, dir }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 4,
      background: "none",
      border: "none",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 600,
      color: C.secondary,
      padding: "4px 6px",
      borderRadius: R.sm,
    }}
  >
    {dir === "left" && (
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
    )}
    {label}
    {dir === "right" && (
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    )}
  </button>
);
