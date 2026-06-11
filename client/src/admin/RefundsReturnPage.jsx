/**
 * pages/admin/RefundReturnsPage.jsx
 *
 * Standalone admin page for:
 *   Tab 1 — Return Requests  (return_requested + returned orders)
 *   Tab 2 — Manual Refunds   (refunds with status = manual_required)
 *
 * API endpoints used:
 *   GET  /api/returns                        → return requests
 *   POST /api/returns/:orderId/request       → create return request
 *   POST /api/returns/:orderId/confirm       → confirm receipt + trigger refund
 *   GET  /api/returns/manual-refunds         → manual refund queue
 *   POST /api/returns/refunds/:id/complete   → mark manual refund done
 *   POST /api/payment/refund                 → admin-initiated refund
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api.js';

/* ── Palette (matches OMS.jsx) ───────────────────────────────────────────── */
const C = {
  amber:    '#FFAA14',
  amberBg:  '#FFF8E7',
  bg:       '#F9F9F9',
  border:   '#F1F1F1',
  ink:      '#1A1102',
  inkMid:   '#6B6040',
  inkFaint: '#B8A98A',
  white:    '#FFFFFF',
  red:      '#C0392B',
  redBg:    '#FDF0EF',
  green:    '#1A6B3C',
  greenBg:  '#EAF5EF',
};

/* ── Shared micro-components ─────────────────────────────────────────────── */
const Label = ({ children }) => (
  <p style={{ margin: '0 0 5px', fontSize: 10, fontWeight: 800, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: 1 }}>
    {children}
  </p>
);

const iStyle = {
  width: '100%', padding: '9px 11px',
  border: `1px solid ${C.border}`, borderRadius: 7,
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
  fontFamily: 'Geist, sans-serif', color: C.ink, background: C.white,
};

const Btn = ({ children, onClick, disabled, variant = 'primary', small }) => {
  const base = {
    padding:     small ? '7px 14px' : '10px 20px',
    borderRadius: 8,
    border:      'none',
    fontWeight:  700,
    fontSize:    small ? 12 : 13,
    cursor:      disabled ? 'not-allowed' : 'pointer',
    opacity:     disabled ? 0.55 : 1,
    fontFamily:  'Geist, sans-serif',
    transition:  'opacity 0.15s',
    whiteSpace:  'nowrap',
  };
  const variants = {
    primary:   { background: C.amber,  color: C.ink      },
    secondary: { background: C.bg,     color: C.inkMid,  border: `1px solid ${C.border}` },
    danger:    { background: C.redBg,  color: C.red,     border: `1px solid #F5C6C2`     },
    success:   { background: C.greenBg, color: C.green,  border: `1px solid #B2DFCA`     },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
};

const Badge = ({ label, color, bg, border }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '3px 9px', borderRadius: 99,
    border: `1.5px solid ${border ?? color}`,
    background: bg ?? C.white, color,
    fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
  }}>
    <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
    {label}
  </span>
);

const StatusBadge = ({ status }) => {
  const map = {
    return_requested: { label: 'Return Requested', color: C.amber    },
    returned:         { label: 'Returned',          color: C.green    },
    manual_required:  { label: 'Manual Required',   color: C.red      },
    pending:          { label: 'Pending',            color: C.amber    },
    completed:        { label: 'Completed',          color: C.green    },
    failed:           { label: 'Failed',             color: C.red      },
  };
  const cfg = map[status] ?? { label: status, color: C.inkFaint };
  return <Badge label={cfg.label} color={cfg.color} />;
};

const Skeleton = ({ w = '100%', h = 14 }) => (
  <div style={{ width: w, height: h, borderRadius: 6, background: '#F0EDE8', animation: 'pulse 1.4s ease infinite' }} />
);

const fmt   = (n)   => '₦' + (n ?? 0).toLocaleString('en-NG');
const fmtDT = (iso) => new Date(iso).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/* ── Toast ────────────────────────────────────────────────────────────────── */
const Toast = ({ msg, type = 'success', onDismiss }) => (
  <div onClick={onDismiss} style={{
    position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
    background: type === 'error' ? '#2C0A0A' : C.ink,
    color: C.white, padding: '12px 18px', borderRadius: 10,
    fontSize: 13, fontWeight: 600, fontFamily: 'Geist, sans-serif',
    display: 'flex', alignItems: 'center', gap: 8,
    boxShadow: '0 4px 20px rgba(0,0,0,0.25)', cursor: 'pointer',
  }}>
    <span style={{ color: type === 'error' ? '#FF6B6B' : C.amber }}>
      {type === 'error' ? '✕' : '✓'}
    </span>
    {msg}
  </div>
);

/* ── Return Request Modal ─────────────────────────────────────────────────── */
const RequestReturnModal = ({ order, onClose, onSuccess }) => {
  const [reason,  setReason]  = useState('');
  const [notes,   setNotes]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState(null);

  const REASONS = [
    'Defective / damaged item',
    'Wrong item delivered',
    'Item not as described',
    'Customer changed mind',
    'Duplicate order',
    'Other',
  ];

  const handleSubmit = async () => {
    if (!reason) { setErr('Please select a reason'); return; }
    setSaving(true); setErr(null);
    try {
      await api.post(`/returns/${order.id}/request`, { reason, notes: notes || undefined });
      onSuccess('Return request created');
      onClose();
    } catch (e) {
      setErr(e?.response?.data?.message ?? 'Failed to create return request');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <ModalCard title="Request Return" subtitle={order.orderNumber} onClose={onClose}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px 24px' }}>
          <div>
            <Label>Reason</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {REASONS.map(r => (
                <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: C.ink, padding: '8px 12px', borderRadius: 7, border: `1px solid ${reason === r ? C.amber : C.border}`, background: reason === r ? C.amberBg : C.white }}>
                  <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} style={{ accentColor: C.amber }} />
                  {r}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label>Internal Notes (optional)</Label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Extra context for the audit trail…"
              style={{ ...iStyle, resize: 'vertical', lineHeight: 1.6 }} />
          </div>

          <div style={{ padding: '12px 14px', background: C.amberBg, borderRadius: 8, border: `1px solid ${C.amber}`, fontSize: 12, color: C.inkMid, lineHeight: 1.6 }}>
            <strong style={{ color: C.ink }}>Note:</strong> Stock will only be restocked when you <em>confirm receipt</em> of the returned items. The refund is also triggered at that point.
          </div>

          {err && <p style={{ margin: 0, fontSize: 12, color: C.red, padding: '8px 12px', background: C.redBg, borderRadius: 6, border: '1px solid #F5C6C2' }}>{err}</p>}
        </div>
        <ModalFooter>
          <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
          <Btn onClick={handleSubmit} disabled={saving}>{saving ? 'Creating…' : 'Create Return Request'}</Btn>
        </ModalFooter>
      </ModalCard>
    </Overlay>
  );
};

/* ── Confirm Return Modal ─────────────────────────────────────────────────── */
const ConfirmReturnModal = ({ order, onClose, onSuccess }) => {
  const [method, setMethod]   = useState('Paystack');
  const [notes,  setNotes]    = useState('');
  const [saving, setSaving]   = useState(false);
  const [err,    setErr]      = useState(null);

  const METHODS = ['Paystack', 'Bank Transfer', 'Cash', 'Credit Note'];

  // Warn admin if order is past Paystack's 20-day window
  const orderAge      = Date.now() - new Date(order.updatedAt ?? order.createdAt).getTime();
  const beyondWindow  = orderAge > 20 * 24 * 60 * 60 * 1000;

  const handleConfirm = async () => {
    setSaving(true); setErr(null);
    try {
      const res = await api.post(`/returns/${order.id}/confirm`, {
        refundMethod: method,
        notes:        notes || undefined,
      });
      const msg = res.data.data?.manualRequired
        ? `Return confirmed — manual ${res.data.data.method} refund added to queue`
        : 'Return confirmed and refund initiated';
      onSuccess(msg);
      onClose();
    } catch (e) {
      setErr(e?.response?.data?.message ?? 'Failed to confirm return');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <ModalCard title="Confirm Return Receipt" subtitle={order.orderNumber} onClose={onClose}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px 24px' }}>

          <div style={{ padding: '12px 14px', background: '#EAF5EF', borderRadius: 8, border: '1px solid #B2DFCA', fontSize: 12, color: C.inkMid, lineHeight: 1.6 }}>
            <strong style={{ color: C.green }}>Confirming this will:</strong>
            <ul style={{ margin: '6px 0 0 16px' }}>
              <li>Restock all items from this order</li>
              <li>Trigger a full refund of {fmt(order.totalAmount)}</li>
              <li>Mark the order as "Returned"</li>
            </ul>
          </div>

          {beyondWindow && method === 'Paystack' && (
            <div style={{ padding: '12px 14px', background: C.redBg, borderRadius: 8, border: '1px solid #F5C6C2', fontSize: 12, color: C.red, lineHeight: 1.6 }}>
              <strong>Paystack 20-day window has passed.</strong> This order is too old for an automatic Paystack refund. The system will switch to Bank Transfer and add it to the manual refund queue automatically.
            </div>
          )}

          <div>
            <Label>Refund Method</Label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {METHODS.map(m => (
                <button key={m} onClick={() => setMethod(m)} style={{
                  padding: '9px 12px', borderRadius: 7, cursor: 'pointer',
                  border:      `1.5px solid ${method === m ? C.amber : C.border}`,
                  background:  method === m ? C.amberBg : C.bg,
                  color:       method === m ? C.ink : C.inkMid,
                  fontWeight:  method === m ? 700 : 500, fontSize: 12,
                  fontFamily:  'Geist, sans-serif',
                }}>{m}</button>
              ))}
            </div>
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="e.g. Items inspected, all accounted for"
              style={{ ...iStyle, resize: 'vertical', lineHeight: 1.6 }} />
          </div>

          {err && <p style={{ margin: 0, fontSize: 12, color: C.red, padding: '8px 12px', background: C.redBg, borderRadius: 6 }}>{err}</p>}
        </div>
        <ModalFooter>
          <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
          <Btn onClick={handleConfirm} disabled={saving}>{saving ? 'Confirming…' : 'Confirm Receipt & Refund'}</Btn>
        </ModalFooter>
      </ModalCard>
    </Overlay>
  );
};

/* ── Mark Manual Refund Complete Modal ───────────────────────────────────── */
const MarkCompleteModal = ({ refund, onClose, onSuccess }) => {
  const [note,   setNote]   = useState('');
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState(null);

  const order = refund.order ?? {};

  const handleMark = async () => {
    setSaving(true); setErr(null);
    try {
      await api.post(`/returns/refunds/${refund.id}/complete`, { note: note || undefined });
      onSuccess('Refund marked as complete');
      onClose();
    } catch (e) {
      setErr(e?.response?.data?.message ?? 'Failed to mark refund complete');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <ModalCard title="Mark Refund Complete" subtitle={order.orderNumber} onClose={onClose}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px 24px' }}>

          <div style={{ padding: '14px 16px', background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InfoRow label="Amount"   value={fmt(refund.amount)} />
              <InfoRow label="Method"   value={refund.method} />
              <InfoRow label="Order"    value={order.orderNumber} />
              <InfoRow label="Customer" value={
                order.user
                  ? `${order.user.firstName ?? ''} ${order.user.lastName ?? ''}`.trim()
                  : (order.guestEmail ?? '—')
              } />
            </div>
          </div>

          <div>
            <Label>Confirmation Note (optional)</Label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
              placeholder="e.g. Transfer sent via GTBank ref: TXN12345"
              style={{ ...iStyle, resize: 'vertical', lineHeight: 1.6 }} />
          </div>

          {err && <p style={{ margin: 0, fontSize: 12, color: C.red, padding: '8px 12px', background: C.redBg, borderRadius: 6 }}>{err}</p>}
        </div>
        <ModalFooter>
          <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
          <Btn variant="success" onClick={handleMark} disabled={saving}>
            {saving ? 'Saving…' : '✓ Mark as Complete'}
          </Btn>
        </ModalFooter>
      </ModalCard>
    </Overlay>
  );
};

/* ── Modal shell components ──────────────────────────────────────────────── */
const Overlay = ({ children, onClose }) => (
  <div
    onClick={onClose}
    style={{ position: 'fixed', inset: 0, background: 'rgba(26,17,2,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
  >
    <div onClick={e => e.stopPropagation()}>{children}</div>
  </div>
);

const ModalCard = ({ title, subtitle, onClose, children }) => (
  <div style={{ background: C.white, borderRadius: 14, width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto' }}>
    <div style={{ padding: '20px 24px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.ink }}>{title}</p>
        {subtitle && <p style={{ margin: '3px 0 0', fontSize: 12, color: C.inkFaint, fontFamily: 'Geist Mono, monospace' }}>{subtitle}</p>}
      </div>
      <button onClick={onClose} style={{ background: C.bg, border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 16, color: C.inkMid, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
    </div>
    {children}
  </div>
);

const ModalFooter = ({ children }) => (
  <>
    <div style={{ height: 1, background: C.border }} />
    <div style={{ padding: '14px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
      {children}
    </div>
  </>
);

const InfoRow = ({ label, value }) => (
  <div>
    <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 800, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</p>
    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.ink }}>{value || '—'}</p>
  </div>
);

/* ── Return Requests Tab ─────────────────────────────────────────────────── */
const ReturnRequestsTab = ({ onToast }) => {
  const [returns,    setReturns]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0 });
  const [page,       setPage]       = useState(1);
  const [modal,      setModal]      = useState(null); // { type, order }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/returns', { params: { page, limit: 20 } });
      setReturns(res.data.data ?? []);
      setPagination(res.data.pagination ?? { page: 1, total: 0 });
    } catch (e) {
      onToast(e?.response?.data?.message ?? 'Failed to load returns', 'error');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleSuccess = (msg) => {
    onToast(msg);
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 13, color: C.inkFaint }}>
          {loading ? 'Loading…' : `${pagination.total ?? returns.length} return requests`}
        </p>
        <Btn variant="secondary" small onClick={load} disabled={loading}>↺ Refresh</Btn>
      </div>

      <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px 140px 160px', padding: '10px 20px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
          {['Order', 'Total', 'Status', 'Updated', 'Actions'].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 800, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: 0.8 }}>{h}</span>
          ))}
        </div>

        {loading && [1, 2, 3].map(i => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px 140px 160px', padding: '16px 20px', borderBottom: `1px solid ${C.border}`, gap: 12 }}>
            {[1, 2, 3, 4, 5].map(j => <Skeleton key={j} w={j === 1 ? '80%' : '60%'} />)}
          </div>
        ))}

        {!loading && returns.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ margin: '0 0 8px', fontSize: 22 }}>📦</p>
            <p style={{ margin: 0, fontSize: 13, color: C.inkFaint }}>No return requests yet.</p>
          </div>
        )}

        {!loading && returns.map((order, i) => {
          const customerName = order.user
            ? `${order.user.firstName ?? ''} ${order.user.lastName ?? ''}`.trim()
            : (order.guestEmail ?? 'Guest');
          const isRequested = order.status === 'return_requested';

          return (
            <div key={order.id} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px 140px 160px', padding: '14px 20px', borderBottom: i < returns.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.amber, fontFamily: 'Geist Mono, monospace' }}>{order.orderNumber}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: C.inkMid }}>{customerName}</p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{fmt(order.totalAmount)}</span>
              <StatusBadge status={order.status} />
              <span style={{ fontSize: 12, color: C.inkFaint }}>{fmtDT(order.updatedAt)}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {isRequested ? (
                  <Btn small onClick={() => setModal({ type: 'confirm', order })}>
                    Confirm Receipt
                  </Btn>
                ) : (
                  <span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>✓ Processed</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modal?.type === 'confirm' && (
        <ConfirmReturnModal
          order={modal.order}
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

/* ── Refunds Tab (all statuses) ──────────────────────────────────────────── */
const REFUND_FILTERS = [
  { key: 'all',             label: 'All'             },
  { key: 'pending',         label: 'Pending'         },
  { key: 'manual_required', label: 'Manual Required' },
  { key: 'completed',       label: 'Completed'       },
  { key: 'failed',          label: 'Failed'          },
];

const RefundsTab = ({ onToast }) => {
  const [refunds,    setRefunds]    = useState([]);
  const [counts,     setCounts]     = useState({});
  const [loading,    setLoading]    = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0 });
  const [status,     setStatus]     = useState('all');
  const [modal,      setModal]      = useState(null); // refund

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 50 };
      if (status !== 'all') params.status = status;
      const res  = await api.get('/returns/refunds', { params });
      const data = res.data.data ?? {};
      setRefunds(data.refunds ?? []);
      setCounts(data.counts ?? {});
      setPagination(data.pagination ?? { page: 1, total: 0 });
    } catch (e) {
      onToast(e?.response?.data?.message ?? 'Failed to load refunds', 'error');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const handleSuccess = (msg) => {
    onToast(msg);
    load();
  };

  const totalAll      = Object.values(counts).reduce((s, n) => s + n, 0);
  const countFor      = (key) => key === 'all' ? totalAll : (counts[key] ?? 0);
  const manualCount   = counts.manual_required ?? 0;
  // Pending Paystack refunds auto-complete via the refund.processed webhook in
  // production; "Mark Complete" is the manual override (and the dev-mode path).
  const canComplete   = (r) => r.status === 'pending' || r.status === 'manual_required';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {/* Status filter chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {REFUND_FILTERS.map(f => {
            const active = status === f.key;
            return (
              <button key={f.key} onClick={() => setStatus(f.key)} style={{
                padding: '7px 12px', borderRadius: 99, cursor: 'pointer',
                border:     `1.5px solid ${active ? C.amber : C.border}`,
                background: active ? C.amberBg : C.white,
                color:      active ? C.ink : C.inkMid,
                fontWeight: active ? 700 : 500, fontSize: 12,
                fontFamily: 'Geist, sans-serif', whiteSpace: 'nowrap',
              }}>
                {f.label} <span style={{ opacity: 0.6, fontWeight: 700 }}>{countFor(f.key)}</span>
              </button>
            );
          })}
        </div>
        <Btn variant="secondary" small onClick={load} disabled={loading}>↺ Refresh</Btn>
      </div>

      {manualCount > 0 && (
        <div style={{ padding: '10px 14px', background: C.redBg, border: '1px solid #F5C6C2', borderRadius: 8, marginBottom: 16, fontSize: 12, color: C.red, fontWeight: 600 }}>
          ⚠ {manualCount} refund{manualCount !== 1 ? 's' : ''} could not go through Paystack (20-day window passed or missing payment reference) — process via bank transfer and mark complete.
        </div>
      )}

      <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 140px 140px 150px', padding: '10px 20px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
          {['Customer / Order', 'Amount', 'Method', 'Status', 'Created', 'Actions'].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 800, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: 0.8 }}>{h}</span>
          ))}
        </div>

        {loading && [1, 2, 3].map(i => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 140px 140px 150px', padding: '16px 20px', borderBottom: `1px solid ${C.border}`, gap: 12 }}>
            {[1, 2, 3, 4, 5, 6].map(j => <Skeleton key={j} w={j === 1 ? '80%' : '60%'} />)}
          </div>
        ))}

        {!loading && refunds.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ margin: '0 0 8px', fontSize: 22 }}>💸</p>
            <p style={{ margin: 0, fontSize: 13, color: C.inkFaint }}>
              {status === 'all' ? 'No refunds yet.' : `No ${REFUND_FILTERS.find(f => f.key === status)?.label.toLowerCase()} refunds.`}
            </p>
          </div>
        )}

        {!loading && refunds.map((refund, i) => {
          const order = refund.order ?? {};
          const customerName = order.user
            ? `${order.user.firstName ?? ''} ${order.user.lastName ?? ''}`.trim()
            : (order.guestEmail ?? 'Guest');

          return (
            <div key={refund.id} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 140px 140px 150px', padding: '14px 20px', borderBottom: i < refunds.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.ink }}>{customerName}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: C.amber, fontFamily: 'Geist Mono, monospace', fontWeight: 700 }}>{order.orderNumber}</p>
                {order.user?.phoneNumber && (
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: C.inkFaint }}>{order.user.phoneNumber}</p>
                )}
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>{fmt(refund.amount)}</span>
              <span style={{ fontSize: 12, color: C.inkMid, fontWeight: 600 }}>{refund.method}</span>
              <StatusBadge status={refund.status} />
              <span style={{ fontSize: 12, color: C.inkFaint }}>{fmtDT(refund.createdAt)}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {canComplete(refund) ? (
                  <Btn small variant="success" onClick={() => setModal(refund)}>
                    Mark Complete
                  </Btn>
                ) : (
                  <span style={{ fontSize: 12, color: refund.status === 'completed' ? C.green : C.inkFaint, fontWeight: 600 }}>
                    {refund.status === 'completed' ? '✓ Done' : '—'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <MarkCompleteModal
          refund={modal}
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function RefundReturnsPage() {
  const [activeTab, setActiveTab] = useState('refunds');
  const [toast,     setToast]     = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const TABS = [
    { key: 'refunds', label: 'Refunds'         },
    { key: 'returns', label: 'Return Requests' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Geist, -apple-system, sans-serif', color: C.ink }}>
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800;900&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 60px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 800, color: C.amber, textTransform: 'uppercase', letterSpacing: 1.2 }}>
            Order Management
          </p>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: C.ink, letterSpacing: -0.5 }}>
            Refunds &amp; Returns
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.inkFaint }}>
            Manage return requests and process manual refunds
          </p>
        </div>

        {/* Tabs */}
        <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, padding: '0 20px' }}>
            {TABS.map(t => {
              const active = activeTab === t.key;
              return (
                <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                  padding: '13px 0', marginRight: 24, border: 'none', background: 'none',
                  cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 500,
                  color: active ? C.ink : C.inkFaint,
                  borderBottom: active ? `2px solid ${C.amber}` : '2px solid transparent',
                  fontFamily: 'Geist, sans-serif', whiteSpace: 'nowrap',
                }}>
                  {t.label}
                </button>
              );
            })}
          </div>

          <div style={{ padding: '20px' }}>
            {activeTab === 'refunds' && <RefundsTab        onToast={showToast} />}
            {activeTab === 'returns' && <ReturnRequestsTab onToast={showToast} />}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        * { box-sizing: border-box; }
        input:focus, textarea:focus, select:focus { border-color: ${C.amber} !important; outline: none; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
      `}</style>
    </div>
  );
}