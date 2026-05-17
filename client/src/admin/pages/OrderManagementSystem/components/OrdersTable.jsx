import { C, FULFILLMENT, PAYMENT, TABLE_COLS, COLS_TEMPLATE } from "../constants.js";
import { fmt, fmtDate } from "../utils/format.js";
import { getOrderNum, getCustomerName, getCustomerEmail, getTotal, getTotalQty, getFulfillmentCfg,getCustomerPhone, getPaymentCfg } from "../utils/orderHelpers.js";
import { Badge, Avatar, IBtn, Skeleton, EmptyState, SortIcon } from "./Ui.jsx";

/* ── Skeleton row ─────────────────────────────────────────────────────────── */
const SkeletonRow = () => (
  <div style={{
    display: "grid", gridTemplateColumns: COLS_TEMPLATE,
    padding: "16px 20px", borderBottom: `1px solid ${C.border}`,
    alignItems: "center", gap: 8,
  }}>
    <Skeleton w={100} />
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#F0EDE8", flexShrink: 0 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <Skeleton w={110} /><Skeleton w={85} h={11} />
      </div>
    </div>
    {[80, 40, 75, 90, 90, 50].map((w, j) => <Skeleton key={j} w={w} />)}
  </div>
);

/* ── Order row ────────────────────────────────────────────────────────────── */
const OrderRow = ({ order, isLast, onView, onEdit }) => {
  const id    = order.id ?? order._id;
  const num   = getOrderNum(order);
  const name  = getCustomerName(order);
  const email = getCustomerEmail(order);
  const phone = getCustomerPhone(order);
  const qty   = getTotalQty(order);
  const fCfg  = getFulfillmentCfg(order);
  const pCfg  = getPaymentCfg(order);

  return (
    <div
      onClick={() => onView(id)}
      style={{
        display: "grid", gridTemplateColumns: COLS_TEMPLATE,
        padding: "14px 20px",
        borderBottom: isLast ? "none" : `1px solid ${C.border}`,
        alignItems: "center", cursor: "pointer",
        transition: "background 0.1s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = C.bg}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      {/* Order number */}
      <div>
        <span style={{
          fontSize: 12, fontWeight: 700, color: C.ink,
          fontFamily: "Geist Mono, monospace",
        }}>{num}</span>
      </div>

      {/* Customer */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <Avatar name={name} size={30} />
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
          <p style={{ margin: 0, fontSize: 11, color: C.inkFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{phone}</p>
        </div>
      </div>

      {/* Total */}
      <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{fmt(getTotal(order))}</span>

      {/* Item count */}
      <span style={{ fontSize: 12, color: C.inkMid }}>{qty}</span>

      {/* Date */}
      <span style={{ fontSize: 12, color: C.inkFaint }}>{fmtDate(order.createdAt)}</span>

      {/* Fulfillment badge */}
      <div onClick={e => e.stopPropagation()}><Badge cfg={fCfg} /></div>

      {/* Payment badge */}
      <div onClick={e => e.stopPropagation()}><Badge cfg={pCfg} /></div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
        <IBtn onClick={() => onView(id)} title="View details">⊙</IBtn>
        <IBtn onClick={() => onEdit(order)} title="Update order" accent>✎</IBtn>
      </div>
    </div>
  );
};

/* ── Table head ───────────────────────────────────────────────────────────── */
const TableHead = ({ sortKey, sortDir, toggleSort }) => (
  <div style={{
    display: "grid", gridTemplateColumns: COLS_TEMPLATE,
    padding: "10px 20px",
    background: C.bg, borderBottom: `1px solid ${C.border}`,
  }}>
    {TABLE_COLS.map(col => (
      <span
        key={col.label}
        onClick={col.k ? () => toggleSort(col.k) : undefined}
        style={{
          fontSize: 10, fontWeight: 800, color: C.inkFaint,
          textTransform: "uppercase", letterSpacing: 0.8,
          cursor: col.k ? "pointer" : "default", userSelect: "none",
          display: "flex", alignItems: "center",
        }}
      >
        {col.label}
        {col.k && <SortIcon active={sortKey === col.k} dir={sortDir} />}
      </span>
    ))}
  </div>
);

/* ── Main table ───────────────────────────────────────────────────────────── */
const OrdersTable = ({ orders, loading, fetchErr, sortKey, sortDir, toggleSort, onView, onEdit }) => (
  <div style={{
    background: C.white, borderRadius: 12,
    border: `1px solid ${C.border}`, overflow: "hidden",
  }}>
    <TableHead sortKey={sortKey} sortDir={sortDir} toggleSort={toggleSort} />

    {loading && [1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}

    {!loading && orders.length === 0 && (
      <EmptyState message={fetchErr ? "Could not load orders." : "No orders match your filters."} />
    )}

    {!loading && orders.map((order, i) => (
      <OrderRow
        key={order.id ?? order._id}
        order={order}
        isLast={i === orders.length - 1}
        onView={onView}
        onEdit={onEdit}
      />
    ))}
  </div>
);

export default OrdersTable;