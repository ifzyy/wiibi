import { useState } from "react";
import { C, FULFILLMENT, PAYMENT, REFUND_METHODS } from "../constants.js";
import { fmt } from "../utils/format.js";
import { getOrderNum, isNewRefund } from "../utils/orderHelpers.js";
import { Chip, Inp, inputStyle, SectionLabel, Divider } from "./ui.jsx";

const UpdateModal = ({ order, onClose, onSave }) => {
  const [fStatus,      setFStatus]      = useState(order.fulfillmentStatus ?? order.status ?? "pending");
  const [pStatus,      setPStatus]      = useState(order.paymentStatus ?? "unpaid");
  const [tracking,     setTracking]     = useState(order.trackingNumber ?? "");
  const [carrier,      setCarrier]      = useState(order.carrier ?? "");
  const [note,         setNote]         = useState("");
  const [refundAmt,    setRefundAmt]    = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundMethod, setRefundMethod] = useState("Paystack");
  const [saving,       setSaving]       = useState(false);
  const [err,          setErr]          = useState(null);

  const showRefund = isNewRefund(order.paymentStatus, pStatus);
  const showTracking = ["shipped", "delivered"].includes(fStatus);
  const orderNum = getOrderNum(order);

  const handleSave = async () => {
    setSaving(true);
    setErr(null);
    try {
      await onSave({
        orderId:      order.id ?? order._id,
        fStatus,      pStatus,
        note,         tracking, carrier,
        refundAmt:    parseFloat(refundAmt) || 0,
        refundReason, refundMethod,
      });
      onClose();
    } catch (e) {
      setErr(e?.response?.data?.message ?? "Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(26,17,2,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: C.white, borderRadius: 14,
          width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: "20px 24px 18px", borderBottom: `1px solid ${C.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.ink }}>Update Order</p>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: C.inkFaint, fontFamily: "Geist Mono, monospace" }}>
              {orderNum}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: C.bg, border: "none", borderRadius: 6,
            width: 28, height: 28, cursor: "pointer", fontSize: 16, color: C.inkMid,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Fulfillment status */}
          <div>
            <SectionLabel>Fulfillment Status</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
              {Object.entries(FULFILLMENT).map(([k, cfg]) => (
                <Chip key={k} label={cfg.label} ring={cfg.ring} selected={fStatus === k} onClick={() => setFStatus(k)} />
              ))}
            </div>
          </div>

          {/* Payment status */}
          <div>
            <SectionLabel>Payment Status</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 6 }}>
              {Object.entries(PAYMENT).map(([k, cfg]) => (
                <Chip key={k} label={cfg.label} ring={cfg.ring} selected={pStatus === k} onClick={() => setPStatus(k)} />
              ))}
            </div>
          </div>

          {/* Tracking — only shown when shipping */}
          {showTracking && (
            <div>
              <SectionLabel>Shipment Details</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <p style={{ margin: "0 0 5px", fontSize: 11, color: C.inkFaint, fontWeight: 600 }}>Carrier</p>
                  <Inp value={carrier} onChange={e => setCarrier(e.target.value)} placeholder="e.g. GIG Logistics" />
                </div>
                <div>
                  <p style={{ margin: "0 0 5px", fontSize: 11, color: C.inkFaint, fontWeight: 600 }}>Tracking No.</p>
                  <Inp value={tracking} onChange={e => setTracking(e.target.value)} placeholder="GIG-NG-0001" />
                </div>
              </div>
            </div>
          )}

          {/* Refund block — only when switching paid → refunded */}
          {showRefund && (
            <div style={{
              background: C.amberBg, border: `1px solid ${C.amber}`,
              borderRadius: 10, padding: "16px 16px",
            }}>
              <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: 0.8 }}>
                Refund Details
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div>
                  <p style={{ margin: "0 0 5px", fontSize: 11, color: C.inkFaint, fontWeight: 600 }}>Amount (₦)</p>
                  <Inp
                    type="number"
                    value={refundAmt}
                    onChange={e => setRefundAmt(e.target.value)}
                    placeholder={`Max ${(getTotal(order)).toLocaleString()}`}
                  />
                </div>
                <div>
                  <p style={{ margin: "0 0 5px", fontSize: 11, color: C.inkFaint, fontWeight: 600 }}>Method</p>
                  <select value={refundMethod} onChange={e => setRefundMethod(e.target.value)} style={inputStyle}>
                    {REFUND_METHODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <p style={{ margin: "0 0 5px", fontSize: 11, color: C.inkFaint, fontWeight: 600 }}>Reason</p>
              <Inp
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                placeholder="e.g. Customer cancellation, defective item…"
              />
            </div>
          )}

          {/* Admin note */}
          <div>
            <SectionLabel>Admin Note</SectionLabel>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Internal note — visible in audit trail…"
              rows={3}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
            />
          </div>

          {/* Inline error */}
          {err && (
            <p style={{
              margin: 0, fontSize: 12, color: "#C0392B",
              padding: "8px 12px", background: "#FDF0EF",
              borderRadius: 6, border: "1px solid #F5C6C2",
            }}>{err}</p>
          )}
        </div>

        <Divider />
        <div style={{ padding: "14px 24px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: "9px 18px", borderRadius: 8,
              border: `1px solid ${C.border}`, background: C.white,
              color: C.inkMid, fontWeight: 600, cursor: "pointer", fontSize: 13,
            }}
          >Discard</button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "9px 22px", borderRadius: 8, border: "none",
              background: C.amber, color: C.ink,
              fontWeight: 800, cursor: saving ? "wait" : "pointer",
              fontSize: 13, opacity: saving ? 0.7 : 1,
            }}
          >{saving ? "Saving…" : "Save Changes"}</button>
        </div>
      </div>
    </div>
  );
};

export default UpdateModal;