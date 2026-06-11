import { useState } from 'react';
import { C, fmtCurrency, fmtDateShort } from '../AnalyticsDashboard/constants.js';
import {
  PageHeader, PageBody, StatCard, IBtn, Pill, SearchInput,
  Toast, GlobalStyles, Empty, Table, TH, TD, SkeletonRows, Badge,
} from '../AnalyticsDashboard/Ui.jsx';
import { useLeads } from './hooks/useLeads.js';
import LeadDrawer from './components/LeadDrawer.jsx';

const STATUS_FILTERS = [
  { key: 'all',       label: 'All'       },
  { key: 'new',       label: 'New'       },
  { key: 'contacted', label: 'Contacted' },
  { key: 'converted', label: 'Converted' },
];

const ORIGIN_LABELS = {
  request_quote: 'Quote request',
  add_to_cart:   'Added to cart',
};

export default function LeadsCRM() {
  const {
    leads, stats, pagination, loading, error, toast,
    page, setPage,
    search, setSearch,
    filterStatus, setFilterStatus,
    filterOrigin, setFilterOrigin,
    hasActiveFilters, clearFilters,
    load, updateLead, deleteLead, showToast,
  } = useLeads();

  const [selectedId, setSelectedId] = useState(null);
  const [saving,     setSaving]     = useState(false);

  const handleSave = async (id, updates) => {
    setSaving(true);
    try {
      await updateLead(id, updates);
      setSelectedId(null);
    } catch (e) {
      showToast(e?.response?.data?.message ?? 'Failed to update lead', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lead) => {
    if (!lead) return;
    if (!window.confirm(`Delete lead "${lead.name}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await deleteLead(lead.id);
      setSelectedId(null);
    } catch (e) {
      showToast(e?.response?.data?.message ?? 'Failed to delete lead', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, color: C.ink }}>
      <GlobalStyles />
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <PageHeader
        title="Leads"
        subtitle="Solar calculator quote requests — follow up and convert"
        actions={<IBtn onClick={load} disabled={loading}>{loading ? 'Loading…' : '↻ Refresh'}</IBtn>}
      />

      <PageBody>
        {/* ── Stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <StatCard label="Total Leads" value={(stats?.total     ?? 0).toLocaleString()} sub="All time"            loading={!stats} />
          <StatCard label="New"         value={(stats?.new       ?? 0).toLocaleString()} sub="Awaiting first contact" accent={C.blue}  loading={!stats} />
          <StatCard label="Contacted"   value={(stats?.contacted ?? 0).toLocaleString()} sub="Follow-up in progress"  accent={C.amber} loading={!stats} />
          <StatCard label="Converted"   value={(stats?.converted ?? 0).toLocaleString()} sub="Became customers"       accent={C.green} loading={!stats} />
        </div>

        {error && (
          <div style={{ background: C.redBg, border: '1px solid #FCA5A5', borderRadius: C.r, padding: '12px 16px', color: C.red, fontSize: 13, fontWeight: 600 }}>
            ⚠ {error} — <button onClick={load} style={{ background: 'none', border: 'none', color: C.red, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
          </div>
        )}

        {/* ── Filter bar ── */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        }}>
          <SearchInput
            value={search}
            onChange={v => { setSearch(v); setPage(1); }}
            placeholder="Search name, phone, email…"
          />
          <div style={{ display: 'flex', gap: 6 }}>
            {STATUS_FILTERS.map(f => (
              <Pill
                key={f.key}
                label={f.label}
                active={filterStatus === f.key}
                onClick={() => { setFilterStatus(f.key); setPage(1); }}
              />
            ))}
          </div>
          <select
            value={filterOrigin}
            onChange={e => { setFilterOrigin(e.target.value); setPage(1); }}
            style={{
              padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: C.rSm,
              fontSize: 12, fontWeight: 600, color: C.inkMid, background: C.surface, fontFamily: C.font,
            }}
          >
            <option value="all">All origins</option>
            <option value="request_quote">Quote request</option>
            <option value="add_to_cart">Added to cart</option>
          </select>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{ background: 'none', border: 'none', color: C.inkMid, fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Clear filters
            </button>
          )}
          <span style={{ fontSize: 12, color: C.inkFaint, marginLeft: 'auto' }}>
            {pagination.total} lead{pagination.total !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Table ── */}
        <Table>
          <thead>
            <tr>
              <TH>Lead</TH>
              <TH>Contact</TH>
              <TH>Location</TH>
              <TH>System</TH>
              <TH>Est. value</TH>
              <TH>Origin</TH>
              <TH>Status</TH>
              <TH>Date</TH>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <SkeletonRows cols={8} rows={8} />
              : leads.length === 0
                ? <tr><td colSpan={8}><Empty icon="☀️" message={hasActiveFilters ? 'No leads match these filters' : 'No leads yet — they appear when visitors request a quote from the solar calculator'} /></td></tr>
                : leads.map(lead => {
                    const inverterKva = (lead.sizingSnapshot?.tiers ?? [])
                      .find(t => t.tier === lead.chosenTier)?.specs?.inverter?.kva;
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => setSelectedId(lead.id)}
                        style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = C.surfaceHov}
                        onMouseLeave={e => e.currentTarget.style.background = ''}
                      >
                        <TD>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.amberLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: C.amber, flexShrink: 0 }}>
                              {(lead.name?.[0] ?? '?').toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 700, color: C.ink }}>{lead.name}</span>
                          </div>
                        </TD>
                        <TD style={{ color: C.inkMid }}>
                          <div>{lead.phone}</div>
                          {(lead.email ?? lead.user?.email) && (
                            <div style={{ fontSize: 11, color: C.inkFaint }}>{lead.email ?? lead.user?.email}</div>
                          )}
                        </TD>
                        <TD style={{ color: C.inkMid }}>{lead.location}</TD>
                        <TD style={{ color: C.inkMid, fontSize: 12 }}>
                          {inverterKva ? `${inverterKva} kVA · ` : ''}{lead.chosenTier}
                        </TD>
                        <TD style={{ fontWeight: 700 }}>{fmtCurrency(lead.chosenTotal)}</TD>
                        <TD style={{ color: C.inkMid, fontSize: 12 }}>{ORIGIN_LABELS[lead.origin] ?? lead.origin}</TD>
                        <TD><Badge status={lead.status} /></TD>
                        <TD style={{ color: C.inkMid, fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDateShort(lead.createdAt)}</TD>
                      </tr>
                    );
                  })
            }
          </tbody>
        </Table>

        {/* ── Pagination ── */}
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

      <LeadDrawer
        leadId={selectedId}
        onClose={() => setSelectedId(null)}
        onSave={handleSave}
        onDelete={handleDelete}
        saving={saving}
      />
    </div>
  );
}
