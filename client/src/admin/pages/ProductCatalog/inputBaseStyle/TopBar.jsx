import React from "react";
import { COLORS } from "../constants";
import { Icon } from "./Primitives";

export const TopBar = React.memo(({ productCount, dirtyCount, onRefresh, onNewProduct }) => (
  <header
    style={{
      background: COLORS.ink,
      borderBottom: `3px solid ${COLORS.amber}`,
      position: "sticky",
      top: 0,
      zIndex: 30,
    }}
  >
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "13px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>

      {/* Brand / title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ background: COLORS.amber, borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="grid" size={18} style={{ color: COLORS.ink }} />
        </div>
        <div>
          <h1 style={{ color: COLORS.amber, fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em", margin: 0 }}>
            Product Catalog
          </h1>
          <p style={{ color: COLORS.amberLight, fontSize: 11, margin: 0 }}>
            {productCount} product{productCount !== 1 ? "s" : ""}
            {dirtyCount > 0 && (
              <span style={{ color: COLORS.amber, fontWeight: 700 }}> · {dirtyCount} unsaved</span>
            )}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={onRefresh}
          aria-label="Refresh product list"
          title="Refresh"
          style={{ padding: 8, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,221,161,0.2)", borderRadius: 8, cursor: "pointer", color: COLORS.amberLight, display: "flex" }}
        >
          <Icon name="refresh" size={15} />
        </button>

        <button
          type="button"
          onClick={onNewProduct}
          style={{ padding: "8px 16px", background: COLORS.amber, color: COLORS.ink, border: "none", borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          <Icon name="plus" size={14} />
          New Product
        </button>
      </div>
    </div>
  </header>
));
TopBar.displayName = "TopBar";