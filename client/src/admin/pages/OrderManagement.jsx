/**
 * OMS.jsx — Admin Order Management System
 * Wired to: GET /orders, GET /orders/:id, PATCH /orders/:id/status
 *
 * Drop api.js (from outputs) into src/services/api.js and update
 * VITE_API_URL in your .env file.
 */

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { fetchOrders, fetchOrder, updateOrderStatus } from "../utils/api.js";

const FontLink = () => (
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800;900&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet" />
);

/* ── Palette ──────────────────────────────────────────────────────────────── */
const C = {
  amber:    "#FFAA14",
  amberBg:  "#FFF8E7",
  bg:       "#F9F9F9",
  border:   "#F1F1F1",
  ink:      "#1A1102",
  inkMid:   "#6B6040",
  inkFaint: "#B8A98A",
  white:    "#FFFFFF",
};

/* ── Status configs ───────────────────────────────────────────────────────── */
const FULFILLMENT = {
  pending:    { label: "Pending",    ring: C.inkFaint },
  processing: { label: "Processing", ring: C.amber    },
  shipped:    { label: "Shipped",    ring: C.inkMid   },
  delivered:  { label: "Delivered",  ring: C.ink      },
  cancelled:  { label: "Cancelled",  ring: C.inkFaint },
  returned:   { label: "Returned",   ring: C.inkMid   },
};

const PAYMENT = {
  unpaid:             { label: "Unpaid",         ring: C.inkFaint },
  paid:               { label: "Paid",           ring: C.ink      },
  partially_refunded: { label: "Part. Refunded", ring: C.amber    },
  refunded:           { label: "Refunded",       ring: C.inkMid   },
};

const EVENT_LABEL = {
  order_placed:           "Order placed",
  payment_received:       "Payment received",
  status_changed:         "Status updated",
  shipped:                "Shipped",
  delivered:              "Delivered",
  cancellation_requested: "Cancel requested",
  cancelled:              "Order cancelled",
  refund_issued:          "Refund issued",
  return_requested:       "Return requested",
  returned:               "Items returned",
};

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const fmt   = (n)  => "₦" + (n ?? 0).toLocaleString("en-NG");
const fmtD  = (iso) => new Date(iso).toLocaleDateString ("en-NG", { day:"2-digit", month:"short", year:"numeric" });
const fmtDT = (iso) => new Date(iso).toLocaleString     ("en-NG", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" });

/* ── Shared UI components ─────────────────────────────────────────────────── */
const Badge = ({ cfg }) => (
  <span style={{
    display:"inline-flex", alignItems:"center", gap:5,
    padding:"3px 9px", borderRadius:99,
    border:`1.5px solid ${cfg?.ring ?? C.inkFaint}`,
    background:C.white,
    color: cfg?.ring ?? C.inkFaint,
    fontSize:11, fontWeight:700, whiteSpace:"nowrap",
  }}>
    <span style={{ width:5, height:5, borderRadius:"50%", background:cfg?.ring ?? C.inkFaint }} />
    {cfg?.label ?? "—"}
  </span>
);

const Avatar = ({ name = "?", size = 32 }) => {
  const shades = [C.amber, "#D48A0A", C.ink, "#4A3800", "#7A5C00"];
  const initials = name.split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase();
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%",
      background: shades[name.charCodeAt(0) % shades.length],
      color:"#fff", fontWeight:800, fontSize:size*0.36,
      display:"flex", alignItems:"center", justifyContent:"center",
      flexShrink:0, letterSpacing:-0.5,
    }}>{initials}</div>
  );
};

const Label = ({ children }) => (
  <p style={{ margin:"0 0 5px", fontSize:10, fontWeight:800, color:C.inkFaint, textTransform:"uppercase", letterSpacing:1 }}>{children}</p>
);

const iStyle = {
  width:"100%", padding:"9px 11px",
  border:`1px solid ${C.border}`, borderRadius:7,
  fontSize:13, outline:"none", boxSizing:"border-box",
  fontFamily:"Geist, sans-serif", color:C.ink, background:C.white,
};

const Inp = (props) => <input {...props} style={iStyle} />;

const Chip = ({ label, ring, selected, onClick }) => (
  <button onClick={onClick} style={{
    padding:"7px 10px", borderRadius:7, cursor:"pointer",
    border: selected ? `2px solid ${ring}` : `1.5px solid ${C.border}`,
    background: selected ? C.amberBg : C.bg,
    color: selected ? C.ink : C.inkMid,
    fontWeight: selected ? 700 : 500, fontSize:12,
    display:"flex", alignItems:"center", gap:6,
    fontFamily:"Geist, sans-serif", transition:"all 0.1s",
  }}>
    <span style={{ width:6, height:6, borderRadius:"50%", background: selected ? ring : C.border }} />
    {label}
  </button>
);

const IBtn = ({ children, onClick, title, accent, disabled }) => (
  <button onClick={onClick} title={title} disabled={disabled} style={{
    width:30, height:30, borderRadius:6,
    border: accent ? `1.5px solid ${C.amber}` : `1px solid ${C.border}`,
    background: accent ? C.amberBg : C.white,
    color: accent ? C.ink : C.inkMid,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    fontSize:13, display:"flex", alignItems:"center", justifyContent:"center",
    fontFamily:"Geist, sans-serif",
  }}>{children}</button>
);

/* ── Skeleton row ─────────────────────────────────────────────────────────── */
const Skeleton = ({ w = "100%", h = 14, r = 6 }) => (
  <div style={{ width:w, height:h, borderRadius:r, background:"#F0EDE8", animation:"pulse 1.4s ease infinite" }} />
);

/* ── Stat card ────────────────────────────────────────────────────────────── */
const Stat = ({ label, value, sub, primary, loading }) => (
  <div style={{
    background: primary ? C.ink : C.white,
    border: primary ? "none" : `1px solid ${C.border}`,
    borderRadius:10, padding:"18px 20px", flex:1, minWidth:140,
  }}>
    <p style={{ margin:0, fontSize:10, fontWeight:800, letterSpacing:1, textTransform:"uppercase", color:C.inkFaint }}>{label}</p>
    <div style={{ margin:"8px 0 4px" }}>
      {loading
        ? <Skeleton w={80} h={24} />
        : <p style={{ margin:0, fontSize:24, fontWeight:900, color: primary ? C.white : C.ink, letterSpacing:-0.5 }}>{value}</p>
      }
    </div>
    {sub && <p style={{ margin:0, fontSize:12, color: primary ? C.inkMid : C.inkFaint }}>{sub}</p>}
  </div>
);

/* ── Update Modal ─────────────────────────────────────────────────────────── */
const UpdateModal = ({ order, onClose, onSave }) => {
  const [fStatus,      setFStatus]      = useState(order.fulfillmentStatus ?? order.status);
  const [pStatus,      setPStatus]      = useState(order.paymentStatus);
  const [tracking,     setTracking]     = useState(order.trackingNumber ?? "");
  const [carrier,      setCarrier]      = useState(order.carrier ?? "");
  const [note,         setNote]         = useState("");
  const [refundAmt,    setRefundAmt]    = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundMethod, setRefundMethod] = useState("Paystack");
  const [saving,       setSaving]       = useState(false);
  const [err,          setErr]          = useState(null);

  const isNewRefund = (pStatus === "partially_refunded" || pStatus === "refunded")
    && order.paymentStatus === "paid";

  const handleSave = async () => {
    setSaving(true);
    setErr(null);
    try {
      await onSave({
        orderId:       order.id || order._id,
        fStatus,
        pStatus,
        note,
        tracking,
        carrier,
        refundAmt:     parseFloat(refundAmt) || 0,
        refundReason,
        refundMethod,
      });
      onClose();
    } catch (e) {
      setErr(e?.response?.data?.message ?? "Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(26,17,2,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16 }} onClick={onClose}>
      <div style={{ background:C.white, borderRadius:14, width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>

        <div style={{ padding:"20px 24px 18px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <p style={{ margin:0, fontSize:15, fontWeight:800, color:C.ink }}>Update Order</p>
            <p style={{ margin:"3px 0 0", fontSize:12, color:C.inkFaint, fontFamily:"Geist Mono, monospace" }}>{order.id || order._id}</p>
          </div>
          <button onClick={onClose} style={{ background:C.bg, border:"none", borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:16, color:C.inkMid, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
        </div>

        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:18 }}>
          <div>
            <Label>Fulfillment Status</Label>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
              {Object.entries(FULFILLMENT).map(([k,cfg]) => (
                <Chip key={k} label={cfg.label} ring={cfg.ring} selected={fStatus===k} onClick={()=>setFStatus(k)} />
              ))}
            </div>
          </div>

          <div>
            <Label>Payment Status</Label>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:6 }}>
              {Object.entries(PAYMENT).map(([k,cfg]) => (
                <Chip key={k} label={cfg.label} ring={cfg.ring} selected={pStatus===k} onClick={()=>setPStatus(k)} />
              ))}
            </div>
          </div>

          {["shipped","delivered"].includes(fStatus) && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div><Label>Carrier</Label><Inp value={carrier} onChange={e=>setCarrier(e.target.value)} placeholder="e.g. GIG Logistics" /></div>
              <div><Label>Tracking No.</Label><Inp value={tracking} onChange={e=>setTracking(e.target.value)} placeholder="GIG-NG-0001" /></div>
            </div>
          )}

          {isNewRefund && (
            <div style={{ background:C.amberBg, border:`1px solid ${C.amber}`, borderRadius:10, padding:"14px 16px" }}>
              <p style={{ margin:"0 0 12px", fontSize:11, fontWeight:800, color:C.ink, textTransform:"uppercase", letterSpacing:0.8 }}>Refund Details</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                <div>
                  <Label>Amount (₦)</Label>
                  <Inp type="number" value={refundAmt} onChange={e=>setRefundAmt(e.target.value)} placeholder={`Max ${(order.total??0).toLocaleString()}`} />
                </div>
                <div>
                  <Label>Method</Label>
                  <select value={refundMethod} onChange={e=>setRefundMethod(e.target.value)} style={iStyle}>
                    {["Paystack","Bank Transfer","Cash","Flutterwave","Credit Note"].map(m=><option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <Label>Reason</Label>
              <Inp value={refundReason} onChange={e=>setRefundReason(e.target.value)} placeholder="e.g. Customer cancellation, defective item…" />
            </div>
          )}

          <div>
            <Label>Admin Note</Label>
            <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Internal note for audit trail…" rows={3}
              style={{ ...iStyle, resize:"vertical", lineHeight:1.6 }} />
          </div>

          {err && (
            <p style={{ margin:0, fontSize:12, color:"#C0392B", padding:"8px 12px", background:"#FDF0EF", borderRadius:6, border:"1px solid #F5C6C2" }}>
              {err}
            </p>
          )}
        </div>

        <div style={{ height:1, background:C.border }} />
        <div style={{ padding:"14px 24px", display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} disabled={saving}
            style={{ padding:"9px 18px", borderRadius:8, border:`1px solid ${C.border}`, background:C.white, color:C.inkMid, fontWeight:600, cursor:"pointer", fontSize:13, fontFamily:"Geist, sans-serif" }}>
            Discard
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding:"9px 20px", borderRadius:8, border:"none", background:C.amber, color:C.ink, fontWeight:800, cursor: saving?"wait":"pointer", fontSize:13, fontFamily:"Geist, sans-serif", opacity: saving?0.7:1 }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Detail Drawer ────────────────────────────────────────────────────────── */
const Drawer = ({ orderId, onClose, onUpdate }) => {
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState(null);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    setErr(null);
    fetchOrder(orderId)
      .then(res => setOrder(res.data ?? res))
      .catch(e  => setErr(e?.response?.data?.message ?? "Failed to load order."))
      .finally(()=> setLoading(false));
  }, [orderId]);

  return (
    <>
      <div style={{ position:"fixed", inset:0, background:"rgba(26,17,2,0.35)", zIndex:800 }} onClick={onClose} />
      <div style={{ position:"fixed", right:0, top:0, bottom:0, width:"min(520px,100vw)", background:C.white, zIndex:900, display:"flex", flexDirection:"column", overflowY:"auto" }}>

        <div style={{ padding:"22px 24px 18px", borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, background:C.white, zIndex:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <p style={{ margin:"0 0 8px", fontSize:18, fontWeight:900, color:C.ink }}>{orderId}</p>
              {order && (
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  <Badge cfg={FULFILLMENT[order.fulfillmentStatus ?? order.status]} />
                  <Badge cfg={PAYMENT[order.paymentStatus]} />
                </div>
              )}
            </div>
            <button onClick={onClose} style={{ background:C.bg, border:"none", borderRadius:6, width:30, height:30, cursor:"pointer", fontSize:18, color:C.inkMid, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
          </div>
          {order && <p style={{ margin:"10px 0 0", fontSize:12, color:C.inkFaint }}>Created {fmtDT(order.createdAt)}</p>}
        </div>

        {loading && (
          <div style={{ padding:"24px", display:"flex", flexDirection:"column", gap:20 }}>
            {[1,2,3,4].map(i=>(
              <div key={i} style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <Skeleton w={80} h={10} />
                <Skeleton w="100%" h={14} />
                <Skeleton w="70%" h={14} />
              </div>
            ))}
          </div>
        )}

        {err && (
          <div style={{ padding:"24px" }}>
            <p style={{ fontSize:13, color:"#C0392B", background:"#FDF0EF", padding:"12px 14px", borderRadius:8, border:"1px solid #F5C6C2" }}>{err}</p>
          </div>
        )}

        {!loading && !err && order && (
          <div style={{ padding:"22px 24px", display:"flex", flexDirection:"column", gap:24, flex:1 }}>

            <DS title="Customer">
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <Avatar name={order.customer?.name ?? order.user?.name ?? "?"} size={44} />
                <div>
                  <p style={{ margin:0, fontWeight:700, fontSize:14, color:C.ink }}>{order.customer?.name ?? order.user?.name}</p>
                  <p style={{ margin:"3px 0", fontSize:12, color:C.inkMid }}>{order.customer?.email ?? order.user?.email}</p>
                  <p style={{ margin:0, fontSize:12, color:C.inkMid }}>{order.customer?.phone ?? order.shippingAddress?.phone ?? "—"}</p>
                </div>
              </div>
            </DS>

            <DS title="Shipping Address">
              <p style={{ margin:0, fontSize:13, color:C.inkMid, lineHeight:1.8 }}>
                <span style={{ fontWeight:700, color:C.ink }}>{order.shippingAddress?.fullName}</span><br />
                {order.shippingAddress?.addressLine1}{order.shippingAddress?.addressLine2 ? ", " + order.shippingAddress.addressLine2 : ""}<br />
                {order.shippingAddress?.city}, {order.shippingAddress?.state} · {order.shippingAddress?.country}
              </p>
              {order.trackingNumber && (
                <div style={{ marginTop:10, display:"flex", gap:8, flexWrap:"wrap" }}>
                  {order.carrier && <span style={{ padding:"4px 10px", border:`1px solid ${C.border}`, borderRadius:6, fontSize:12, color:C.inkMid, fontWeight:600 }}>{order.carrier}</span>}
                  <span style={{ padding:"4px 10px", border:`1px solid ${C.border}`, borderRadius:6, fontSize:12, color:C.inkMid, fontFamily:"Geist Mono, monospace" }}>{order.trackingNumber}</span>
                </div>
              )}
            </DS>

            <DS title={`Items · ${order.items?.length ?? 0}`}>
              {order.items?.map((item, i) => {
                // Support both { product: { name }, quantity, price } (DB shape)
                // and { name, qty, price } (flat shape)
                const name  = item.product?.name ?? item.name ?? "—";
                const sku   = item.product?.sku  ?? item.sku  ?? "—";
                const qty   = item.quantity ?? item.qty ?? 0;
                const price = item.unitPrice ?? item.price ?? 0;
                return (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"10px 12px", background:C.bg, borderRadius:8, border:`1px solid ${C.border}`, marginBottom:6 }}>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:0, fontSize:13, fontWeight:600, color:C.ink }}>{name}</p>
                      <p style={{ margin:"2px 0 0", fontSize:11, color:C.inkFaint, fontFamily:"Geist Mono, monospace" }}>SKU: {sku} · Qty {qty} × {fmt(price)}</p>
                    </div>
                    <span style={{ fontSize:13, fontWeight:700, color:C.ink, marginLeft:12, whiteSpace:"nowrap" }}>{fmt(qty * price)}</span>
                  </div>
                );
              })}
              <div style={{ paddingTop:10, borderTop:`1px dashed ${C.border}` }}>
                {(order.discount ?? 0) > 0 && <DR label="Discount" value={`−${fmt(order.discount)}`} />}
                <DR label="Total" value={fmt(order.total ?? order.totalAmount)} bold />
              </div>
            </DS>

            {order.refunds?.length > 0 && (
              <DS title="Refunds">
                {order.refunds.map(r => (
                  <div key={r.id ?? r._id} style={{ padding:"12px 14px", background:C.amberBg, borderRadius:8, border:`1px solid ${C.amber}`, marginBottom:6 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div>
                        <p style={{ margin:0, fontSize:13, fontWeight:700, color:C.ink }}>{fmt(r.amount)} · {r.method}</p>
                        <p style={{ margin:"3px 0", fontSize:12, color:C.inkMid }}>{r.reason}</p>
                        <p style={{ margin:0, fontSize:11, color:C.inkFaint, fontFamily:"Geist Mono, monospace" }}>{r.processedBy ?? r.actor} · {fmtDT(r.ts ?? r.createdAt)}</p>
                      </div>
                      <span style={{ padding:"2px 8px", border:`1px solid ${C.border}`, borderRadius:99, fontSize:11, fontWeight:700, color:C.ink }}>{r.status}</span>
                    </div>
                  </div>
                ))}
              </DS>
            )}

            {order.events?.length > 0 && (
              <DS title="Audit Trail">
                {[...order.events].reverse().map((ev, i, arr) => (
                  <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background: i===0 ? C.amber : C.border, marginTop:4 }} />
                      {i < arr.length-1 && <div style={{ width:1, flexGrow:1, minHeight:28, background:C.border, margin:"4px 0" }} />}
                    </div>
                    <div style={{ paddingBottom: i<arr.length-1 ? 12 : 0 }}>
                      <p style={{ margin:0, fontSize:12, fontWeight:700, color:C.ink }}>{EVENT_LABEL[ev.type] ?? ev.type}</p>
                      <p style={{ margin:"2px 0", fontSize:12, color:C.inkMid, lineHeight:1.5 }}>{ev.note}</p>
                      <p style={{ margin:0, fontSize:11, color:C.inkFaint, fontFamily:"Geist Mono, monospace" }}>{ev.actor} · {fmtDT(ev.ts ?? ev.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </DS>
            )}
          </div>
        )}

        {!loading && !err && order && (
          <div style={{ padding:"16px 24px", borderTop:`1px solid ${C.border}`, position:"sticky", bottom:0, background:C.white }}>
            <button onClick={()=>onUpdate(order)} style={{ width:"100%", padding:13, borderRadius:9, border:"none", background:C.amber, color:C.ink, fontWeight:800, fontSize:14, cursor:"pointer", fontFamily:"Geist, sans-serif" }}>
              Update Order
            </button>
          </div>
        )}
      </div>
    </>
  );
};

const DS = ({ title, children }) => <div><Label>{title}</Label>{children}</div>;
const DR = ({ label, value, bold }) => (
  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
    <span style={{ fontSize:13, color:C.inkMid }}>{label}</span>
    <span style={{ fontSize:13, fontWeight: bold?800:500, color:C.ink }}>{value}</span>
  </div>
);

/* ── Toast ────────────────────────────────────────────────────────────────── */
const Toast = ({ msg, type = "success" }) => (
  <div style={{
    position:"fixed", bottom:24, right:24, zIndex:9999,
    background: type === "error" ? "#2C0A0A" : C.ink,
    color:C.white, padding:"12px 18px", borderRadius:10,
    fontSize:13, fontWeight:600, fontFamily:"Geist, sans-serif",
    display:"flex", alignItems:"center", gap:8,
    boxShadow:"0 4px 20px rgba(0,0,0,0.25)",
  }}>
    <span style={{ color: type === "error" ? "#FF6B6B" : C.amber }}>
      {type === "error" ? "✕" : "✓"}
    </span>
    {msg}
  </div>
);

/* ── Main App ─────────────────────────────────────────────────────────────── */
export default function App() {
  // Data
  const [orders,     setOrders]     = useState([]);
  const [pagination, setPagination] = useState({ page:1, totalPages:1, total:0 });
  const [loading,    setLoading]    = useState(true);
  const [fetchErr,   setFetchErr]   = useState(null);

  // Filters (server-side for fulfillment, client-side for payment + search)
  const [fFilter,  setFFilter]  = useState("all");
  const [pFilter,  setPFilter]  = useState("all");
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [sortKey,  setSortKey]  = useState("date");
  const [sortDir,  setSortDir]  = useState("desc");

  // UI state
  const [selectedId, setSelectedId] = useState(null);
  const [updating,   setUpdating]   = useState(null);
  const [toast,      setToast]      = useState(null);

  const searchTimer = useRef(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(()=>setToast(null), 3200);
  };

  /* ── Fetch orders ─────────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    setFetchErr(null);
    try {
      const params = {
        page,
        limit: 20,
        ...(fFilter !== "all" && { status: fFilter }),
      };
      const res = await fetchOrders(params);
      // Support both { data: [...], pagination: {...} } and { orders: [...], pagination: {...} }
      const rows = res.data ?? res.orders ?? [];
      const pag  = res.pagination ?? { page:1, totalPages:1, total: rows.length };
      setOrders(rows);
      setPagination(pag);
    } catch (e) {
      setFetchErr(e?.response?.data?.message ?? "Failed to load orders. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [page, fFilter]);

  useEffect(() => { load(); }, [load]);

  /* ── Client-side filtering for payment + search ───────────────────────── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orders.filter(o => {
      const matchP = pFilter === "all" || o.paymentStatus === pFilter;
      const matchQ = !q
        || (o.id ?? o._id ?? "").toLowerCase().includes(q)
        || (o.customer?.name ?? o.user?.name ?? "").toLowerCase().includes(q)
        || (o.customer?.email ?? o.user?.email ?? "").toLowerCase().includes(q);
      return matchP && matchQ;
    });
  }, [orders, pFilter, search]);

  const sorted = useMemo(() => {
    const mul = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a,b) => {
      if (sortKey === "total")    return mul * ((a.total ?? 0) - (b.total ?? 0));
      if (sortKey === "customer") return mul * ((a.customer?.name ?? "").localeCompare(b.customer?.name ?? ""));
      return mul * (new Date(a.createdAt) - new Date(b.createdAt));
    });
  }, [filtered, sortKey, sortDir]);

  /* ── Stats derived from current page's orders ─────────────────────────── */
  const stats = useMemo(() => ({
    revenue:    orders.filter(o=>["paid","partially_refunded"].includes(o.paymentStatus)).reduce((s,o)=>s+(o.total??0),0),
    refunded:   orders.reduce((s,o)=>s+(o.refunds??[]).reduce((r,ref)=>r+(ref.amount??0),0),0),
    processing: orders.filter(o=>(o.fulfillmentStatus??o.status)==="processing").length,
    unpaid:     orders.filter(o=>o.paymentStatus==="unpaid").length,
    cancelled:  orders.filter(o=>(o.fulfillmentStatus??o.status)==="cancelled").length,
  }), [orders]);

  /* ── Save handler ─────────────────────────────────────────────────────── */
  const handleSave = async ({ orderId, fStatus, pStatus, note, tracking, carrier, refundAmt, refundReason, refundMethod }) => {
    const payload = {
      status:        fStatus,
      paymentStatus: pStatus,
      note:          note || undefined,
      trackingNumber:tracking || undefined,
      carrier:       carrier || undefined,
      ...(refundAmt > 0 && {
        refund: { amount: refundAmt, reason: refundReason || "Manual refund", method: refundMethod },
      }),
    };

    // Optimistic update in the table
    setOrders(prev => prev.map(o =>
      (o.id ?? o._id) === orderId
        ? { ...o, fulfillmentStatus: fStatus, status: fStatus, paymentStatus: pStatus, trackingNumber: tracking || o.trackingNumber, carrier: carrier || o.carrier, updatedAt: new Date().toISOString() }
        : o
    ));

    try {
      await updateOrderStatus(orderId, payload);
      showToast(`${orderId} updated`);
    } catch (e) {
      // Rollback optimistic update
      load();
      const msg = e?.response?.data?.message ?? "Update failed.";
      showToast(msg, "error");
      throw e; // Let modal catch it and show inline error
    }
  };

  /* ── Export CSV ───────────────────────────────────────────────────────── */
  const handleExport = () => {
    const headers = ["ID","Customer","Email","Total","Fulfillment","Payment","Date"];
    const rows    = sorted.map(o => [
      o.id ?? o._id,
      o.customer?.name ?? o.user?.name ?? "",
      o.customer?.email ?? o.user?.email ?? "",
      o.total ?? 0,
      o.fulfillmentStatus ?? o.status,
      o.paymentStatus,
      fmtD(o.createdAt),
    ]);
    const csv  = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type:"text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `orders-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  /* ── Sort toggle ──────────────────────────────────────────────────────── */
  const toggleSort = k => {
    if (sortKey===k) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortKey(k); setSortDir("desc"); }
  };
  const SI = ({ k }) => (
    <span style={{ color: sortKey===k ? C.amber : C.border, marginLeft:3 }}>
      {sortKey===k ? (sortDir==="asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  /* ── Tab data ─────────────────────────────────────────────────────────── */
  const fTabs = [
    { key:"all", label:"All", count: pagination.total || orders.length },
    ...Object.entries(FULFILLMENT).map(([k,v]) => ({
      key:k, label:v.label,
      count: orders.filter(o=>(o.fulfillmentStatus??o.status)===k).length,
    })),
  ];
  const pTabs = [{ key:"all", label:"All" }, ...Object.entries(PAYMENT).map(([k,v])=>({ key:k, label:v.label }))];

  const cols = "140px 1fr 120px 50px 110px 116px 120px 80px";

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"Geist, -apple-system, sans-serif", color:C.ink }}>
      <FontLink />
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div style={{ maxWidth:1300, margin:"0 auto", padding:"32px 24px 60px" }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
          <div>
            <p style={{ margin:"0 0 4px", fontSize:11, fontWeight:800, color:C.amber, textTransform:"uppercase", letterSpacing:1.2 }}>Order Management</p>
            <h1 style={{ margin:0, fontSize:26, fontWeight:900, color:C.ink, letterSpacing:-0.5 }}>All Orders</h1>
            <p style={{ margin:"4px 0 0", fontSize:13, color:C.inkFaint }}>
              {loading ? "Loading…" : `${pagination.total ?? orders.length} orders · updated just now`}
            </p>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={load} disabled={loading}
              style={{ padding:"9px 16px", borderRadius:8, border:`1px solid ${C.border}`, background:C.white, color:C.inkMid, fontWeight:600, cursor:"pointer", fontSize:13, fontFamily:"Geist, sans-serif", opacity: loading ? 0.6 : 1 }}>
              ↺ Refresh
            </button>
            <button onClick={handleExport} disabled={loading || sorted.length===0}
              style={{ padding:"9px 16px", borderRadius:8, border:`1px solid ${C.border}`, background:C.white, color:C.inkMid, fontWeight:600, cursor:"pointer", fontSize:13, fontFamily:"Geist, sans-serif" }}>
              ↓ Export
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap" }}>
          <Stat label="Gross Revenue"  value={fmt(stats.revenue)}  sub={`${pagination.total ?? orders.length} total orders`} primary loading={loading} />
          <Stat label="Total Refunded" value={fmt(stats.refunded)} sub={`${orders.filter(o=>(o.refunds??[]).length>0).length} orders`} loading={loading} />
          <Stat label="Processing"     value={stats.processing}    sub="Awaiting dispatch" loading={loading} />
          <Stat label="Unpaid"         value={stats.unpaid}        sub="Awaiting payment"  loading={loading} />
          <Stat label="Cancelled"      value={stats.cancelled}     sub="This period"       loading={loading} />
        </div>

        {/* Error banner */}
        {fetchErr && (
          <div style={{ padding:"12px 16px", marginBottom:16, background:"#FDF0EF", border:"1px solid #F5C6C2", borderRadius:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <p style={{ margin:0, fontSize:13, color:"#C0392B" }}>{fetchErr}</p>
            <button onClick={load} style={{ padding:"6px 14px", borderRadius:6, border:"none", background:"#C0392B", color:"#fff", fontWeight:700, cursor:"pointer", fontSize:12, fontFamily:"Geist, sans-serif" }}>Retry</button>
          </div>
        )}

        {/* Filter panel */}
        <div style={{ background:C.white, borderRadius:12, border:`1px solid ${C.border}`, marginBottom:12, overflow:"hidden" }}>
          <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, padding:"0 20px", overflowX:"auto" }}>
            {fTabs.map(t => {
              const a = fFilter===t.key;
              return (
                <button key={t.key} onClick={()=>{ setFFilter(t.key); setPage(1); }} style={{
                  padding:"13px 0", marginRight:20, border:"none", background:"none", cursor:"pointer",
                  fontSize:13, fontWeight: a?700:500, color: a?C.ink:C.inkFaint,
                  borderBottom: a?`2px solid ${C.amber}`:"2px solid transparent",
                  whiteSpace:"nowrap", fontFamily:"Geist, sans-serif",
                }}>
                  {t.label}
                  <span style={{ marginLeft:5, padding:"1px 6px", borderRadius:99, fontSize:11, background: a?C.amberBg:C.bg, color: a?C.ink:C.inkFaint, fontWeight:700 }}>{t.count}</span>
                </button>
              );
            })}
          </div>

          <div style={{ padding:"12px 20px", display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
            <div style={{ position:"relative", flex:1, minWidth:220 }}>
              <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:C.inkFaint, fontSize:13, pointerEvents:"none" }}>⌕</span>
              <input value={search}
                onChange={e => {
                  const v = e.target.value;
                  setSearch(v);
                  clearTimeout(searchTimer.current);
                  searchTimer.current = setTimeout(() => {}, 300);
                }}
                placeholder="Search order ID, customer, email…"
                style={{ ...iStyle, paddingLeft:30, background:C.bg }} />
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              <span style={{ fontSize:10, fontWeight:800, color:C.inkFaint, textTransform:"uppercase", letterSpacing:0.8, whiteSpace:"nowrap" }}>Payment</span>
              {pTabs.map(t => {
                const a = pFilter===t.key;
                return (
                  <button key={t.key} onClick={()=>setPFilter(t.key)} style={{
                    padding:"5px 11px", borderRadius:99, cursor:"pointer", fontFamily:"Geist, sans-serif",
                    border: a?`1.5px solid ${C.ink}`:`1.5px solid ${C.border}`,
                    background: a?C.ink:C.white, color: a?C.white:C.inkMid,
                    fontSize:11, fontWeight: a?700:500, whiteSpace:"nowrap",
                  }}>{t.label}</button>
                );
              })}
            </div>
            <span style={{ fontSize:12, color:C.inkFaint, marginLeft:"auto", whiteSpace:"nowrap" }}>
              {sorted.length} result{sorted.length!==1?"s":""}
            </span>
          </div>
        </div>

        {/* Table */}
        <div style={{ background:C.white, borderRadius:12, border:`1px solid ${C.border}`, overflow:"hidden" }}>
          {/* Head */}
          <div style={{ display:"grid", gridTemplateColumns:cols, padding:"10px 20px", background:C.bg, borderBottom:`1px solid ${C.border}` }}>
            {[
              { label:"Order ID",    k:null       },
              { label:"Customer",    k:"customer" },
              { label:"Total",       k:"total"    },
              { label:"Qty",         k:null       },
              { label:"Date",        k:"date"     },
              { label:"Fulfillment", k:null       },
              { label:"Payment",     k:null       },
              { label:"",            k:null       },
            ].map(col => (
              <span key={col.label} onClick={col.k?()=>toggleSort(col.k):undefined}
                style={{ fontSize:10, fontWeight:800, color:C.inkFaint, textTransform:"uppercase", letterSpacing:0.8, cursor:col.k?"pointer":"default", userSelect:"none" }}>
                {col.label}{col.k&&<SI k={col.k} />}
              </span>
            ))}
          </div>

          {/* Skeleton rows while loading */}
          {loading && [1,2,3,4,5].map(i => (
            <div key={i} style={{ display:"grid", gridTemplateColumns:cols, padding:"16px 20px", borderBottom:`1px solid ${C.border}`, alignItems:"center", gap:8 }}>
              <Skeleton w={90} />
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:30, height:30, borderRadius:"50%", background:"#F0EDE8" }} />
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  <Skeleton w={120} /><Skeleton w={90} h={11} />
                </div>
              </div>
              {[80,60,70,90,90].map((w,j)=><Skeleton key={j} w={w} />)}
              <Skeleton w={60} />
            </div>
          ))}

          {/* Empty state */}
          {!loading && sorted.length===0 && (
            <div style={{ padding:56, textAlign:"center" }}>
              <p style={{ margin:"0 0 8px", fontSize:13, color:C.inkFaint }}>
                {fetchErr ? "Could not load orders." : "No orders match your filters."}
              </p>
            </div>
          )}

          {/* Data rows */}
          {!loading && sorted.map((order, i) => {
            const id   = order.id ?? order._id;
            const name = order.customer?.name ?? order.user?.name ?? "—";
            const email= order.customer?.email ?? order.user?.email ?? "—";
            const qty  = (order.items ?? []).reduce((s,it)=>s+(it.quantity??it.qty??0),0);
            const fCfg = FULFILLMENT[order.fulfillmentStatus ?? order.status];
            const pCfg = PAYMENT[order.paymentStatus];
            return (
              <div key={id}
                onClick={()=>setSelectedId(id)}
                style={{ display:"grid", gridTemplateColumns:cols, padding:"13px 20px", borderBottom:i<sorted.length-1?`1px solid ${C.border}`:"none", alignItems:"center", cursor:"pointer", transition:"background 0.1s" }}
                onMouseEnter={e=>e.currentTarget.style.background=C.bg}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              >
                <span style={{ fontSize:12, fontWeight:700, color:C.amber, fontFamily:"Geist Mono, monospace" }}>{id}</span>

                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <Avatar name={name} size={30} />
                  <div>
                    <p style={{ margin:0, fontSize:13, fontWeight:600, color:C.ink }}>{name}</p>
                    <p style={{ margin:0, fontSize:11, color:C.inkFaint }}>{email}</p>
                  </div>
                </div>

                <span style={{ fontSize:13, fontWeight:700, color:C.ink }}>{fmt(order.total ?? order.totalAmount ?? 0)}</span>
                <span style={{ fontSize:12, color:C.inkMid }}>{qty}</span>
                <span style={{ fontSize:12, color:C.inkFaint }}>{fmtD(order.createdAt)}</span>

                <div onClick={e=>e.stopPropagation()}><Badge cfg={fCfg} /></div>
                <div onClick={e=>e.stopPropagation()}><Badge cfg={pCfg} /></div>

                <div style={{ display:"flex", gap:6 }} onClick={e=>e.stopPropagation()}>
                  <IBtn onClick={()=>setSelectedId(id)}  title="View">⊙</IBtn>
                  <IBtn onClick={()=>setUpdating(order)} title="Edit" accent>✎</IBtn>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:10, marginTop:20 }}>
            <IBtn onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} title="Previous">←</IBtn>
            <span style={{ fontSize:13, color:C.inkMid, fontWeight:600 }}>Page {page} of {pagination.totalPages}</span>
            <IBtn onClick={()=>setPage(p=>Math.min(pagination.totalPages,p+1))} disabled={page===pagination.totalPages} title="Next">→</IBtn>
          </div>
        )}

        <p style={{ textAlign:"center", marginTop:20, fontSize:12, color:C.inkFaint }}>
          {sorted.length} of {pagination.total ?? orders.length} orders · SolarBase OMS
        </p>
      </div>

      {selectedId && (
        <Drawer
          orderId={selectedId}
          onClose={()=>setSelectedId(null)}
          onUpdate={o=>{ setUpdating(o); }}
        />
      )}

      {updating && (
        <UpdateModal
          order={updating}
          onClose={()=>setUpdating(null)}
          onSave={handleSave}
        />
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        *{box-sizing:border-box;margin:0;padding:0;}
        body{margin:0;}
        input:focus,textarea:focus,select:focus{border-color:${C.amber}!important;outline:none;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px;}
      `}</style>
    </div>
  );
}