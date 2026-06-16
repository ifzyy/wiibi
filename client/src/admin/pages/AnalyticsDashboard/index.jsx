import { C, fmtCurrency } from './constants.js';
import { PageHeader, PageBody, StatCard, IBtn, Toast, GlobalStyles, Empty } from './Ui.jsx';
import { useAnalytics } from './hooks/useAnalytics.js';
import RevenueChart from './components/revenueChart.jsx';

const STATUS_ORDER = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_ORDER = ['paid', 'unpaid', 'failed', 'refunded', 'partially_refunded'];

const DateInput = ({ label, value, onChange }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: C.inkMid, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    <input
      type="date"
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: C.rSm,
        fontSize: 13, color: C.ink, background: C.surface, fontFamily: C.font,
      }}
    />
  </label>
);

const StatusPill = ({ status, count, total, colors }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const col = colors[status] ?? { bg: C.border, text: C.inkMid };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: col.bg, borderRadius: C.rSm }}>
      <span style={{ fontSize: 13, fontWeight: 800, color: col.text, minWidth: 32, textAlign: 'right' }}>{count ?? 0}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: col.text, textTransform: 'capitalize' }}>
          {status.replace(/_/g, ' ')}
        </div>
        <div style={{ height: 3, background: 'rgba(0,0,0,0.08)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: col.text, borderRadius: 2, transition: 'width 0.5s ease' }} />
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: col.text, opacity: 0.8 }}>{pct}%</span>
    </div>
  );
};

const TopPage = ({ path, views, rank }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: `1px solid ${C.border}` }}>
    <span style={{ fontSize: 11, fontWeight: 800, color: C.inkFaint, minWidth: 18 }}>#{rank}</span>
    <span style={{ flex: 1, fontSize: 13, color: C.ink, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {path}
    </span>
    <span style={{ fontSize: 13, fontWeight: 700, color: C.inkMid, flexShrink: 0 }}>
      {views?.toLocaleString()} views
    </span>
  </div>
);

// Muted, desaturated palette — semantic meaning stays (green good, red bad,
// amber pending, neutral in-progress) without the dashboard looking like a
// candy shop.
const PAYMENT_COLORS = {
  paid:               { bg: '#F1F6F1', text: '#3D6B4A' },
  unpaid:             { bg: '#FAF6EC', text: '#8A6D2B' },
  failed:             { bg: '#F9F1F0', text: '#9C4A3F' },
  refunded:           { bg: '#F3F3F1', text: '#6B6655' },
  partially_refunded: { bg: '#F3F3F1', text: '#6B6655' },
};
const FULFIL_COLORS = {
  pending:    { bg: '#FAF6EC', text: '#8A6D2B' },
  processing: { bg: '#F3F3F1', text: '#57534E' },
  shipped:    { bg: '#F3F3F1', text: '#44403C' },
  delivered:  { bg: '#F1F6F1', text: '#3D6B4A' },
  cancelled:  { bg: '#F9F1F0', text: '#9C4A3F' },
};

const PRESETS = [
  { key: 'today', label: 'Today'        },
  { key: '7d',    label: 'Last 7 days'  },
  { key: '30d',   label: 'Last 30 days' },
  { key: 'year',  label: 'This year'    },
];

export default function AnalyticsDashboard() {
  const {
    data, loading, error, toast,
    startDate, setStartDate,
    endDate,   setEndDate,
    preset, setPreset,
    chartData,
    load,
  } = useAnalytics();

  const revenue   = data?.revenue   ?? {};
  const orders    = data?.orders    ?? {};
  const traffic   = data?.traffic   ?? {};
  const customers = data?.customers ?? {};
  const recents   = data?.recentOrders ?? [];
  const totalRevenue   = parseFloat(revenue.total   || 0);
  const totalOrders    = parseInt(orders.total      || 0, 10);
  const totalViews     = parseInt(traffic.pageViews || 0, 10);
  const uniqueVisitors = parseInt(traffic.uniqueVisitors || 0, 10);
  const byStatus        = orders.byStatus        ?? {};
  const byPayment       = orders.byPaymentStatus ?? {};

  // Section card — matches the ProductCatalog table card (white, 14px radius)
  const card = {
    background: C.surface, borderRadius: 14,
    border: `1px solid ${C.border}`, padding: '20px 24px',
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, color: C.ink }}>
      <GlobalStyles />
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <PageHeader
        title="Analytics"
        subtitle="Sales, orders & traffic overview"
        actions={
          <>
            <div style={{ display: 'flex', gap: 6, alignSelf: 'flex-end' }}>
              {PRESETS.map(p => (
                <button
                  key={p.key}
                  onClick={() => setPreset(p.key)}
                  style={{
                    padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', fontFamily: C.font,
                    border: `1px solid ${preset === p.key ? C.amber : C.border}`,
                    background: preset === p.key ? '#FFF7E6' : C.surface,
                    color: preset === p.key ? '#A16207' : C.inkMid,
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <DateInput label="From" value={startDate} onChange={setStartDate} />
            <DateInput label="To"   value={endDate}   onChange={setEndDate}   />
            <IBtn onClick={load} disabled={loading} style={{ alignSelf: 'flex-end' }}>
              {loading ? 'Loading…' : '↻ Refresh'}
            </IBtn>
          </>
        }
      />

      <PageBody>
        {error && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: C.r, padding: '12px 16px', color: C.red, fontSize: 13, fontWeight: 600 }}>
            ⚠ {error} — <button onClick={load} style={{ background: 'none', border: 'none', color: C.red, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
          </div>
        )}

        {/* ── Top stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <StatCard label="Total Revenue"    value={fmtCurrency(totalRevenue)} sub={`${startDate} → ${endDate}`} accent={C.amber} loading={loading} />
          <StatCard label="Total Orders"     value={totalOrders.toLocaleString()} sub="All statuses"             loading={loading} />
          <StatCard label="Page Views"       value={totalViews.toLocaleString()}  sub={`${uniqueVisitors.toLocaleString()} unique visitors`} loading={loading} />
          <StatCard label="Paid Orders"      value={(byPayment.paid ?? 0).toLocaleString()} sub="Completed payments" loading={loading} />
        </div>

        {/* ── Customer stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <StatCard label="Total Customers"     value={(customers.total ?? 0).toLocaleString()}        sub="Registered users"           loading={loading} />
          <StatCard label="New Customers"       value={(customers.newThisMonth ?? 0).toLocaleString()} sub="Joined in last 30 days"     loading={loading} />
          <StatCard label="Returning Customers" value={(customers.returning ?? 0).toLocaleString()}    sub="Placed more than one order" loading={loading} />
          <StatCard label="Active Customers"    value={(customers.active ?? 0).toLocaleString()}       sub="Ordered in last 90 days"    loading={loading} />
        </div>

        {/* ── Revenue chart ── */}
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, marginBottom: 16 }}>Daily Revenue</div>
          <RevenueChart data={chartData} loading={loading} />
        </div>

        {/* ── Order status + Payment status ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, marginBottom: 14 }}>Orders by Status</div>
            {loading
              ? <div style={{ height: 120, background: C.border, borderRadius: C.r, animation: 'pulse 1.4s ease-in-out infinite' }} />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {STATUS_ORDER.map(s => (
                    <StatusPill key={s} status={s} count={byStatus[s] ?? 0} total={totalOrders} colors={FULFIL_COLORS} />
                  ))}
                </div>
            }
          </div>

          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, marginBottom: 14 }}>Payment Status</div>
            {loading
              ? <div style={{ height: 120, background: C.border, borderRadius: C.r, animation: 'pulse 1.4s ease-in-out infinite' }} />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {PAYMENT_ORDER.map(s => (
                    <StatusPill key={s} status={s} count={byPayment[s] ?? 0} total={totalOrders} colors={PAYMENT_COLORS} />
                  ))}
                </div>
            }
          </div>
        </div>

        {/* ── Traffic + Top pages ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, marginBottom: 14 }}>Traffic</div>
            <div style={{ display: 'flex', gap: 14 }}>
              <StatCard label="Page Views"     value={totalViews.toLocaleString()}     loading={loading} />
              <StatCard label="Unique Visitors" value={uniqueVisitors.toLocaleString()} loading={loading} />
            </div>
          </div>

          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, marginBottom: 14 }}>Top Pages</div>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <div key={i} style={{ height: 28, background: C.border, borderRadius: 4, marginBottom: 8, animation: 'pulse 1.4s ease-in-out infinite' }} />)
              : traffic.topPages?.length > 0
                ? traffic.topPages.map((p, i) => <TopPage key={p.path} path={p.path} views={p.views} rank={i + 1} />)
                : <Empty icon="📊" message="No page view data yet" />
            }
          </div>
        </div>

        {/* ── Recent orders ── */}
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, marginBottom: 14 }}>Recent Orders</div>
          {loading
            ? <div style={{ height: 80, background: C.border, borderRadius: C.r, animation: 'pulse 1.4s ease-in-out infinite' }} />
            : recents.length === 0
              ? <Empty icon="🛒" message="No orders yet" />
              : <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      {['Order', 'Customer', 'Amount', 'Status', 'Payment', 'Date'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.inkMid, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recents.map(o => {
                      const name = o.user
                        ? [o.user.firstName, o.user.lastName].filter(Boolean).join(' ')
                        : 'Guest';
                      const sCol = FULFIL_COLORS[o.status]  ?? { bg: C.border, text: C.inkMid };
                      const pCol = PAYMENT_COLORS[o.paymentStatus] ?? { bg: C.border, text: C.inkMid };
                      return (
                        <tr key={o.id}>
                          <td style={{ padding: '11px 12px', borderBottom: `1px solid ${C.border}` }}>
                            <span style={{ fontWeight: 700, color: C.ink }}>{o.orderNumber ?? o.id?.slice(0, 8)}</span>
                          </td>
                          <td style={{ padding: '11px 12px', borderBottom: `1px solid ${C.border}`, color: C.inkMid }}>{name}</td>
                          <td style={{ padding: '11px 12px', borderBottom: `1px solid ${C.border}`, fontWeight: 700 }}>{fmtCurrency(o.totalAmount)}</td>
                          <td style={{ padding: '11px 12px', borderBottom: `1px solid ${C.border}` }}>
                            <span style={{ background: sCol.bg, color: sCol.text, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{o.status}</span>
                          </td>
                          <td style={{ padding: '11px 12px', borderBottom: `1px solid ${C.border}` }}>
                            <span style={{ background: pCol.bg, color: pCol.text, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{o.paymentStatus}</span>
                          </td>
                          <td style={{ padding: '11px 12px', borderBottom: `1px solid ${C.border}`, color: C.inkMid, fontSize: 12 }}>
                            {new Date(o.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
          }
        </div>
      </PageBody>
    </div>
  );
}