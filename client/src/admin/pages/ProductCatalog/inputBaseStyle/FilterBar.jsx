import React from "react";
import { COLORS, RADIUS, STATUS_CONFIG } from "../constants";
import { Icon, inputBaseStyle } from "./Primitives";

export const FilterBar = React.memo(({
  search, onSearchChange,
  filterStatus, onStatusChange,
  filterCategory, onCategoryChange,
  categories,
  hasActiveFilters, onClearFilters,
}) => (
  <div
    role="search"
    aria-label="Filter products"
    style={{
      background: COLORS.white,
      border: `1px solid ${COLORS.border}`,
      borderRadius: RADIUS.xl,
      padding: "12px 16px",
      display: "flex",
      flexWrap: "wrap",
      gap: 10,
      alignItems: "center",
    }}
  >
    {/* Search input */}
    <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
      <Icon
        name="search"
        size={14}
        style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: COLORS.textMuted }}
      />
      <input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search name, category, or SKU…"
        aria-label="Search products"
        style={{ ...inputBaseStyle, paddingLeft: 34, paddingRight: search ? 30 : 14 }}
      />
      {search && (
        <button
          onClick={() => onSearchChange("")}
          aria-label="Clear search"
          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: COLORS.textMuted, display: "flex" }}
        >
          <Icon name="x" size={13} />
        </button>
      )}
    </div>

    {/* Status filter */}
    <select
      value={filterStatus}
      onChange={(e) => onStatusChange(e.target.value)}
      aria-label="Filter by status"
      style={{ ...inputBaseStyle, width: "auto" }}
    >
      <option value="all">All Statuses</option>
      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
        <option key={k} value={k}>{v.label}</option>
      ))}
    </select>

    {/* Category filter */}
    <select
      value={filterCategory}
      onChange={(e) => onCategoryChange(e.target.value)}
      aria-label="Filter by category"
      style={{ ...inputBaseStyle, width: "auto" }}
    >
      <option value="all">All Categories</option>
      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
    </select>

    {hasActiveFilters && (
      <button
        onClick={onClearFilters}
        style={{ background: "none", border: "none", color: COLORS.amber, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
      >
        ✕ Clear all
      </button>
    )}
  </div>
));
FilterBar.displayName = "FilterBar";