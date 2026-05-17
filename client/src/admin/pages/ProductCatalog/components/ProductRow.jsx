import React, { useState, useRef, useEffect } from "react";
import { COLORS, FONT_SIZE, STATUS_CONFIG } from "../constants";
import { fmt, getProductThumb } from "../utils";
import { Icon } from "../inputBaseStyle/Primitives";

// ─────────────────────────────────────────────────────────────────────────────
// Grid — matches screenshot columns exactly:
// checkbox | image+name | price | stock | category | status | SKU | actions
// ─────────────────────────────────────────────────────────────────────────────
const GRID = "36px 2.5fr 140px 80px 140px 100px 120px 44px";

// ─────────────────────────────────────────────────────────────────────────────
// ProductTableHeader
// ─────────────────────────────────────────────────────────────────────────────
export const ProductTableHeader = () => (
  <div
    role="row"
    style={{
      display: "grid",
      gridTemplateColumns: GRID,
      gap: 12,
      padding: "10px 20px",
      background: "#F7F7F5",
      borderBottom: `1px solid ${COLORS.border}`,
      color: COLORS.textMuted,
      fontSize: FONT_SIZE.xs,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.07em",
      alignItems: "center",
    }}
  >
    <div /> {/* checkbox col */}
    <div role="columnheader">Product</div>
    <div role="columnheader">Price</div>
    <div role="columnheader" style={{ textAlign: "center" }}>Stock</div>
    <div role="columnheader">Category</div>
    <div role="columnheader">Status</div>
    <div role="columnheader">SKU</div>
    <div /> {/* actions col */}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// ActiveStatusText — "Active" in green, matches screenshot
// ─────────────────────────────────────────────────────────────────────────────
const ActiveStatusText = ({ stock, isVisible }) => {
  if (!isVisible) {
    return <span style={{ color: COLORS.textMuted, fontSize: FONT_SIZE.md, fontWeight: 500 }}>Hidden</span>;
  }
  if (stock === 0 || stock == null) {
    return <span style={{ color: COLORS.danger, fontSize: FONT_SIZE.md, fontWeight: 600 }}>Sold Out</span>;
  }
  if (stock < 10) {
    return <span style={{ color: COLORS.warn, fontSize: FONT_SIZE.md, fontWeight: 600 }}>Low Stock</span>;
  }
  return <span style={{ color: COLORS.success, fontSize: FONT_SIZE.md, fontWeight: 600 }}>Active</span>;
};

// ─────────────────────────────────────────────────────────────────────────────
// ThreeDotMenu — the "···" actions menu from screenshot
// ─────────────────────────────────────────────────────────────────────────────
const ThreeDotMenu = ({ onEdit, onDelete, productName, above = false }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={`Actions for ${productName}`}
        style={{
          width: 32, height: 32,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "none",

          borderRadius: 8,
          cursor: "pointer",
          color: COLORS.textSec,
          fontSize: 16,
          letterSpacing: 1,
          fontWeight: 700,
        }}
      >
        ···
      </button>

      {open && (
        <div style={{
          position: "absolute",
          right: 0,
          top: above ? "auto" : "calc(100% + 4px)",
          bottom: above ? "calc(100% + 4px)" : "auto",
          background: COLORS.white,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
          minWidth: 140,
          zIndex: 100,
          overflow: "hidden",
        }}>
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            style={{
              width: "100%", padding: "10px 14px",
              background: "none", border: "none",
              textAlign: "left", cursor: "pointer",
              fontSize: FONT_SIZE.md, color: COLORS.ink,
              fontFamily: "inherit", fontWeight: 500,
              display: "flex", alignItems: "center", gap: 8,
            }}
            onMouseEnter={e => e.currentTarget.style.background = COLORS.surface}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            <Icon name="edit" size={13} />
            Edit product
          </button>
          <div style={{ height: 1, background: COLORS.border, margin: "0 10px" }} />
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            style={{
              width: "100%", padding: "10px 14px",
              background: "none", border: "none",
              textAlign: "left", cursor: "pointer",
              fontSize: FONT_SIZE.md, color: COLORS.danger,
              fontFamily: "inherit", fontWeight: 500,
              display: "flex", alignItems: "center", gap: 8,
            }}
            onMouseEnter={e => e.currentTarget.style.background = COLORS.dangerBg}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            <Icon name="trash" size={13} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ProductRow
// ─────────────────────────────────────────────────────────────────────────────
export const ProductRow = React.memo(({
  product, isDirty, isLast,
  onUpdate, onSave, onEdit, onDelete,
  selected, onSelect,
}) => {
  const thumbSrc = getProductThumb(product);
  // Amber category tag — shown above product name like screenshot
  const categoryColor = COLORS.amber;

  return (
    <div
      role="row"
      style={{
        display: "grid",
        gridTemplateColumns: GRID,
        gap: 12,
        padding: "14px 20px",
        alignItems: "center",
        borderBottom: isLast ? "none" : `1px solid #F2F2F0`,
        background: isDirty ? "#FFFDF0" : COLORS.white,
        transition: "background 0.12s",
      }}
      onMouseEnter={e => { if (!isDirty) e.currentTarget.style.background = "#FAFAFA"; }}
      onMouseLeave={e => { if (!isDirty) e.currentTarget.style.background = COLORS.white; }}
    >
      {/* ── Checkbox ── */}
      <div  role="cell" style={{ display: "flex", justifyContent: "center" }}>
        <input
          type="checkbox"
          checked={selected ?? false}
          onChange={onSelect ? (e) => onSelect(e.target.checked) : undefined}
          style={{
            width: 15, height: 15,
            accentColor: COLORS.amber,
            cursor: "pointer",
            border: "none",
            background: "#f2f2f2",
            borderRadius: 4,
          }}
        />
      </div>

      {/* ── Product name + image ── */}
      <div role="cell" style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        {/* Thumbnail */}
        <div style={{
          width: 44, height: 44,
          borderRadius: 8,
          overflow: "hidden",
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {thumbSrc
            ? <img src={thumbSrc} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={e => { e.target.style.display = "none"; }} />
            : <Icon name="image" size={16} style={{ color: COLORS.borderMid }} />
          }
        </div>

        {/* Name + category tag stacked — matches screenshot */}
        <div style={{ minWidth: 0 }}>
          {/* Category tag in amber above name */}
          {product.category && (
            <p style={{
              margin: "0 0 2px",
              fontSize: FONT_SIZE.xs,
              fontWeight: 700,
              color: categoryColor,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {product.category}
              {product.listing_type === "package" && (
                <span style={{ color: COLORS.textMuted, fontWeight: 500 }}> · Package</span>
              )}
            </p>
          )}
          <p style={{
            margin: 0,
            color: COLORS.ink,
            fontWeight: 600,
            fontSize: FONT_SIZE.md,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            {product.name}
            {product.is_featured && (
              <svg width={10} height={10} viewBox="0 0 24 24" fill={COLORS.amber} style={{ flexShrink: 0 }}>
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
              </svg>
            )}
            {isDirty && (
              <span style={{ width: 6, height: 6, background: COLORS.amber, borderRadius: "50%", flexShrink: 0, display: "inline-block" }} title="Unsaved" />
            )}
          </p>
        </div>
      </div>

      {/* ── Price ── */}
      <div role="cell">
        <p style={{ color: COLORS.ink, fontWeight: 700, fontSize: FONT_SIZE.md, margin: 0 }}>
          ₦{fmt(product.sale_price || product.price)}
        </p>
        {product.sale_price && Number(product.sale_price) < Number(product.price) && (
          <p style={{ color: COLORS.textMuted, fontSize: FONT_SIZE.sm, textDecoration: "line-through", margin: "1px 0 0" }}>
            ₦{fmt(product.price)}
          </p>
        )}
      </div>

      {/* ── Stock — inline editable, shows "–" for packages ── */}
      <div role="cell" style={{ display: "flex", justifyContent: "center" }}>
        {product.listing_type === "package" ? (
          <span style={{ color: COLORS.textMuted, fontSize: FONT_SIZE.md }}>–</span>
        ) : (
          <input
            type="number"
            min={0}
            value={product.stock ?? 0}
            onChange={(e) => onUpdate({ stock: Number(e.target.value) })}
            aria-label={`Stock for ${product.name}`}
            style={{
              width: 56,
              textAlign: "center",
              fontSize: FONT_SIZE.md,
              fontWeight: 600,
              background: COLORS.cardBg,
              border: `1.5px solid ${COLORS.border}`,
              borderRadius: 7,
              padding: "5px 4px",
              color: COLORS.ink,
              outline: "none",
              fontFamily: "inherit",
            }}
          />
        )}
      </div>

      {/* ── Category (plain text column) ── */}
      <div role="cell">
        <span style={{ fontSize: FONT_SIZE.md, color: COLORS.ink, fontWeight: 400 }}>
          {product.category || "—"}
        </span>
      </div>

      {/* ── Status — "Active" text style ── */}
      <div role="cell">
        <ActiveStatusText stock={product.stock} isVisible={product.is_visible} />
      </div>

      {/* ── SKU ── */}
      <div role="cell">
        <span style={{ fontSize: FONT_SIZE.md, color: COLORS.ink, fontWeight: 400 }}>
          {product.sku || "—"}
        </span>
      </div>

      {/* ── Three-dot actions menu ── */}
      <div role="cell" style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 4 }}>
        {isDirty && (
          <button
            onClick={onSave}
            aria-label={`Save ${product.name}`}
            style={{
              padding: "4px 8px",
              background: COLORS.amber,
              color: COLORS.ink,
              border: "none",
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Save
          </button>
        )}
        <ThreeDotMenu
          onEdit={onEdit}
          onDelete={onDelete}
          productName={product.name}
          above={isLast}
        />
      </div>
    </div>
  );
});
ProductRow.displayName = "ProductRow";

// ─────────────────────────────────────────────────────────────────────────────
// Table states
// ─────────────────────────────────────────────────────────────────────────────
export const TableLoadingState = () => (
  <div role="status" aria-live="polite" style={{ padding: "60px 20px", textAlign: "center" }}>
    <div style={{ width: 28, height: 28, border: `3px solid ${COLORS.amber}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 0.7s linear infinite" }} />
    <p style={{ color: COLORS.textMuted, fontSize: FONT_SIZE.md, margin: 0 }}>Loading products…</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export const TableEmptyState = () => (
  <div role="status" aria-live="polite" style={{ padding: "60px 20px", textAlign: "center" }}>
    <div style={{ width: 52, height: 52, background: COLORS.surface, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
      <Icon name="search" size={22} style={{ color: COLORS.borderMid }} />
    </div>
    <p style={{ color: COLORS.ink, fontWeight: 700, fontSize: 14, margin: 0 }}>No products match</p>
    <p style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 4, marginBottom: 0 }}>Try adjusting your search or filters</p>
  </div>
);