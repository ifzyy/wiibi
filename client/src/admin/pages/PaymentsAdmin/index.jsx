import { useState } from 'react';
import { C, fmtCurrency, fmtDate } from '../AnalyticsDashboard/constants.js';
import { PageHeader, PageBody, StatCard, IBtn, SearchInput, Toast, GlobalStyles, Empty, Table, TH, TD, SkeletonRows, Pill } from '../AnalyticsDashboard/Ui.jsx';
import { usePaymentsAdmin } from './hooks/usePaymentAdmin.js';

const PAYMENT_STATUSES = ['', 'paid', 'unpaid', 'failed', 'partially_refunded', 'refunded'];
const REFUND_STATUSES  = ['', 'pending', 'completed', 'manual_required', 'failed'];

const DateInput = ({ label, value, onChange }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: C.inkMid, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    <input type="date" value={value} onChange={e => onChange(e.target.value)}
      style={{ padding: '6px 10px', border: `1px solid ${C.border}`, borderRadius: C.rSm, fontSize: 13, color: C.ink, background: C.surface, fontFamily: C.font }} />
  </label>
);

const StatusBadge = ({ status }) => {
  const MAP = {
    paid:               { bg: '#DCFCE7', text: '#16A34A' },
    unpaid:             { bg: '#FEF9C3', text: '#A16207' },
    failed:             { bg: '#FEE2E2', text: '#DC2626' },
    refunded:           { bg: '#EDE9FE', text: '#7C3AED' },
    partially_refunded: { bg: '#DBEAFE', text: '#2563EB' },
    pending:            { bg: '#FEF9C3', text: '#A16207' },
    completed:          { bg: '#DCFCE7', text: '#16A34A' },
    manual_required:    { bg: '#FFEDD5', text: '#EA580C' },
    processing:         { bg: '#DBEAFE', text: '#2563EB' },
    cancelled:          { bg: '#F1F5F9', text: '#64748B' },
    shipped:            { bg: '#D1FAE5', text: '#059669' },
    delivered:          { bg: '#DCFCE7', text: '#16A34A' },
  };
  const col = MAP[status] ?? { bg: C.border, text: C.inkMid };
  return (
    <span style={{ background: col.bg, color: col.text, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
      {(status ?? '—').replace(/_/g, ' ')}
    </span>
  );
};

/* ── Mark Complete modal ─────────────────────────────────────────────────── */

const MarkCompleteModal = ({ refund, onConfirm, onClose }) => {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    await onConfirm(refund.id, note);
    setBusy(false);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 900, color: C.ink, marginBottom: 6 }}>Mark Refund Complete</h2>
        <p style={{ fontSize: 13, color: C.inkMid, marginBottom: 16, lineHeight: 1.6 }}>
          Confirm that the manual bank transfer of{' '}
          <strong style={{ color: C.ink }}>{fmtCurrency(refund.amount)}</strong> has been sent
          to the customer for order <strong style={{ color: C.ink }}>{refund.order?.orderNumber ?? '—'}</strong>.
        </p>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.inkMid, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
          Notes (optional)
        </label>
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="e.g. Transfer ref: ABC123"
          style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.ink, fontFamily: C.font, marginBottom: 20 }}
        />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface, color: C.inkMid, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: C.font }}>
            Cancel
          </button>
          <button onClick={submit} disabled={busy} style={{ padding: '9px 18px', border: 'none', borderRadius: 8, background: '#16A34A', color: '#fff', fontWeight: 800, fontSize: 13, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? .6 : 1, fontFamily: C.font }}>
            {busy ? 'Saving…' : 'Confirm & Mark Complete'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main component ──────────────────────────────────────────────────────── */

export default function PaymentsAdmin() {
  const h = usePaymentsAdmin();
  const [markTarget, setMarkTarget] = useState(null);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, color: C.ink }}>
      <GlobalStyles />
      {h.toast && <Toast msg={h.toast.msg} type={h.toast.type} />}
      {markTarget && (
        <MarkCompleteModal
          refund={markTarget}
          onConfirm={h.markRefundComplete}
          onClose={() => setMarkTarget(null)}
        />
      )}

      <PageHeader
        title="Payments"
        subtitle="Payment log, refunds & reconciliation"
        actions={
          <>
            <DateInput label="From" value={h.startDate} onChange={v => { h.setStartDate(v); h.setPage(1); }} />
            <DateInput label="To"   value={h.endDate}   onChange={v => { h.setEndDate(v);   h.setPage(1); }} />
            <IBtn onClick={h.handleExport} style={{ alignSelf: 'flex-end' }}>⬇ Export CSV</IBtn>
          </>
        }
      />

      <PageBody>
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <StatCard label="Total Paid"    value={fmtCurrency(h.stats?.amounts?.paid)}             sub="In selected range" accent={C.amber}  loading={h.statsLoading} />
          <StatCard label="Unpaid Orders" value={(h.stats?.counts?.unpaid ?? 0).toLocaleString()} sub="Awaiting payment"  accent={C.red}    loading={h.statsLoading} />
          <StatCard label="Failed"        value={(h.stats?.counts?.failed ?? 0).toLocaleString()} sub="Payment failures"  accent={C.orange} loading={h.statsLoading} />
          <StatCard label="Refunded"      value={fmtCurrency(h.stats?.totalRefunded)}             sub="Total returned"    accent={C.purple} loading={h.statsLoading} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[['all', 'Payment Log'], ['refunds', 'Refunds'], ['reconcile', '⚠ Reconcile']].map(([id, label]) => (
            <button key={id} onClick={() => h.setTab(id)} style={{
              padding: '8px 18px', borderRadius: C.r, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none',
              background: h.tab === id ? C.amber : C.surface,
              color:      h.tab === id ? C.ink   : C.inkMid,
              boxShadow:  h.tab === id ? C.shadow : 'none',
              fontFamily: C.font,
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── TAB: Payment Log ── */}
        {h.tab === 'all' && (
          <>
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
              padding: '12px 16px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
            }}>
              <SearchInput value={h.search} onChange={h.onSearchChange} placeholder="Order number or email…" />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {PAYMENT_STATUSES.map(s => (
                  <Pill key={s} label={s ? s.replace(/_/g,' ') : 'All'} active={h.pStatus === s} onClick={() => { h.setPStatus(s); h.setPage(1); }} />
                ))}
              </div>
            </div>

            {h.error && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: C.r, padding: '12px 16px', margin: '12px 0', color: C.red, fontSize: 13, fontWeight: 600 }}>
                ⚠ {h.error}
              </div>
            )}

            <Table>
              <thead>
                <tr>
                  <TH>Order</TH><TH>Customer</TH><TH>Amount</TH>
                  <TH>Payment</TH><TH>Status</TH><TH>Reference</TH><TH>Date</TH>
                </tr>
              </thead>
              <tbody>
                {h.loading
                  ? <SkeletonRows cols={7} rows={8} />
                  : h.payments.length === 0
                    ? <tr><td colSpan={7}><Empty icon="💳" message="No payments found" /></td></tr>
                    : h.payments.map(p => {
                        const name = p.user
                          ? [p.user.firstName, p.user.lastName].filter(Boolean).join(' ')
                          : p.guestEmail ?? 'Guest';
                        return (
                          <tr key={p.id}>
                            <TD><span style={{ fontWeight: 700 }}>{p.orderNumber}</span></TD>
                            <TD style={{ color: C.inkMid }}>{name}</TD>
                            <TD><span style={{ fontWeight: 700 }}>{fmtCurrency(p.totalAmount)}</span></TD>
                            <TD><StatusBadge status={p.paymentStatus} /></TD>
                            <TD><StatusBadge status={p.status} /></TD>
                            <TD style={{ color: C.inkFaint, fontSize: 11, fontFamily: 'monospace' }}>
                              {p.paymentReference?.slice(0, 20)}…
                            </TD>
                            <TD style={{ color: C.inkMid, fontSize: 12 }}>{fmtDate(p.createdAt)}</TD>
                          </tr>
                        );
                      })
                }
              </tbody>
            </Table>

            {h.pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
                <IBtn onClick={() => h.setPage(p => Math.max(1, p - 1))}                      disabled={h.page === 1}>← Prev</IBtn>
                <span style={{ fontSize: 13, color: C.inkMid, fontWeight: 600 }}>Page {h.page} of {h.pagination.pages}</span>
                <IBtn onClick={() => h.setPage(p => Math.min(h.pagination.pages, p + 1))}     disabled={h.page === h.pagination.pages}>Next →</IBtn>
              </div>
            )}
          </>
        )}

        {/* ── TAB: Refunds ── */}
        {h.tab === 'refunds' && (
          <>
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
              padding: '12px 16px', display: 'flex', gap: 6, flexWrap: 'wrap',
            }}>
              {REFUND_STATUSES.map(s => (
                <Pill key={s} label={s ? s.replace(/_/g,' ') : 'All'} active={h.refundStatus === s} onClick={() => { h.setRefundStatus(s); h.setRefundPage(1); }} />
              ))}
            </div>

            {/* Manual refund alert banner */}
            {h.refunds.some(r => r.status === 'manual_required') && (
              <div style={{ background: '#FFEDD5', border: '1px solid #FED7AA', borderRadius: C.r, padding: '12px 16px', marginBottom: 12, fontSize: 13, color: '#C2410C', fontWeight: 600 }}>
                ⚠ Some refunds require manual bank transfer. Click "Mark Complete" after sending payment.
              </div>
            )}

            <Table>
              <thead>
                <tr>
                  <TH>Order</TH><TH>Customer</TH><TH>Amount</TH>
                  <TH>Method</TH><TH>Status</TH><TH>Reason</TH><TH>Date</TH><TH></TH>
                </tr>
              </thead>
              <tbody>
                {h.refundLoading
                  ? <SkeletonRows cols={8} rows={6} />
                  : h.refunds.length === 0
                    ? <tr><td colSpan={8}><Empty icon="↩" message="No refunds found" /></td></tr>
                    : h.refunds.map(r => {
                        const name = r.order?.user
                          ? [r.order.user.firstName, r.order.user.lastName].filter(Boolean).join(' ')
                          : r.order?.guestEmail ?? 'Guest';
                        return (
                          <tr key={r.id}>
                            <TD><span style={{ fontWeight: 700 }}>{r.order?.orderNumber ?? '—'}</span></TD>
                            <TD style={{ color: C.inkMid }}>{name}</TD>
                            <TD><span style={{ fontWeight: 700 }}>{fmtCurrency(r.amount)}</span></TD>
                            <TD style={{ color: C.inkMid }}>{r.method}</TD>
                            <TD><StatusBadge status={r.status} /></TD>
                            <TD style={{ color: C.inkMid, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason ?? '—'}</TD>
                            <TD style={{ color: C.inkMid, fontSize: 12 }}>{fmtDate(r.createdAt)}</TD>
                            <TD>
                              {r.status === 'manual_required' && (
                                <button
                                  onClick={() => setMarkTarget(r)}
                                  style={{
                                    padding: '4px 12px', border: 'none', borderRadius: 6,
                                    background: '#16A34A', color: '#fff',
                                    fontWeight: 700, fontSize: 11, cursor: 'pointer',
                                    whiteSpace: 'nowrap', fontFamily: C.font,
                                  }}
                                >
                                  Mark Complete
                                </button>
                              )}
                            </TD>
                          </tr>
                        );
                      })
                }
              </tbody>
            </Table>

            {h.refundPag?.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
                <IBtn onClick={() => h.setRefundPage(p => Math.max(1, p - 1))}                       disabled={h.refundPage === 1}>← Prev</IBtn>
                <span style={{ fontSize: 13, color: C.inkMid, fontWeight: 600 }}>Page {h.refundPage} of {h.refundPag.pages}</span>
                <IBtn onClick={() => h.setRefundPage(p => Math.min(h.refundPag.pages, p + 1))}       disabled={h.refundPage === h.refundPag.pages}>Next →</IBtn>
              </div>
            )}
          </>
        )}

        {/* ── TAB: Reconcile ── */}
        {h.tab === 'reconcile' && (
          <div>
            {h.reconcileLoad
              ? <div style={{ padding: '40px 0', textAlign: 'center', color: C.inkMid }}>Checking records…</div>
              : h.reconcile ? (
                  <>
                    {!h.reconcile.hasIssues ? (
                      <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: C.r, padding: '20px 24px', color: '#16A34A', fontWeight: 700, fontSize: 14 }}>
                        ✓ All payment records are consistent. No issues found.
                      </div>
                    ) : (
                      <>
                        {h.reconcile.manualRefundsPending?.length > 0 && (
                          <div style={{ background: '#FFEDD5', border: '1px solid #FED7AA', borderRadius: C.r, padding: '16px 20px', marginBottom: 16 }}>
                            <div style={{ fontWeight: 800, color: '#C2410C', marginBottom: 10 }}>
                              ⚠ Manual Refunds Pending ({h.reconcile.manualRefundsPending.length})
                            </div>
                            <p style={{ fontSize: 12, color: '#92400E', marginBottom: 12 }}>
                              These refunds require a manual bank transfer. Go to the Refunds tab to mark them complete after sending.
                            </p>
                            {h.reconcile.manualRefundsPending.map(r => (
                              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid rgba(0,0,0,.08)`, fontSize: 13 }}>
                                <span style={{ fontWeight: 700 }}>{r.order?.orderNumber}</span>
                                <span style={{ color: C.inkMid }}>{fmtCurrency(r.amount)} · {r.method}</span>
                                <StatusBadge status={r.status} />
                                <button
                                  onClick={() => setMarkTarget(r)}
                                  style={{ padding: '3px 10px', border: 'none', borderRadius: 6, background: '#16A34A', color: '#fff', fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: C.font }}
                                >
                                  Mark Complete
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {h.reconcile.stalePaymentStatus?.length > 0 && (
                          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: C.r, padding: '16px 20px' }}>
                            <div style={{ fontWeight: 800, color: C.red, marginBottom: 6 }}>
                              ✗ Stale Payment Status ({h.reconcile.stalePaymentStatus.length})
                            </div>
                            <p style={{ fontSize: 12, color: '#991B1B', marginBottom: 12 }}>
                              These orders are marked "paid" but their refunds total the full amount. Update their payment status manually.
                            </p>
                            {h.reconcile.stalePaymentStatus.map(o => (
                              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid rgba(0,0,0,.08)`, fontSize: 13 }}>
                                <span style={{ fontWeight: 700 }}>{o.order_number}</span>
                                <span style={{ color: C.inkMid }}>Marked: {o.payment_status} · Refunded: {fmtCurrency(o.total_refunded)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )
              : <Empty icon="🔍" message="Reconcile data loading…" />
            }
          </div>
        )}

      </PageBody>
    </div>
  );
}
