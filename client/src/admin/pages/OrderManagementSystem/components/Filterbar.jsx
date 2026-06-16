import { C, FULFILLMENT, PAYMENT } from "../constants.js";
import { inputStyle } from "./Ui.jsx";

const FilterBar = ({
  orders,
  fFilter, setFFilter,
  pFilter, setPFilter,
  search,  setSearch,
  resultCount,
  totalCount,
}) => {
  const fTabs = [
    { key: "all", label: "All", count: totalCount },
    ...Object.entries(FULFILLMENT).map(([k, v]) => ({
      key: k, label: v.label,
      count: orders.filter(o => (o.fulfillmentStatus ?? o.status) === k).length,
    })),
  ];

  const pTabs = [
    { key: "all", label: "All" },
    ...Object.entries(PAYMENT).map(([k, v]) => ({ key: k, label: v.label })),
  ];

  return (
    <div style={{
      background: C.white, borderRadius: 12,
      border: `1px solid ${C.border}`,
      marginBottom: 12, overflow: "hidden",
    }}>
      {/* Fulfillment tabs */}
      <div style={{
        display: "flex", borderBottom: `1px solid ${C.border}`,
        padding: "0 20px", overflowX: "auto",
      }}>
        {fTabs.map(t => {
          const active = fFilter === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setFFilter(t.key)}
              style={{
                padding: "13px 0", marginRight: 20,
                border: "none", background: "none", cursor: "pointer",
                fontSize: 13, fontWeight: active ? 700 : 500,
                color: active ? C.ink : C.inkFaint,
                borderBottom: active ? `2px solid ${C.amber}` : "2px solid transparent",
                whiteSpace: "nowrap", fontFamily: "Geist, sans-serif",
                transition: "color 0.1s",
              }}
            >
              {t.label}
              <span style={{
                marginLeft: 5, padding: "1px 7px", borderRadius: 99, fontSize: 11,
                background: active ? C.amberBg : C.bg,
                color: active ? C.ink : C.inkFaint,
                fontWeight: 700,
              }}>{t.count}</span>
            </button>
          );
        })}
      </div>

      {/* Search + payment filter */}
      <div style={{
        padding: "12px 20px",
        display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center",
      }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <span style={{
            position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
            color: C.inkFaint, fontSize: 14, pointerEvents: "none",
          }}>⌕</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order number, customer, email…"
            style={{ ...inputStyle, paddingLeft: 32, background: C.bg }}
          />
        </div>

        {/* Payment filter pills */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 10, fontWeight: 800, color: C.inkFaint,
            textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap",
          }}>Payment</span>
          {pTabs.map(t => {
            const active = pFilter === t.key;
            return (
              <button key={t.key} onClick={() => setPFilter(t.key)} style={{
                padding: "5px 12px", borderRadius: 99, cursor: "pointer",
                fontFamily: "Geist, sans-serif",
                border: active ? `1.5px solid ${C.ink}` : `1.5px solid ${C.border}`,
                background: active ? C.ink : C.white,
                color: active ? C.white : C.inkMid,
                fontSize: 11, fontWeight: active ? 700 : 500, whiteSpace: "nowrap",
                transition: "all 0.1s",
              }}>{t.label}</button>
            );
          })}
        </div>

        <span style={{ fontSize: 12, color: C.inkFaint, marginLeft: "auto", whiteSpace: "nowrap" }}>
          {resultCount} result{resultCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
};

export default FilterBar;