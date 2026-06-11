import { C, fmtCurrency, fmtDate } from '../../AnalyticsDashboard/constants.js';
import { DrawerShell, SectionLabel, Badge, Empty } from '../../AnalyticsDashboard/Ui.jsx';
import { useCustomerProfile } from '../hooks/useCustomers.js';

const PAYMENT_COLORS = {
  paid:               { bg: '#DCFCE7', text: '#16A34A' },
  unpaid:             { bg: '#FEF9C3', text: '#A16207' },
  failed:             { bg: '#FEE2E2', text: '#DC2626' },
  refunded:           { bg: '#EDE9FE', text: '#7C3AED' },
  partially_refunded: { bg: '#DBEAFE', text: '#2563EB' },
};

const Row = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
    <span style={{ fontSize: 12, color: C.inkMid, fontWeight: 600 }}>{label}</span>
    <span style={{ fontSize: 13, color: C.ink, fontWeight: 700 }}>{value ?? '—'}</span>
  </div>
);

export default function CustomerDrawer({ userId, onClose }) {
  const { profile, loading, error } = useCustomerProfile(userId);
  const p     = profile?.profile;
  const stats = profile?.stats;

  const fullName = p ? [p.firstName, p.lastName].filter(Boolean).join(' ') || p.email || 'Unknown' : '…';

  return (
    <DrawerShell open={!!userId} onClose={onClose} width={540}>

      {/* Title */}
      <span>👤 {fullName}</span>

      {/* Body */}
      {loading ? (
        <div style={{ paddingTop: 20 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 18, background: C.border, borderRadius: 4, marginBottom: 14, animation: 'pulse 1.4s ease-in-out infinite', width: i % 2 ? '60%' : '80%' }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ color: C.red, fontSize: 13, padding: '20px 0' }}>⚠ {error}</div>
      ) : p ? (
        <div>
          {/* Contact */}
          <SectionLabel>Contact</SectionLabel>
          <Row label="Email"  value={p.email} />
          <Row label="Phone"  value={p.phoneNumber} />
          <Row label="Status" value={
            <span style={{ display: 'flex', gap: 6 }}>
              {p.isVerified && <Badge label="Verified" status="paid" />}
              {!p.isActive  && <Badge label="Inactive" status="cancelled" />}
            </span>
          } />
          <Row label="Joined" value={fmtDate(p.createdAt)} />
          <Row label="Last login" value={fmtDate(p.lastLoginAt)} />

          {/* Shipping address */}
          {p.shippingAddress && (
            <>
              <SectionLabel>Shipping Address</SectionLabel>
              <div style={{ fontSize: 13, color: C.inkMid, lineHeight: 1.6, padding: '8px 0' }}>
                {[p.shippingAddress.addressLine1, p.shippingAddress.city, p.shippingAddress.state, p.shippingAddress.country].filter(Boolean).join(', ')}
              </div>
            </>
          )}

          {/* Lifetime stats */}
          <SectionLabel>Lifetime Value</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Orders',   value: stats?.totalOrders ?? 0 },
              { label: 'Spent',    value: fmtCurrency(stats?.lifetimeValue) },
              { label: 'Refunds',  value: stats?.refundedOrders ?? 0 },
            ].map(s => (
              <div key={s.label} style={{ background: C.bg, borderRadius: C.rSm, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>{s.value}</div>
                <div style={{ fontSize: 11, color: C.inkMid, marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Recent orders */}
          <SectionLabel>Recent Orders</SectionLabel>
          {profile?.recentOrders?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {profile.recentOrders.map(o => {
                const pCol = PAYMENT_COLORS[o.paymentStatus] ?? { bg: C.border, text: C.inkMid };
                return (
                  <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: C.bg, borderRadius: C.rSm }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{o.orderNumber}</div>
                      <div style={{ fontSize: 11, color: C.inkMid }}>{fmtDate(o.createdAt)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{fmtCurrency(o.totalAmount)}</div>
                      <span style={{ background: pCol.bg, color: pCol.text, fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99 }}>
                        {o.paymentStatus}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty icon="🛒" message="No orders yet" />
          )}

          {/* Open tickets */}
          {profile?.openTickets?.length > 0 && (
            <>
              <SectionLabel>Open Support Tickets</SectionLabel>
              {profile.openTickets.map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: C.bg, borderRadius: C.rSm, marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{t.ticketNumber}</div>
                    <div style={{ fontSize: 11, color: C.inkMid, marginTop: 1 }}>{t.subject}</div>
                  </div>
                  <Badge label={t.priority} status={t.priority} />
                </div>
              ))}
            </>
          )}
        </div>
      ) : null}

      {/* Footer */}
      <div />
    </DrawerShell>
  );
}