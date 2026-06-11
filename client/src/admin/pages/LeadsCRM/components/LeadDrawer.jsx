import { useState, useEffect } from 'react';
import { C, fmtCurrency, fmtDate } from '../../AnalyticsDashboard/constants.js';
import { Badge, IBtn, DrawerShell, SectionLabel, Empty } from '../../AnalyticsDashboard/Ui.jsx';
import { useLeadDetail } from '../hooks/useLeads.js';

const LEAD_STATUSES = ['new', 'contacted', 'converted'];

const Row = ({ label, children }) => (
  <div style={{ display: 'flex', gap: 12, padding: '7px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
    <span style={{ color: C.inkMid, width: 140, flexShrink: 0 }}>{label}</span>
    <span style={{ color: C.ink, fontWeight: 600, minWidth: 0, overflowWrap: 'anywhere' }}>{children ?? '—'}</span>
  </div>
);

const SpecChip = ({ label, value }) => (
  <div style={{ background: C.bg, borderRadius: C.r, padding: '10px 14px', flex: 1, minWidth: 110 }}>
    <div style={{ fontSize: 10, fontWeight: 600, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    <div style={{ fontSize: 15, fontWeight: 800, color: C.ink, marginTop: 3 }}>{value}</div>
  </div>
);

export default function LeadDrawer({ leadId, onClose, onSave, onDelete, saving }) {
  const { lead, loading, error } = useLeadDetail(leadId);

  const [status, setStatus] = useState('new');
  const [notes,  setNotes]  = useState('');

  useEffect(() => {
    if (lead) {
      setStatus(lead.status ?? 'new');
      setNotes(lead.adminNotes ?? '');
    }
  }, [lead]);

  if (!leadId) return null;

  const sizing     = lead?.sizingSnapshot ?? {};
  const metrics    = sizing.metrics ?? {};
  const chosenTier = (sizing.tiers ?? []).find(t => t.tier === lead?.chosenTier);
  const specs      = chosenTier?.specs ?? {};
  const appliances = Array.isArray(lead?.appliancesSnapshot) ? lead.appliancesSnapshot : [];
  const dirty      = lead && (status !== lead.status || notes !== (lead.adminNotes ?? ''));

  return (
    <DrawerShell open={!!leadId} onClose={onClose} width={560}>
      {/* [0] header */}
      <span>
        Lead — {lead?.name ?? '…'}{' '}
        {lead && <Badge status={lead.status} />}
      </span>

      {/* [1] body */}
      <div>
        {loading && <Empty icon="⏳" message="Loading lead…" />}
        {error   && <Empty icon="⚠" message={error} />}

        {lead && !loading && (
          <>
            <SectionLabel>Contact</SectionLabel>
            <Row label="Name">{lead.name}</Row>
            <Row label="Phone">
              <a href={`tel:${lead.phone}`} style={{ color: C.blue, textDecoration: 'none' }}>{lead.phone}</a>
            </Row>
            <Row label="Email">
              {lead.email || lead.user?.email
                ? <a href={`mailto:${lead.email ?? lead.user?.email}`} style={{ color: C.blue, textDecoration: 'none' }}>
                    {lead.email ?? lead.user?.email}
                  </a>
                : '—'}
            </Row>
            <Row label="Account">{lead.user ? `Registered (${lead.user.email})` : 'Guest'}</Row>
            <Row label="Submitted">{fmtDate(lead.createdAt)}</Row>
            <Row label="Origin">
              <Badge
                status={lead.origin === 'add_to_cart' ? 'processing' : 'pending'}
                label={lead.origin === 'add_to_cart' ? 'Added to cart' : 'Quote request'}
              />
            </Row>

            <SectionLabel>Calculator inputs</SectionLabel>
            <Row label="Location">{lead.location}</Row>
            <Row label="Backup hours">{lead.autonomyHours ? `${lead.autonomyHours}h autonomy` : '—'}</Row>
            <Row label="Battery type">{lead.batteryType}</Row>
            <Row label="Home type">{lead.homeType ?? '—'}</Row>
            <Row label="Critical loads only">{lead.criticalLoadsOnly ? 'Yes' : 'No'}</Row>

            {appliances.length > 0 && (
              <>
                <SectionLabel>Appliances ({appliances.length})</SectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {appliances.map((a, i) => (
                    <span key={i} style={{
                      fontSize: 12, color: C.inkMid, background: C.bg,
                      border: `1px solid ${C.border}`, borderRadius: 99, padding: '3px 10px',
                    }}>
                      {a.name ?? 'Appliance'}{a.qty > 1 ? ` ×${a.qty}` : ''}{a.watts ? ` · ${a.watts}W` : ''}
                    </span>
                  ))}
                </div>
              </>
            )}

            <SectionLabel>Recommended system — {chosenTier?.label ?? lead.chosenTier}</SectionLabel>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {specs.inverter   && <SpecChip label="Inverter"   value={`${specs.inverter.kva} kVA`} />}
              {specs.panels     && <SpecChip label="Panels"     value={`${specs.panels.count} × ${specs.panels.unitWp ?? ''}W`} />}
              {specs.battery    && <SpecChip label="Battery"    value={`${specs.battery.totalKwh ?? specs.battery.units} ${specs.battery.totalKwh ? 'kWh' : 'units'}`} />}
              {specs.controller && <SpecChip label="Controller" value={`${specs.controller.ampere} A`} />}
            </div>
            {metrics.dailyWh != null && (
              <Row label="Daily load">{`${(metrics.dailyWh / 1000).toFixed(1)} kWh / day · ${metrics.peakWatts ?? '—'}W peak`}</Row>
            )}
            <Row label="Estimated value">
              <span style={{ fontSize: 15, fontWeight: 800 }}>{fmtCurrency(lead.chosenTotal)}</span>
            </Row>

            <SectionLabel>CRM</SectionLabel>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.inkMid, marginBottom: 6 }}>
              Status
            </label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {LEAD_STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  style={{
                    padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', fontFamily: C.font, textTransform: 'capitalize',
                    border: `1px solid ${status === s ? C.amber : C.border}`,
                    background: status === s ? '#FFF7E6' : C.surface,
                    color: status === s ? '#A16207' : C.inkMid,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.inkMid, marginBottom: 6 }}>
              Admin notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Call notes, follow-up reminders…"
              rows={4}
              style={{
                width: '100%', padding: '10px 12px', fontSize: 13, fontFamily: C.font,
                color: C.ink, border: `1px solid ${C.border}`, borderRadius: C.r,
                resize: 'vertical', background: C.surface,
              }}
            />
          </>
        )}
      </div>

      {/* [2] footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <IBtn variant="danger" onClick={() => onDelete(lead)} disabled={!lead || saving}>
          Delete
        </IBtn>
        <div style={{ display: 'flex', gap: 8 }}>
          <IBtn onClick={onClose} disabled={saving}>Close</IBtn>
          <IBtn
            variant="primary"
            disabled={!lead || !dirty || saving}
            onClick={() => onSave(lead.id, { status, adminNotes: notes })}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </IBtn>
        </div>
      </div>
    </DrawerShell>
  );
}
