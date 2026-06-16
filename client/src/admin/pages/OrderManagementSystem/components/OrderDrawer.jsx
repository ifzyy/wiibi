import { C, FULFILLMENT, PAYMENT, EVENT_LABEL } from "../constants.js";
import { fmt, fmtDate, fmtDateTime, fmtRelative } from "../utils/format.js";
import { getOrderNum, getCustomerName, getCustomerEmail, getCustomerPhone, getTotal, getItemImage, getItemName, getItemSku } from "../utils/orderHelpers.js";
import { useOrderDetail } from "../hooks/useOrderDetails.js";
import { Badge, Avatar, Skeleton, DrawerSection, KVRow } from "./Ui.jsx";

/* ─── Timeline step ───────────────────────────────────────────────────────── */
const TimelineStep = ({ event, isLatest, isLast }) => (
  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
      <div style={{
        width: 8, height: 8, borderRadius: "50%",
        background: isLatest ? C.amber : C.border,
        marginTop: 4, flexShrink: 0,
      }} />
      {!isLast && (
        <div style={{ width: 1, flexGrow: 1, minHeight: 28, background: C.border, margin: "4px 0" }} />
      )}
    </div>
    <div style={{ paddingBottom: isLast ? 0 : 12 }}>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.ink }}>
        {EVENT_LABEL[event.type] ?? event.type}
      </p>
      <p style={{ margin: "2px 0", fontSize: 12, color: C.inkMid, lineHeight: 1.5 }}>
        {event.note}
      </p>
      <p style={{ margin: 0, fontSize: 11, color: C.inkFaint, fontFamily: "Geist Mono, monospace" }}>
        {event.actor ?? event.updatedBy} · {fmtDateTime(event.ts ?? event.createdAt)}
      </p>
    </div>
  </div>
);

/* ─── Line item ───────────────────────────────────────────────────────────── */
const LineItem = ({ item }) => {
  const name  = getItemName(item);
  const sku   = getItemSku(item);
  const qty   = item.quantity ?? item.qty ?? 0;
  const price = item.unitPrice ?? item.price ?? 0;
  const image = getItemImage(item);

  return (
    <div style={{
      display: "flex", gap: 10, alignItems: "flex-start",
      padding: "10px 12px", background: C.bg,
      borderRadius: 8, border: `1px solid ${C.border}`,
      marginBottom: 6,
    }}>
      {/* Product image */}
      {image ? (
        <img
          src={image} alt={name}
          style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover", flexShrink: 0, background: C.border }}
          onError={e => e.currentTarget.style.display = "none"}
        />
      ) : (
        <div style={{ width: 44, height: 44, borderRadius: 6, background: C.border, flexShrink: 0 }} />
      )}

      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {name}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: C.inkFaint, fontFamily: "Geist Mono, monospace" }}>
          SKU: {sku} · Qty {qty} × {fmt(price)}
        </p>
      </div>

      <span style={{ fontSize: 13, fontWeight: 700, color: C.ink, whiteSpace: "nowrap" }}>
        {fmt(qty * price)}
      </span>
    </div>
  );
};

/* ─── Refund card ─────────────────────────────────────────────────────────── */
const RefundCard = ({ refund }) => (
  <div style={{
    padding: "12px 14px", background: C.amberBg,
    borderRadius: 8, border: `1px solid ${C.amber}`, marginBottom: 6,
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.ink }}>
          {fmt(refund.amount)} <span style={{ fontWeight: 500, color: C.inkMid }}>via {refund.method}</span>
        </p>
        {refund.reason && (
          <p style={{ margin: "3px 0", fontSize: 12, color: C.inkMid }}>{refund.reason}</p>
        )}
        <p style={{ margin: 0, fontSize: 11, color: C.inkFaint, fontFamily: "Geist Mono, monospace" }}>
          {refund.processedBy ?? refund.actor} · {fmtDateTime(refund.ts ?? refund.createdAt)}
        </p>
      </div>
      <span style={{
        padding: "2px 8px", border: `1px solid ${C.border}`,
        borderRadius: 99, fontSize: 11, fontWeight: 700, color: C.ink, whiteSpace: "nowrap",
      }}>{refund.status}</span>
    </div>
  </div>
);

/* ─── Loading skeleton ────────────────────────────────────────────────────── */
const DrawerSkeleton = () => (
  <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 24 }}>
    {[1, 2, 3, 4].map(i => (
      <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Skeleton w={80} h={10} />
        <Skeleton w="100%" h={14} />
        <Skeleton w="65%" h={14} />
      </div>
    ))}
  </div>
);

/* ─── Main drawer ─────────────────────────────────────────────────────────── */
const OrderDrawer = ({ orderId, onClose, onUpdate }) => {
  const { order, loading, error } = useOrderDetail(orderId);

  const num       = order ? getOrderNum(order) : orderId;
  const name      = order ? getCustomerName(order) : "—";
  const email     = order ? getCustomerEmail(order) : "";
  const phone     = order ? getCustomerPhone(order) : "";
  const total     = order ? getTotal(order) : 0;
  const items     = order?.items ?? [];
  const events    = order?.events ?? order?.timeline ?? [];
  const refunds   = order?.refunds ?? [];
  const addr      = order?.shippingAddress ?? {};

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(26,17,2,0.35)", zIndex: 800 }}
        onClick={onClose}
      />

      {/* Panel */}
      <div style={{
        position: "fixed", right: 0, top: 0, bottom: 0,
        width: "min(540px,100vw)", background: C.white,
        zIndex: 900, display: "flex", flexDirection: "column", overflowY: "auto",
        boxShadow: "-12px 0 40px rgba(26,17,2,0.08)",
      }}>

        {/* Sticky header */}
        <div style={{
          padding: "22px 24px 16px", borderBottom: `1px solid ${C.border}`,
          position: "sticky", top: 0, background: C.white, zIndex: 1,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 800, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 1 }}>
                Order
              </p>
              <p style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 900, color: C.ink }}>
                {num}
              </p>
              {order && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <Badge cfg={FULFILLMENT[order.fulfillmentStatus ?? order.status]} />
                  <Badge cfg={PAYMENT[order.paymentStatus]} />
                </div>
              )}
            </div>
            <button onClick={onClose} style={{
              background: C.bg, border: "none", borderRadius: 6,
              width: 30, height: 30, cursor: "pointer", fontSize: 18, color: C.inkMid,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>×</button>
          </div>
          {order && (
            <p style={{ margin: "10px 0 0", fontSize: 12, color: C.inkFaint }}>
              Placed {fmtDateTime(order.createdAt)}
              {order.updatedAt && order.updatedAt !== order.createdAt && (
                <span> · Updated {fmtRelative(order.updatedAt)}</span>
              )}
            </p>
          )}
        </div>

        {/* Content */}
        {loading && <DrawerSkeleton />}

        {error && (
          <div style={{ padding: "24px" }}>
            <p style={{
              fontSize: 13, color: "#C0392B", background: "#FDF0EF",
              padding: "12px 14px", borderRadius: 8, border: "1px solid #F5C6C2",
            }}>{error}</p>
          </div>
        )}

        {!loading && !error && order && (
          <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 24, flex: 1 }}>

            {/* Customer */}
            <DrawerSection title="Customer">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={name} size={44} />
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: C.ink }}>{name}</p>
                  <p style={{ margin: "3px 0", fontSize: 12, color: C.inkMid }}>{email}</p>
                  <p style={{ margin: 0, fontSize: 12, color: C.inkMid }}>{phone}</p>
                </div>
              </div>
            </DrawerSection>

            {/* Shipping */}
            <DrawerSection title="Shipping Address">
              <p style={{ margin: 0, fontSize: 13, color: C.inkMid, lineHeight: 1.8 }}>
                <span style={{ fontWeight: 700, color: C.ink }}>{addr.fullName}</span><br />
                {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}<br />
                {addr.city}, {addr.state} · {addr.country}
              </p>
              {order.trackingNumber && (
                <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {order.carrier && (
                    <span style={{ padding: "4px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, color: C.inkMid, fontWeight: 600 }}>
                      {order.carrier}
                    </span>
                  )}
                  <span style={{ padding: "4px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, color: C.inkMid, fontFamily: "Geist Mono, monospace" }}>
                    {order.trackingNumber}
                  </span>
                </div>
              )}
            </DrawerSection>

            {/* Items */}
            <DrawerSection title={`Items · ${items.length}`}>
              {items.map((item, i) => (
                <LineItem key={item.id ?? item._id ?? i} item={item} />
              ))}
              <div style={{ paddingTop: 10, borderTop: `1px dashed ${C.border}` }}>
                {(order.discount ?? 0) > 0 && <KVRow label="Discount" value={`−${fmt(order.discount)}`} />}
                {(order.deliveryFee ?? 0) > 0 && <KVRow label="Delivery Fee" value={fmt(order.deliveryFee)} />}
                <KVRow label="Total" value={fmt(total)} bold />
              </div>
            </DrawerSection>

            {/* Refunds */}
            {refunds.length > 0 && (
              <DrawerSection title={`Refunds · ${refunds.length}`}>
                {refunds.map((r, i) => <RefundCard key={r.id ?? r._id ?? i} refund={r} />)}
              </DrawerSection>
            )}

            {/* Audit trail — uses 'timeline' (from OrderTracking) or 'events' */}
            {events.length > 0 && (
              <DrawerSection title="Audit Trail">
                {[...events].reverse().map((ev, i, arr) => (
                  <TimelineStep
                    key={i}
                    event={ev}
                    isLatest={i === 0}
                    isLast={i === arr.length - 1}
                  />
                ))}
              </DrawerSection>
            )}

          </div>
        )}

        {/* Sticky footer CTA */}
        {!loading && !error && order && (
          <div style={{
            padding: "16px 24px", borderTop: `1px solid ${C.border}`,
            position: "sticky", bottom: 0, background: C.white,
          }}>
            <button
              onClick={() => onUpdate(order)}
              style={{
                width: "100%", padding: 13, borderRadius: 9,
                border: "none", background: C.amber, color: C.ink,
                fontWeight: 800, fontSize: 14, cursor: "pointer",
              }}
            >Update Order</button>
          </div>
        )}
      </div>
    </>
  );
};

export default OrderDrawer;