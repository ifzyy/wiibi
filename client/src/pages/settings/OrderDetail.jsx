/**
 * pages/OrderDetail.jsx
 *
 * Tracking timeline is built from order.timeline (OrderTracking rows).
 * 4 visual steps: Order Confirmed → Processing → Out for Delivery → Delivered
 * Admin just pushes status forward in OMS — the timeline updates automatically.
 *
 * No Delivery table, no riders, no checkpoints needed.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Truck, Package, MapPin, Clock,
  CheckCircle, XCircle, AlertTriangle, RotateCcw,
} from 'lucide-react';
import {api} from '../../utils/api';
import { useAuth } from '../../context/AuthContext.jsx';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const fmt   = (n)   => '₦' + (n ?? 0).toLocaleString('en-NG');
const fmtD  = (iso) => !iso ? '—' : new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtDT = (iso) => !iso ? '' : new Date(iso).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/* ─── status configs ──────────────────────────────────────────────────────── */
const F_CFG = {
  pending:    { label: 'Pending',    color: '#B8A98A' },
  processing: { label: 'Processing', color: '#FFAA14' },
  shipped:    { label: 'Out for Delivery', color: '#6B6040' },
  in_transit: { label: 'In Transit', color: '#6B6040' },
  delivered:  { label: 'Delivered',  color: '#1A1102' },
  cancelled:  { label: 'Cancelled',  color: '#B8A98A' },
};
const P_CFG = {
  unpaid:             { label: 'Unpaid',         color: '#B8A98A' },
  paid:               { label: 'Paid',           color: '#1A1102' },
  partially_refunded: { label: 'Part. Refunded', color: '#FFAA14' },
  refunded:           { label: 'Refunded',       color: '#6B6040' },
};

/* ─── badge ───────────────────────────────────────────────────────────────── */
const Badge = ({ cfg }) => !cfg ? null : (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '3px 10px', borderRadius: 99,
    border: `1.5px solid ${cfg.color}`,
    color: cfg.color, fontSize: 11, fontWeight: 700, background: '#fff',
  }}>
    <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color }} />
    {cfg.label}
  </span>
);

/* ─── skeleton ────────────────────────────────────────────────────────────── */
const Skel = ({ w = '100%', h = 14, r = 6 }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: '#F0EDE8', animation: 'pulse 1.4s ease infinite' }} />
);

/* ─── build 4-step timeline from OrderTracking rows ──────────────────────── */
const buildTimeline = (order) => {
  const rows      = order?.timeline ?? [];
  const status    = order?.status   ?? 'pending';
  // LATEST matching row, not first — admins can post repeated shipment
  // updates at the same status ("Arrived Ibadan hub") and the newest one
  // is what the customer should see on the step.
  const find = (statuses) =>
    [...rows].reverse().find(r => statuses.includes(r.status));

  // Map order statuses to the 4 customer-facing steps
  const DONE_AT = {
    confirmed:   ['pending','processing','shipped','in_transit','delivered','cancelled'],
    processing:  ['processing','shipped','in_transit','delivered'],
    out_delivery:['shipped','in_transit','delivered'],
    delivered:   ['delivered'],
  };

  const row = (key, label, trackingStatuses, descFn) => {
    const trackingRow  = find(trackingStatuses);
    const done         = DONE_AT[key].includes(status);
    const isLatest     = trackingStatuses.includes(status);
    return {
      key, label, done, isLatest,
      time:     trackingRow?.createdAt ?? null,
      sublabel: done ? (trackingRow?.note ?? descFn()) : null,
    };
  };

  return [
    row('confirmed',   'Order Confirmed',   ['pending'],                () => 'Order placed successfully'),
    row('processing',  'Being Prepared',    ['processing'],             () => 'Your items are being packed'),
    row('out_delivery','Out for Delivery',  ['shipped', 'in_transit'],  () => 'On the way to you'),
    row('delivered',   'Delivered',         ['delivered'],              () => `Delivered to ${order?.shippingAddress?.city ?? 'your address'}`),
  ];
};

/* ─── Cancel Modal ────────────────────────────────────────────────────────── */
const CancelModal = ({ order, onClose, onSuccess }) => {
  const [reasons, setReasons]   = useState([]);
  const [reason,  setReason]    = useState('');
  const [details, setDetails]   = useState('');
  const [step,    setStep]      = useState('form');  // form | confirm | done
  const [loading, setLoading]   = useState(false);
  const [err,     setErr]       = useState(null);
  const alreadyPaid = order?.paymentStatus === 'paid';

  useEffect(() => {
    api.get('/orders/cancel-reasons')
      .then(r => setReasons(r.data?.data ?? r.data ?? []))
      .catch(() => setReasons(['Changed my mind','Ordered by mistake','Found a better price','Delivery time too long','Other']));
  }, []);

  const submit = async () => {
    if (!reason) { setErr('Please select a reason'); return; }
    setLoading(true); setErr(null);
    try {
      const res = await api.post(`/orders/${order.id}/cancel`, { reason, details });
      onSuccess(res.data?.data ?? res.data, res.data?.message);
    } catch (e) {
      setErr(e?.response?.data?.message ?? 'Cancellation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(26,17,2,0.5)', animation: 'fadeIn 0.15s ease' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
        style={{ maxHeight: '90vh', overflowY: 'auto', animation: 'slideUp 0.25s ease' }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Form ── */}
        {step === 'form' && (<>
          <div className="flex items-start justify-between p-6 pb-4 border-b border-[#F1F1F1]">
            <div>
              <h2 className="text-base font-black text-[#1A1102]">Cancel Order</h2>
              <p className="text-xs text-[#B8A98A] mt-0.5 font-mono">{order?.orderNumber}</p>
            </div>
            <button onClick={onClose} className="text-[#B8A98A] hover:text-[#1A1102] text-xl leading-none mt-0.5">×</button>
          </div>

          <div className="p-6 space-y-5">
            {/* Already paid warning */}
            {alreadyPaid && (
              <div className="flex gap-3 bg-[#FFF8E7] border border-[#FFAA14] rounded-xl p-4">
                <AlertTriangle size={15} className="text-[#FFAA14] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[#1A1102] mb-0.5">You have already paid for this order</p>
                  <p className="text-xs text-[#6B6040] leading-relaxed">
                    If cancelled, your full refund of <strong>{fmt(order?.totalAmount)}</strong> will be
                    processed within <strong>3–5 business days</strong> to your original payment method.
                    We'll notify you once it's been initiated.
                  </p>
                </div>
              </div>
            )}

            {/* Reason buttons */}
            <div>
              <p className="text-[10px] font-bold text-[#B8A98A] uppercase tracking-widest mb-2.5">
                Why are you cancelling? <span className="text-red-400">*</span>
              </p>
              <div className="space-y-2">
                {reasons.map(r => (
                  <button key={r} onClick={() => setReason(r)} className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all" style={{
                    border:      reason === r ? '2px solid #FFAA14' : '1.5px solid #F1F1F1',
                    background:  reason === r ? '#FFF8E7' : '#F9F9F9',
                    color:       reason === r ? '#1A1102'  : '#6B6040',
                    fontWeight:  reason === r ? 700 : 500,
                  }}>{r}</button>
                ))}
              </div>
            </div>

            {/* Details */}
            <div>
              <p className="text-[10px] font-bold text-[#B8A98A] uppercase tracking-widest mb-2">
                Additional details <span className="font-normal normal-case">(optional)</span>
              </p>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Help us improve — any other details?"
                rows={3}
                className="w-full rounded-xl border border-[#F1F1F1] bg-[#F9F9F9] px-4 py-3 text-sm text-[#1A1102] placeholder:text-[#B8A98A] resize-none focus:outline-none focus:border-[#FFAA14]"
              />
            </div>

            {err && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>}
          </div>

          <div className="flex gap-3 px-6 pb-6">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[#F1F1F1] bg-[#F9F9F9] text-[#6B6040] font-bold text-sm">
              Keep Order
            </button>
            <button
              onClick={() => { if (!reason) { setErr('Please select a reason'); return; } setStep('confirm'); }}
              disabled={!reason}
              className="flex-1 py-3 rounded-xl bg-[#1A1102] text-white font-black text-sm disabled:opacity-40"
            >
              Continue →
            </button>
          </div>
        </>)}

        {/* ── Confirm ── */}
        {step === 'confirm' && (<>
          <div className="flex items-center justify-between p-6 pb-4 border-b border-[#F1F1F1]">
            <h2 className="text-base font-black text-[#1A1102]">Confirm Cancellation</h2>
            <button onClick={onClose} className="text-[#B8A98A] hover:text-[#1A1102] text-xl leading-none">×</button>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-[#F9F9F9] rounded-xl p-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[#B8A98A]">Order</span>
                <span className="font-bold font-mono text-xs">{order?.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#B8A98A]">Reason</span>
                <span className="font-semibold text-right max-w-[60%]">{reason}</span>
              </div>
              {alreadyPaid && (
                <div className="flex justify-between pt-2 border-t border-[#F1F1F1]">
                  <span className="text-[#B8A98A]">Refund amount</span>
                  <span className="font-bold text-[#FFAA14]">{fmt(order?.totalAmount)}</span>
                </div>
              )}
            </div>

            {alreadyPaid && (
              <div className="bg-[#FFF8E7] border border-[#FFAA14] rounded-xl p-4 text-xs text-[#6B6040] leading-relaxed">
                <strong className="text-[#1A1102]">About your refund:</strong> We'll process it within
                3–5 business days. You'll get an email once it's been initiated. If you don't hear from
                us within <strong>48 hours</strong>, reach out to our support team.
              </div>
            )}

            {err && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>}
          </div>

          <div className="flex gap-3 px-6 pb-6">
            <button onClick={() => setStep('form')} className="flex-1 py-3 rounded-xl border border-[#F1F1F1] bg-[#F9F9F9] text-[#6B6040] font-bold text-sm">
              ← Back
            </button>
            <button
              onClick={submit}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-red-500 text-white font-black text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Cancelling…</>
                : <><XCircle size={14} /> Cancel Order</>
              }
            </button>
          </div>
        </>)}

      </div>
    </div>
  );
};

/* ─── Return request modal ──────────────────────────────────────────────────
 * Delivered orders can request a return. This creates a `refund_request`
 * support ticket (attached to the order) — the admin reviews it in the Support
 * desk and processes the actual return/refund. On success we drop the customer
 * straight into the ticket thread so they can add photos/details and track it.
 */
const RETURN_REASONS = [
  'Defective / damaged item',
  'Wrong item delivered',
  'Item not as described',
  'Missing items or parts',
  'Changed my mind',
  'Other',
];

const ReturnModal = ({ order, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reason,  setReason]  = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState(null);

  const email = user?.email || order?.guestEmail || order?.shippingAddress?.email || null;

  const submit = async () => {
    if (!reason) { setErr('Please select a reason'); return; }
    if (!email)  { setErr('We could not find an email on your account. Please use the Contact Support page instead.'); return; }
    setLoading(true); setErr(null);
    try {
      const body =
        `Return request for order ${order.orderNumber}\n` +
        `Reason: ${reason}` +
        (details.trim() ? `\n\nDetails: ${details.trim()}` : '');

      const res = await api.post('/support/tickets', {
        requesterEmail: email,
        requesterName:  order?.shippingAddress?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || null,
        requesterPhone: order?.shippingAddress?.phone || null,
        orderId:        order.id,
        type:           'refund_request',
        subject:        `Return request — order ${order.orderNumber}`,
        body,
      });
      const ticketNumber = res.data?.data?.ticketNumber ?? res.data?.ticketNumber;
      if (ticketNumber) navigate(`/account/support/${ticketNumber}`);
      else onClose();
    } catch (e) {
      setErr(e?.response?.data?.message ?? 'Could not submit your return request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(26,17,2,0.5)', animation: 'fadeIn 0.15s ease' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
        style={{ maxHeight: '90vh', overflowY: 'auto', animation: 'slideUp 0.25s ease' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-6 pb-4 border-b border-[#F1F1F1]">
          <div>
            <h2 className="text-base font-black text-[#1A1102]">Request a Return</h2>
            <p className="text-xs text-[#B8A98A] mt-0.5 font-mono">{order?.orderNumber}</p>
          </div>
          <button onClick={onClose} className="text-[#B8A98A] hover:text-[#1A1102] text-xl leading-none mt-0.5">×</button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-xs text-[#6B6040] leading-relaxed bg-[#F9F9F9] rounded-xl p-3.5">
            Tell us what's wrong and we'll open a conversation with our support team.
            They'll confirm the return and arrange your refund from there.
          </p>

          <div>
            <p className="text-[10px] font-bold text-[#B8A98A] uppercase tracking-widest mb-2.5">
              Reason for return <span className="text-red-400">*</span>
            </p>
            <div className="space-y-2">
              {RETURN_REASONS.map(r => (
                <button key={r} onClick={() => setReason(r)} className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all" style={{
                  border:     reason === r ? '2px solid #FFAA14' : '1.5px solid #F1F1F1',
                  background: reason === r ? '#FFF8E7' : '#F9F9F9',
                  color:      reason === r ? '#1A1102' : '#6B6040',
                  fontWeight: reason === r ? 700 : 500,
                }}>{r}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-[#B8A98A] uppercase tracking-widest mb-2">
              Details <span className="font-normal normal-case">(optional)</span>
            </p>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Describe the issue — which item, what's wrong, etc."
              rows={3}
              className="w-full rounded-xl border border-[#F1F1F1] bg-[#F9F9F9] px-4 py-3 text-sm text-[#1A1102] placeholder:text-[#B8A98A] resize-none focus:outline-none focus:border-[#FFAA14]"
            />
          </div>

          {err && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[#F1F1F1] bg-[#F9F9F9] text-[#6B6040] font-bold text-sm">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading || !reason}
            className="flex-1 py-3 rounded-xl bg-[#1A1102] text-white font-black text-sm disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
              : <><RotateCcw size={14} /> Request Return</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main ────────────────────────────────────────────────────────────────── */
const OrderDetail = () => {
  const { orderId }     = useParams();
  const navigate        = useNavigate();
  const [params]        = useSearchParams();

  const [order,      setOrder]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [showCancel, setShowCancel] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [cancelMsg,  setCancelMsg]  = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // PAYMENT SAFETY: the success banner must reflect the BACKEND-confirmed
  // payment state, never the URL. `?payment=success` only decides whether the
  // user just came from checkout and should see the celebratory banner — the
  // source of truth is order.paymentStatus, fetched from the server below.
  // Without this, anyone could append ?payment=success to an unpaid order and
  // see a fake "Payment confirmed" message.
  const cameFromCheckout = params.get('payment') === 'success';
  const paymentOk =
    cameFromCheckout && !bannerDismissed && order?.paymentStatus === 'paid';
  // Just placed a Pay-on-Delivery order
  const codPlaced =
    params.get('placed') === 'cod' && !bannerDismissed && order?.paymentMethod === 'on_delivery';

  const load = useCallback(() => {
    if (!orderId) return;
    setLoading(true); setError(null);
    api.get(`/orders/my/${orderId}`)
      .then(r => setOrder(r.data?.data ?? r.data))
      .catch(e => setError(e?.response?.data?.message ?? 'Could not load order.'))
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  const handleCancelSuccess = (updatedOrder, msg) => {
    setOrder(updatedOrder);
    setShowCancel(false);
    setCancelMsg(msg ?? 'Order cancelled successfully.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── derived ──────────────────────────────────────────────────────────────── */
  const fCfg     = F_CFG[order?.status];
  const pCfg     = P_CFG[order?.paymentStatus];
  const items    = order?.items ?? [];
  const subtotal = order?.subtotal ?? items.reduce((s, it) => s + ((it.unitPrice ?? 0) * (it.quantity ?? 0)), 0);
  const fee      = order?.deliveryFee ?? order?.shippingFee ?? 0;
  const total    = order?.totalAmount ?? order?.total ?? subtotal + fee;
  const ordNum   = order?.orderNumber ?? orderId;
  const timeline = order ? buildTimeline(order) : [];
  const canCancel = ['pending', 'processing'].includes(order?.status);
  const canReturn = order?.status === 'delivered';
  const isCancelled = order?.status === 'cancelled';

  /* ── loading ─────────────────────────────────────────────────────────────── */
  if (loading) return (
    <div className="max-w-5xl mx-auto p-8 bg-white min-h-screen">
      <Skel w={60} h={12} r={6} />
      <div style={{ height: 24 }} />
      <Skel w={200} h={28} r={6} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mt-10">
        <div className="space-y-8">{[1,2,3,4].map(i => <div key={i} className="flex gap-4"><div style={{width:16,height:16,borderRadius:'50%',background:'#F0EDE8',flexShrink:0,marginTop:4}}/><div className="flex-1 space-y-2"><Skel w="55%"/><Skel w="35%" h={11}/></div></div>)}</div>
        <div className="space-y-5">{[1,2,3].map(i => <div key={i} className="flex gap-4 pb-5"><Skel w={80} h={64} r={8}/><div className="flex-1 space-y-2"><Skel w="65%"/><Skel w="40%" h={11}/></div></div>)}</div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
    </div>
  );

  /* ── error ───────────────────────────────────────────────────────────────── */
  if (error) return (
    <div className="max-w-5xl mx-auto p-8 bg-white min-h-screen">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#B8A98A] hover:text-[#1A1102] text-sm mb-8"><ArrowLeft size={16}/> Back</button>
      <div className="mt-24 text-center">
        <p className="text-sm text-red-400 mb-4">{error}</p>
        <button onClick={load} className="px-5 py-2.5 rounded-xl bg-[#FFAA14] text-[#1A1102] font-bold text-sm">Retry</button>
      </div>
    </div>
  );

  /* ── main ────────────────────────────────────────────────────────────────── */
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 lg:px-8 bg-white min-h-screen text-[#1A1102]">
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* Back */}
      <button onClick={() => navigate("/account/orders")} className="flex items-center gap-2 text-[#B8A98A] hover:text-[#1A1102] text-sm mb-6 transition-colors">
        <ArrowLeft size={16}/> Back to orders
      </button>

      {/* Payment success banner */}
      {paymentOk && (
        <div className="flex items-center justify-between gap-3 bg-[#F0FBF5] border border-green-200 rounded-xl px-4 py-3 mb-6">
          <div className="flex items-center gap-2">
            <CheckCircle size={15} className="text-green-500 shrink-0"/>
            <p className="text-sm font-semibold text-green-800">Payment confirmed — your order is being prepared.</p>
          </div>
          <button onClick={() => setBannerDismissed(true)} className="text-green-400 hover:text-green-600 text-lg leading-none shrink-0">×</button>
        </div>
      )}

      {/* Pay-on-delivery confirmation banner */}
      {codPlaced && !paymentOk && (
        <div className="flex items-center justify-between gap-3 bg-[#FFF8E7] border border-[#FFAA14] rounded-xl px-4 py-3 mb-6">
          <div className="flex items-center gap-2">
            <CheckCircle size={15} className="text-[#FFAA14] shrink-0"/>
            <p className="text-sm font-semibold text-[#7A5A12]">
              Order confirmed! Pay <strong>{fmt(order?.totalAmount)}</strong> to our delivery agent on arrival.
            </p>
          </div>
          <button onClick={() => setBannerDismissed(true)} className="text-[#C9A227] hover:text-[#7A5A12] text-lg leading-none shrink-0">×</button>
        </div>
      )}

      {/* Cancellation success message */}
      {cancelMsg && (
        <div className="flex items-start gap-2.5 bg-[#F9F9F9] border border-[#F1F1F1] rounded-xl px-4 py-3 mb-6">
          <CheckCircle size={15} className="text-[#FFAA14] shrink-0 mt-0.5"/>
          <p className="text-sm text-[#6B6040]">{cancelMsg}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap justify-between items-end pb-6 border-b border-[#F1F1F1] mb-8 gap-4">
        <div>
          <p className="text-[10px] font-bold text-[#B8A98A] uppercase tracking-widest mb-1">Order</p>
          <h1 className="text-2xl font-bold tracking-tight">{ordNum}</h1>
        </div>
        <div className="flex flex-wrap gap-5 items-end">
          <div className="flex gap-2">
            {fCfg && <Badge cfg={fCfg}/>}
            {pCfg && <Badge cfg={pCfg}/>}
          </div>
          <div className="flex gap-5">
            <div className="text-right">
              <p className="text-[10px] text-[#B8A98A] font-bold uppercase tracking-wide mb-1 flex items-center justify-end gap-1"><Clock size={10}/> Placed</p>
              <p className="text-sm font-bold">{fmtD(order?.createdAt)}</p>
            </div>
            {order?.status !== 'cancelled' && (
              <div className="text-right">
                <p className="text-[10px] text-[#B8A98A] font-bold uppercase tracking-wide mb-1 flex items-center justify-end gap-1">
                  <Truck size={10} style={{color:'#FFAA14'}}/> Expected
                </p>
                <p className="text-sm font-bold">
                  {order?.expectedDelivery
                    ? fmtD(order.expectedDelivery)
                    : <span className="text-[#B8A98A] font-normal text-xs">TBD</span>
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tracking number pill */}
      {order?.trackingNumber && (
        <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#F1F1F1] bg-[#F9F9F9] text-xs font-semibold text-[#6B6040]">
          <Truck size={13} style={{color:'#FFAA14'}}/>
          <span className="font-mono">{order.trackingNumber}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

        {/* ── Left: Timeline ─────────────────────────────────────────────── */}
        <div>
          <h3 className="bg-[#F9F9F9] px-4 py-3 rounded-lg text-sm font-bold mb-8 text-[#1A1102]">
            Tracking Order
          </h3>

          {!isCancelled && (
            <div className="relative ml-2">
              {/* vertical dashed line */}
              <div className="absolute left-[7px] top-3 bottom-3 border-l-2 border-dashed border-[#F1F1F1]"/>

              <div className="space-y-9">
                {timeline.map(step => (
                  <div key={step.key} className="relative flex items-start gap-5" style={{ opacity: step.done ? 1 : 0.35 }}>
                    <div className="relative z-10 flex-shrink-0 mt-0.5">
                      {step.done
                        ? <div className="w-4 h-4 rounded-full ring-4 ring-[#FFF8E7]" style={{background:'#FFAA14'}}/>
                        : <div className="w-4 h-4 rounded-full border-2 border-[#F1F1F1] bg-white"/>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <p className="text-sm font-bold" style={{color: step.done ? '#1A1102' : '#9CA3AF'}}>
                          {step.label}
                        </p>
                        {step.isLatest && step.done && order?.status !== 'delivered' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF8E7] text-[#FFAA14]">
                            Current
                          </span>
                        )}
                        {step.time && step.done && (
                          <p className="text-[11px] text-[#B8A98A] font-medium">{fmtDT(step.time)}</p>
                        )}
                      </div>
                      {step.sublabel && step.done && (
                        <p className="text-xs text-[#B8A98A] mt-0.5 flex items-center gap-1">
                          <MapPin size={10}/>{step.sublabel}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full update history — every admin-posted shipment update */}
          {!isCancelled && (order?.timeline?.length ?? 0) > 1 && (
            <details className="mt-8">
              <summary className="text-xs font-bold text-[#B8A98A] cursor-pointer select-none hover:text-[#1A1102] transition-colors">
                View all updates ({order.timeline.length})
              </summary>
              <div className="mt-4 space-y-3 pl-1">
                {[...order.timeline].reverse().map((t) => (
                  <div key={t.id ?? t.createdAt} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA14] mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-[#1A1102] font-medium leading-relaxed">{t.note}</p>
                      <p className="text-[10px] text-[#B8A98A] mt-0.5">{fmtDT(t.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Cancelled state */}
          {isCancelled && (
            <div className="p-4 rounded-xl border border-[#F1F1F1] bg-[#F9F9F9]">
              <div className="flex items-center gap-2 mb-1.5">
                <XCircle size={14} className="text-[#B8A98A]"/>
                <p className="text-xs font-bold text-[#6B6040] uppercase tracking-wide">Order Cancelled</p>
              </div>
              {(() => {
                const cancelRow = [...(order?.timeline ?? [])].reverse().find(t => t.status === 'cancelled');
                return cancelRow?.note
                  ? <p className="text-xs text-[#B8A98A] leading-relaxed">{cancelRow.note}</p>
                  : null;
              })()}
            </div>
          )}

          {/* Refunds */}
          {order?.refunds?.length > 0 && (
            <div className="mt-5 p-4 rounded-xl border border-[#FFAA14] bg-[#FFF8E7]">
              <p className="text-[10px] font-bold text-[#1A1102] uppercase tracking-widest mb-3">Refund</p>
              {order.refunds.map((r, i) => (
                <div key={i} className="text-xs space-y-0.5">
                  <p className="font-bold text-[#1A1102]">
                    {fmt(r.amount)} <span className="font-normal text-[#6B6040]">via {r.method}</span>
                  </p>
                  {r.reason && <p className="text-[#B8A98A]">{r.reason}</p>}
                  <p className="text-[#B8A98A] font-mono">{fmtDT(r.createdAt)}</p>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                    style={{ background: r.status === 'completed' ? '#F0FBF5' : '#FFF8E7', color: r.status === 'completed' ? '#16a34a' : '#FFAA14' }}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Cancel CTA */}
          {canCancel && !cancelMsg && (
            <button
              onClick={() => setShowCancel(true)}
              className="mt-8 w-full py-3 rounded-xl border border-[#F1F1F1] text-sm font-semibold text-[#B8A98A] hover:border-red-200 hover:text-red-400 hover:bg-red-50 transition-all"
            >
              Cancel this order
            </button>
          )}

          {/* Return CTA — delivered orders */}
          {canReturn && (
            <button
              onClick={() => setShowReturn(true)}
              className="mt-8 w-full py-3 rounded-xl border border-[#F1F1F1] text-sm font-semibold text-[#6B6040] hover:border-[#FFAA14] hover:text-[#1A1102] hover:bg-[#FFF8E7] transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={15} /> Request a return
            </button>
          )}
        </div>

        {/* ── Right: Items + Summary ──────────────────────────────────────── */}
        <div>
          <h3 className="bg-[#F9F9F9] px-4 py-3 rounded-lg text-sm font-bold mb-5 text-[#1A1102]">
            Order Items
          </h3>

          <div className="space-y-4">
            {items.map((item, i) => {
              const name  = item.productName ?? item.product?.name ?? '—';
              const image = item.productImageUrl ?? item.product?.featured_image_url ?? null;
              const qty   = item.quantity ?? 0;
              const price = item.unitPrice ?? 0;
              const slug  = item.productSlug ?? item.product?.slug ?? null;

              return (
                <div
                  key={item.id ?? i}
                  onClick={() => slug && navigate(`/store/${slug}`)}
                  className="flex gap-4 pb-4 border-b border-[#F9F9F9] last:border-0 group"
                  style={{ cursor: slug ? 'pointer' : 'default' }}
                >
                  {image
                    ? <img src={image} alt={name} className="w-20 h-16 object-cover rounded-lg shrink-0 bg-[#F9F9F9] group-hover:opacity-90 transition-opacity" onError={e => e.currentTarget.style.display='none'}/>
                    : <div className="w-20 h-16 bg-[#F9F9F9] rounded-lg shrink-0 flex items-center justify-center"><Package size={20} className="text-[#E5E5E5]"/></div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <p className="text-sm font-semibold text-[#1A1102] leading-snug truncate group-hover:text-[#FFAA14] transition-colors">{name}</p>
                      <p className="text-sm font-bold shrink-0">{fmt(price)}</p>
                    </div>
                    {qty > 1 && <p className="text-xs text-[#B8A98A] mt-0.5">Qty: {qty}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pricing summary */}
          <div className="mt-6 pt-5 border-t border-[#F1F1F1] space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-[#B8A98A]">Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</span>
              <span className="font-bold italic">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#B8A98A]">Delivery</span>
              {fee === 0
                ? <span className="font-bold text-[#FFAA14]">Free</span>
                : <span className="font-bold italic">{fmt(fee)}</span>
              }
            </div>
            {(order?.discount ?? 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#B8A98A]">Discount</span>
                <span className="font-bold italic text-[#FFAA14]">−{fmt(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t border-[#F1F1F1]">
              <span className="text-[#B8A98A] text-sm">Total</span>
              <span className="font-bold text-lg">{fmt(total)}</span>
            </div>
          </div>

          {/* Shipping address */}
          {order?.shippingAddress && (
            <div className="mt-5 pt-5 border-t border-[#F1F1F1]">
              <p className="text-[10px] font-bold text-[#B8A98A] uppercase tracking-widest mb-3">Shipping To</p>
              <div className="flex items-start gap-2">
                <MapPin size={13} className="mt-0.5 shrink-0" style={{color:'#FFAA14'}}/>
                <p className="text-sm text-[#6B6040] leading-relaxed">
                  <span className="font-semibold text-[#1A1102]">{order.shippingAddress.fullName}</span><br/>
                  {order.shippingAddress.addressLine1}
                  {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}<br/>
                  {order.shippingAddress.city}, {order.shippingAddress.state}
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {showCancel && (
        <CancelModal
          order={order}
          onClose={() => setShowCancel(false)}
          onSuccess={handleCancelSuccess}
        />
      )}

      {showReturn && (
        <ReturnModal
          order={order}
          onClose={() => setShowReturn(false)}
        />
      )}
    </div>
  );
};

export default OrderDetail;