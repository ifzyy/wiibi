import { C } from "../constants.js";

const PageHeader = ({ totalOrders, loading, onRefresh, onExport, exportDisabled }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
    <div>
      <p style={{
        margin: "0 0 4px", fontSize: 11, fontWeight: 800,
        color: C.amber, textTransform: "uppercase", letterSpacing: 1.2,
      }}>Order Management</p>
      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: C.ink, letterSpacing: -0.5 }}>
        All Orders
      </h1>
      <p style={{ margin: "4px 0 0", fontSize: 13, color: C.inkFaint }}>
        {loading
          ? "Loading…"
          : `${totalOrders} order${totalOrders !== 1 ? "s" : ""} · updated just now`
        }
      </p>
    </div>

    <div style={{ display: "flex", gap: 10 }}>
      <button
        onClick={onRefresh}
        disabled={loading}
        style={{
          padding: "9px 16px", borderRadius: 8,
          border: `1px solid ${C.border}`, background: C.white,
          color: C.inkMid, fontWeight: 600, cursor: "pointer",
          fontSize: 13, opacity: loading ? 0.6 : 1,
          transition: "opacity 0.15s",
        }}
      >↺ Refresh</button>

      <button
        onClick={onExport}
        disabled={exportDisabled}
        style={{
          padding: "9px 16px", borderRadius: 8,
          border: `1px solid ${C.border}`, background: C.white,
          color: C.inkMid, fontWeight: 600, cursor: exportDisabled ? "not-allowed" : "pointer",
          fontSize: 13, opacity: exportDisabled ? 0.5 : 1,
        }}
      >↓ Export CSV</button>
    </div>
  </div>
);

export default PageHeader;