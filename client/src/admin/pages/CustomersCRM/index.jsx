import { useState } from 'react';
import { C, fmtDate } from '../AnalyticsDashboard/constants.js';
import { PageHeader, PageBody, StatCard, IBtn, SearchInput, Toast, GlobalStyles, Empty, Table, TH, TD, SkeletonRows } from '../AnalyticsDashboard/Ui.jsx';
import { useCustomers } from './hooks/useCustomers.js';
import CustomerDrawer from './components/CustomerDrawer.jsx';

export default function CustomersCRM() {
  const {
    customers, stats, pagination, loading, error, toast,
    page, setPage, search, setSearch,
    sortBy, sortDir, toggleSort,
    load,
  } = useCustomers();

  const [selectedId, setSelectedId] = useState(null);

  const SortBtn = ({ k, children }) => (
    <span
      onClick={() => toggleSort(k)}
      style={{ cursor: 'pointer', userSelect: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
    >
      {children}
      {sortBy === k ? (sortDir === 'ASC' ? ' ↑' : ' ↓') : ' ↕'}
    </span>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, color: C.ink }}>
      <GlobalStyles />
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <PageHeader
        title="Customers"
        subtitle="CRM — profiles, history & inquiries"
        actions={<IBtn onClick={load} disabled={loading}>{loading ? 'Loading…' : '↻ Refresh'}</IBtn>}
      />

      <PageBody>
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <StatCard label="Total Customers"    value={(stats?.total           ?? 0).toLocaleString()} sub="Registered users"        loading={!stats} />
          <StatCard label="New This Month"     value={(stats?.newThisMonth    ?? 0).toLocaleString()} sub="Joined in last 30 days"  accent={C.blue}  loading={!stats} />
          <StatCard label="Active (90 days)"   value={(stats?.activeCustomers ?? 0).toLocaleString()} sub="Recently ordered"        accent={C.green} loading={!stats} />
          <StatCard label="Inactive"           value={(stats?.inactiveCustomers ?? 0).toLocaleString()} sub="No recent activity"    accent={C.red}   loading={!stats} />
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: C.r, padding: '12px 16px', color: C.red, fontSize: 13, fontWeight: 600 }}>
            ⚠ {error} — <button onClick={load} style={{ background: 'none', border: 'none', color: C.red, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
          </div>
        )}

        {/* Search */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
          padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search name, email, phone…" />
          <span style={{ fontSize: 12, color: C.inkFaint, marginLeft: 'auto' }}>
            {pagination.total} customer{pagination.total !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <Table>
          <thead>
            <tr>
              <TH><SortBtn k="firstName">Name</SortBtn></TH>
              <TH>Email</TH>
              <TH>Phone</TH>
              <TH><SortBtn k="createdAt">Joined</SortBtn></TH>
              <TH><SortBtn k="lastLoginAt">Last Login</SortBtn></TH>
              <TH>Orders</TH>
              <TH>Status</TH>
              <TH />
            </tr>
          </thead>
          <tbody>
            {loading
              ? <SkeletonRows cols={8} rows={8} />
              : customers.length === 0
                ? <tr><td colSpan={8}><Empty icon="👤" message="No customers found" /></td></tr>
                : customers.map(c => {
                    const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || '—';
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = C.surfaceHov}
                        onMouseLeave={e => e.currentTarget.style.background = ''}
                      >
                        <TD>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.amberLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: C.amber, flexShrink: 0 }}>
                              {(name[0] ?? '?').toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 700, color: C.ink }}>{name}</span>
                          </div>
                        </TD>
                        <TD style={{ color: C.inkMid }}>{c.email ?? '—'}</TD>
                        <TD style={{ color: C.inkMid }}>{c.phoneNumber ?? '—'}</TD>
                        <TD style={{ color: C.inkMid, fontSize: 12 }}>{fmtDate(c.createdAt)}</TD>
                        <TD style={{ color: C.inkMid, fontSize: 12 }}>{fmtDate(c.lastLoginAt)}</TD>
                        <TD style={{ fontWeight: 700 }}>{c.dataValues?.orderCount ?? c.orderCount ?? '—'}</TD>
                        <TD>
                          {c.isVerified
                            ? <span style={{ background: '#DCFCE7', color: '#16A34A', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99 }}>Verified</span>
                            : <span style={{ background: '#FEF9C3', color: '#A16207', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99 }}>Unverified</span>
                          }
                        </TD>
                        <TD>
                          <IBtn onClick={e => { e.stopPropagation(); setSelectedId(c.id); }} style={{ fontSize: 12, padding: '4px 10px' }}>View →</IBtn>
                        </TD>
                      </tr>
                    );
                  })
            }
          </tbody>
        </Table>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
            <IBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</IBtn>
            <span style={{ fontSize: 13, color: C.inkMid, fontWeight: 600 }}>
              Page {page} of {pagination.pages}
            </span>
            <IBtn onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}>Next →</IBtn>
          </div>
        )}
      </PageBody>

      <CustomerDrawer userId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}