import React from "react";
import { COLORS, FONT_SIZE } from "../constants";
import { Icon } from "../inputBaseStyle/Primitives";

export const TopBar = React.memo(({ productCount, dirtyCount, onRefresh, onNewProduct }) => (
  <header style={{
    background: COLORS.white,
    borderBottom: `1px solid ${COLORS.border}`,
    padding: "28px 40px 20px",
  }}>
    <div style={{
      maxWidth: 1280,
      margin: "0 auto",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
    }}>
      {/* Title block */}
      <div>
        <h1 style={{
          color: COLORS.ink,
          fontWeight: 800,
          fontSize: 32,
          letterSpacing: "-0.03em",
          margin: 0,
          lineHeight: 1.1,
          fontFamily: "'DM Sans', 'Geist', system-ui",
        }}>
          Inventory
        </h1>
        <p style={{
          color: COLORS.textMuted,
          fontSize: FONT_SIZE.md,
          margin: "5px 0 0",
          fontWeight: 400,
        }}>
          Manage your product inventory and listings
          {dirtyCount > 0 && (
            <span style={{ color: COLORS.amber, fontWeight: 700, marginLeft: 8 }}>
              · {dirtyCount} unsaved change{dirtyCount !== 1 ? "s" : ""}
            </span>
          )}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 4 }}>
        <button
          type="button"
          onClick={onRefresh}
          aria-label="Refresh"
          title="Refresh product list"
          style={{
            padding: "9px 12px",
            background: COLORS.white,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 10,
            cursor: "pointer",
            color: COLORS.textSec,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Icon name="refresh" size={15} />
        </button>

        <button
          type="button"
          onClick={onNewProduct}
          style={{
            padding: "9px 20px",
            background: COLORS.amber,
            color: COLORS.ink,
            border: "none",
            borderRadius: 10,
            fontWeight: 800,
            fontSize: FONT_SIZE.md,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "inherit",
            letterSpacing: "-0.01em",
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1, marginTop: -1 }}>+</span>
          Add new product
        </button>
      </div>
    </div>
  </header>
));
TopBar.displayName = "TopBar";