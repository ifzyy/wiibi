import React, { useState } from "react";
import { COLORS, FONT_SIZE, RADIUS, STATUS_CONFIG } from "../constants";
import { Icon, inputBaseStyle } from "../inputBaseStyle/Primitives";

// ─────────────────────────────────────────────────────────────────────────────
// FilterBar
//
// Matches screenshot: search input left, "Filter" button right.
// Filter button expands dropdowns inline when clicked.
// ─────────────────────────────────────────────────────────────────────────────
export const FilterBar = React.memo(({
  search, onSearchChange,
  filterStatus, onStatusChange,
  filterCategory, onCategoryChange,
  categories,
  hasActiveFilters, onClearFilters,
}) => {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* ── Main bar ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1 }}>
          <Icon
            name="search"
            size={15}
            style={{
              position: "absolute", left: 13,
              top: "50%", transform: "translateY(-50%)",
              color: COLORS.textMuted,
              pointerEvents: "none",
            }}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search name , category, or SKU"
            aria-label="Search products"
            style={{
              width: "100%",
              padding: "10px 14px 10px 40px",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              fontSize: FONT_SIZE.md,
              color: COLORS.ink,
              background: COLORS.white,
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              style={{
                position: "absolute", right: 10,
                top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none",
                cursor: "pointer", color: COLORS.textMuted,
                display: "flex", padding: 2,
              }}
            >
              <Icon name="x" size={13} />
            </button>
          )}
        </div>

        {/* Filter button */}
        <button
          type="button"
          onClick={() => setFiltersOpen(o => !o)}
          aria-expanded={filtersOpen}
          style={{
            padding: "10px 18px",
            background: filtersOpen ? COLORS.ink : COLORS.white,
            border: `1px solid ${filtersOpen ? COLORS.ink : COLORS.border}`,
            borderRadius: 10,
            cursor: "pointer",
            color: filtersOpen ? COLORS.white : COLORS.ink,
            fontWeight: 700,
            fontSize: FONT_SIZE.md,
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontFamily: "inherit",
            flexShrink: 0,
            transition: "all 0.15s",
          }}
        >
          {/* Hamburger filter icon */}
          <svg width="15" height="12" viewBox="0 0 15 12" fill="none">
            <rect x="0" y="0"  width="15" height="2" rx="1" fill="currentColor"/>
            <rect x="3" y="5"  width="9"  height="2" rx="1" fill="currentColor"/>
            <rect x="5" y="10" width="5"  height="2" rx="1" fill="currentColor"/>
          </svg>
          Filter
          {hasActiveFilters && (
            <span style={{
              background: COLORS.amber,
              color: COLORS.ink,
              borderRadius: 99,
              fontSize: 10,
              fontWeight: 800,
              padding: "1px 6px",
              marginLeft: 2,
            }}>
              ON
            </span>
          )}
        </button>
      </div>

      {/* ── Expanded filters ── */}
      {filtersOpen && (
        <div style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          padding: "12px 16px",
          background: COLORS.white,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
        }}>
          {/* Status */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: FONT_SIZE.xs, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              aria-label="Filter by status"
              style={{
                padding: "7px 12px",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                fontSize: FONT_SIZE.md,
                color: COLORS.ink,
                background: COLORS.white,
                fontFamily: "inherit",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: FONT_SIZE.xs, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              aria-label="Filter by category"
              style={{
                padding: "7px 12px",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                fontSize: FONT_SIZE.md,
                color: COLORS.ink,
                background: COLORS.white,
                fontFamily: "inherit",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="all">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => { onClearFilters(); }}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                color: COLORS.danger,
                fontSize: FONT_SIZE.sm,
                fontWeight: 700,
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: 6,
                fontFamily: "inherit",
              }}
            >
              ✕ Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
});
FilterBar.displayName = "FilterBar";