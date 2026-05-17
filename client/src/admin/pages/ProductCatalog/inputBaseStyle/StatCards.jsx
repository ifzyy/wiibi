import React from "react";
import { COLORS, FONT_SIZE } from "../constants";

const STAT_DEFINITIONS = [
  { key: "total",      label: "Total",     barColor: COLORS.ink,    textColor: COLORS.ink        },
  { key: "inStock",    label: "In Stock",  barColor: COLORS.success, textColor: COLORS.successText },
  { key: "lowStock",   label: "Low Stock", barColor: COLORS.warn,   textColor: COLORS.warnText   },
  { key: "outOfStock", label: "Sold Out",  barColor: COLORS.danger,  textColor: COLORS.dangerText },
];

const StatCard = React.memo(({ label, value, barColor, textColor }) => (
  <div style={{
    background: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: "14px 18px",
    position: "relative",
    overflow: "hidden",
  }}>
    {/* Top accent bar */}
    <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: barColor }} />
    <p style={{ color: COLORS.textMuted, fontSize: FONT_SIZE.xs, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
      {label}
    </p>
    <p style={{ color: textColor, fontSize: 30, fontWeight: 800, margin: "4px 0 0", lineHeight: 1.1 }}>
      {value}
    </p>
  </div>
));
StatCard.displayName = "StatCard";

export const StatCards = React.memo(({ stats }) => (
  <div
    role="region"
    aria-label="Inventory summary"
    style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}
  >
    {STAT_DEFINITIONS.map(({ key, label, barColor, textColor }) => (
      <StatCard key={key} label={label} value={stats[key]} barColor={barColor} textColor={textColor} />
    ))}
  </div>
));
StatCards.displayName = "StatCards";