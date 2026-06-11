import { useState } from 'react';
import { C, fmtDate } from '../AnalyticsDashboard/constants.js';
import { PageHeader, PageBody, StatCard, IBtn, SearchInput, Toast, GlobalStyles, Empty, Table, TH, TD, SkeletonRows, Pill } from '../AnalyticsDashboard/Ui.jsx';
import { useSupport } from './hooks/useSupport.js';
import TicketDrawer from './components/TicketDrawer.jsx';

const SCOL = {
  open:             { bg: '#DBEAFE', text: '#2563EB' },
  in_progress:      { bg: '#FEF9C3', text: '#A16207' },
  waiting_customer: { bg: '#FFEDD5', text: '#EA580C' },
  resolved:         { bg: '#DCFCE7', text: '#16A34A' },
  closed:           { bg: '#F3F4F6', text: '#6B7280' },
};
const PCOL = {
  low:    { bg: '#F3F4F6', text: '#6B7280' },
  medium: { bg: '#DBEAFE', text: '#2563EB' },
  high:   { bg: '#FFEDD5', text: '#EA580C' },
  urgent: { bg: '#FEE2E2', text: '#DC2626' },
};

const SBadge = ({ val, map }) => {
  const col = map[val] ?? { bg: C.border, text: C.inkMid };
  return (
    <span style={{ background: col.bg, color: col.text, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
      {(val ?? '—').replace(/_/g, ' ')}
    </span>
  );
};

export default function SupportDesk() {
  const h = useSupport();
  const [selectedId, setSelectedId] = useState(null);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, color: C.ink }}>
      <GlobalStyles />
      {h.toast && <Toast msg={h.toast.msg} type={h.toast.type} />}

      <PageHeader
        title="Support"
        subtitle="Tickets, complaints & requests"
        actions={<IBtn onClick={h.load} disabled={h.loading}>{h.loading ? 'Loading…' : '↻ Refresh'}</IBtn>}
      />

      <PageBody>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <StatCard label="Open"        value={(h.stats?.byStatus?.open        ?? 0).toLocaleString()} sub="Awaiting response"   accent={C.blue}  loading={!h.stats} />
          <StatCard label="In Progress" value={(h.stats?.byStatus?.in_progress ?? 0).toLocaleString()} sub="Being worked on"     accent={C.amber} loading={!h.stats} />
          <StatCard label="Unassigned"  value={(h.stats?.unassigned            ?? 0).toLocaleString()} sub="Need an assignee"    accent={C.red}   loading={!h.stats} />
          <StatCard label="Resolved"    value={(h.stats?.byStatus?.resolved    ?? 0).toLocaleString()} sub="Closed successfully" accent={C.green} loading={!h.stats} />
        </div>

        {/* Filters */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
          padding: '12px 16px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
        }}>
          <SearchInput value={h.search} onChange={v => { h.setSearch(v); h.setPage(1); }} placeholder="Search tickets…" />

          {/* Status filter */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {['', 'open', 'in_progress', 'waiting_customer', 'resolved', 'closed'].map(s => (
              <Pill key={s} label={s ? s.replace(/_/g, ' ') : 'All'} active={h.status === s} onClick={() => { h.setStatus(s); h.setPage(1); }} />
            ))}
          </div>

          {/* Priority filter */}
          <div style={{ display: 'flex', gap: 5 }}>
            {['', 'urgent', 'high', 'medium', 'low'].map(p => (
              <Pill key={p} label={p || 'Any priority'} active={h.priority === p} onClick={() => { h.setPriority(p); h.setPage(1); }} />
            ))}
          </div>

          {/* Unassigned toggle */}
          <button onClick={() => { h.setUnassigned(u => !u); h.setPage(1); }} style={{
            padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            border: `1px solid ${h.unassigned ? C.red : C.border}`,
            background: h.unassigned ? '#FEE2E2' : C.surface,
            color: h.unassigned ? C.red : C.inkMid,
            fontFamily: C.font,
          }}>
            {h.unassigned ? '✓' : ''} Unassigned only
          </button>
        </div>

        {h.error && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: C.r, padding: '12px 16px', margin: '12px 0', color: C.red, fontSize: 13, fontWeight: 600 }}>
            ⚠ {h.error}
          </div>
        )}

        <Table>
          <thead>
            <tr>
              <TH>Ticket</TH>
              <TH>Subject</TH>
              <TH>Requester</TH>
              <TH>Type</TH>
              <TH>Priority</TH>
              <TH>Status</TH>
              <TH>Assignee</TH>
              <TH>Opened</TH>
              <TH />
            </tr>
          </thead>
          <tbody>
            {h.loading
              ? <SkeletonRows cols={9} rows={8} />
              : h.tickets.length === 0
                ? <tr><td colSpan={9}><Empty icon="🎫" message="No tickets found" /></td></tr>
                : h.tickets.map(t => {
                    const assigneeName = t.assignee
                      ? [t.assignee.firstName, t.assignee.lastName].filter(Boolean).join(' ')
                      : null;
                    return (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedId(t.id)}
                        style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = C.surfaceHov}
                        onMouseLeave={e => e.currentTarget.style.background = ''}
                      >
                        <TD>
                          <span style={{ fontWeight: 700, fontSize: 12, fontFamily: 'monospace', color: C.ink }}>
                            {t.ticketNumber}
                          </span>
                        </TD>
                        <TD style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 600 }}>{t.subject}</span>
                        </TD>
                        <TD>
                          <div style={{ fontSize: 13 }}>{t.requester?.firstName ?? t.requesterName ?? 'Guest'}</div>
                          <div style={{ fontSize: 11, color: C.inkFaint }}>{t.requesterEmail}</div>
                        </TD>
                        <TD style={{ color: C.inkMid, fontSize: 12 }}>{t.type?.replace(/_/g, ' ')}</TD>
                        <TD><SBadge val={t.priority} map={PCOL} /></TD>
                        <TD><SBadge val={t.status}   map={SCOL} /></TD>
                        <TD>
                          {assigneeName
                            ? <span style={{ fontSize: 12, fontWeight: 600 }}>{assigneeName}</span>
                            : <span style={{ fontSize: 11, color: C.inkFaint, fontStyle: 'italic' }}>Unassigned</span>
                          }
                        </TD>
                        <TD style={{ fontSize: 12, color: C.inkMid }}>{fmtDate(t.createdAt)}</TD>
                        <TD>
                          <IBtn onClick={e => { e.stopPropagation(); setSelectedId(t.id); }} style={{ fontSize: 12, padding: '4px 10px' }}>
                            Open →
                          </IBtn>
                        </TD>
                      </tr>
                    );
                  })
            }
          </tbody>
        </Table>

        {h.pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
            <IBtn onClick={() => h.setPage(p => Math.max(1, p - 1))}                         disabled={h.page === 1}>← Prev</IBtn>
            <span style={{ fontSize: 13, color: C.inkMid, fontWeight: 600 }}>Page {h.page} of {h.pagination.pages}</span>
            <IBtn onClick={() => h.setPage(p => Math.min(h.pagination.pages, p + 1))} disabled={h.page === h.pagination.pages}>Next →</IBtn>
          </div>
        )}
      </PageBody>

      <TicketDrawer
        ticketId={selectedId}
        onClose={() => setSelectedId(null)}
        onStatusChange={async (id, status) => { await h.updateStatus(id, status); }}
        onMessage={async (id, body, isInternal) => { await h.sendMessage(id, body, isInternal); }}
        onTagUpdate={async (id, tags) => { await h.updateTags(id, tags); }}
      />
    </div>
  );
}