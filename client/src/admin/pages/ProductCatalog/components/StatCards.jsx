import React, { useMemo } from "react";
import { COLORS, FONT_SIZE } from "../constants";

// ─────────────────────────────────────────────────────────────────────────────
// StatCards
//
// Matches the screenshot layout:
//   [Total Inventory Value] [Low Stock Items] [Active Listing] [Top Performing Category]
//
// `stats` shape expected (computed in useProductFilter or ProductCatalogPage):
//   {
//     totalValue:           number,   // sum of price * stock
//     totalValueChange:     number,   // % change (optional, shown as green arrow)
//     lowStockCount:        number,   // products with stock < 10
//     lowStockThreshold:    number,   // e.g. 10
//     activeCount:          number,   // is_visible = true
//     totalCount:           number,   // all products
//     topCategory:          string,   // category with most products
//     topCategoryCount:     number,   // how many unique products in that category
//   }
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (n) =>
  typeof n === "number"
    ? n.toLocaleString("en-NG", { maximumFractionDigits: 0 })
    : "—";

const cardBase = {
  background: COLORS.white,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 14,
  padding: "22px 24px 20px",
  display: "flex",
  flexDirection: "column",
  gap: 6,
  minHeight: 130,
};

const labelStyle = {
  color: COLORS.textMuted,
  fontSize: FONT_SIZE.sm,
  fontWeight: 500,
  margin: 0,
  letterSpacing: "0.01em",
};

const bigNumStyle = {
  fontWeight: 800,
  fontSize: 34,
  letterSpacing: "-0.04em",
  lineHeight: 1,
  margin: 0,
  color: COLORS.ink,
  fontFamily: "'DM Sans', 'Geist', system-ui",
};

const subStyle = {
  fontSize: FONT_SIZE.sm,
  margin: 0,
  color: COLORS.textMuted,
  display: "flex",
  alignItems: "center",
  gap: 4,
};

export const StatCards = React.memo(({ stats = {}, products = [] }) => {
  // Derive stats from products if not pre-computed
  const derived = useMemo(() => {
    if (!products.length) return stats;

    const totalValue = products.reduce((sum, p) => sum + (Number(p.price) * Number(p.stock || 0)), 0);
    const lowStockCount = products.filter(p => Number(p.stock) > 0 && Number(p.stock) < 10).length;
    const activeCount = products.filter(p => p.is_visible).length;
    const totalCount = products.length;

    // Top category by product count
    const catMap = {};
    products.forEach(p => { if (p.category) catMap[p.category] = (catMap[p.category] || 0) + 1; });
    const topEntry = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

    return {
      totalValue,
      lowStockCount,
      activeCount,
      totalCount,
      topCategory:      topEntry?.[0] ?? "—",
      topCategoryCount: topEntry?.[1] ?? 0,
      ...stats, // allow overrides
    };
  }, [products, stats]);

  return (
    <div
      role="region"
      aria-label="Inventory summary"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 14,
      }}
    >
      {/* 1 — Total Inventory Value */}
      <div style={cardBase}>
        <p style={labelStyle}>Total Inventory Value</p>
        <p style={{ ...bigNumStyle, fontSize: 28 }}>
          ₦{fmt(derived.totalValue ?? 0)}
        </p>
        {derived.totalValueChange != null && (
          <p style={{ ...subStyle, color: COLORS.success }}>
            <span style={{ fontSize: 13 }}>↗</span>
            <span style={{ color: COLORS.success, fontWeight: 700 }}>
              {derived.totalValueChange}%
            </span>
            <span style={{ color: COLORS.textMuted }}> this month</span>
          </p>
        )}
      </div>

      {/* 2 — Low Stock Items */}
      <div style={{ ...cardBase, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <p style={labelStyle}>Low Stock Items</p>
          {/* Warning icon — matches screenshot */}
          <div style={{
            width: 20, height: 20,
            border: `2px solid ${COLORS.danger}`,
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{ color: COLORS.danger, fontSize: 11, fontWeight: 800, lineHeight: 1 }}>!</span>
          </div>
        </div>
        <p style={bigNumStyle}>{derived.lowStockCount ?? 0}</p>
        <p style={subStyle}>
          Products
          <span style={{ color: COLORS.textMuted }}>{"  <  "}</span>
          {derived.lowStockThreshold ?? 10} Units
        </p>
      </div>

      {/* 3 — Active Listing */}
      <div style={cardBase}>
        <p style={labelStyle}>Active Listing</p>
        <p style={bigNumStyle}>
          <span>{derived.activeCount ?? 0}</span>
          <span style={{ color: COLORS.textMuted, fontWeight: 400, fontSize: 26 }}>
            /{derived.totalCount ?? 0}
          </span>
        </p>
      </div>

      {/* 4 — Top Performing Category */}
      <div style={cardBase}>
        <p style={labelStyle}>Top Performing Category</p>
        <p style={{ ...bigNumStyle, fontSize: 28, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {derived.topCategory ?? "—"}
        </p>
        {derived.topCategoryCount > 0 && (
          <p style={subStyle}>
            {derived.topCategoryCount} Unique Product{derived.topCategoryCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
});
StatCards.displayName = "StatCards";