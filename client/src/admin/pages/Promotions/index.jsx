/**
 * Promotions — admin section to manage the site-wide announcement banner and
 * promo codes.
 *
 *  Banner  → stored in global_settings key `promo_banner` (public), edited via
 *            PUT /admin/global-settings/promo_banner. PromoHeader renders it.
 *  Codes   → CRUD via /admin/promos. Validated + applied at checkout server-side.
 */
import { useState, useEffect, useCallback } from 'react';
import { C, fmtCurrency, fmtDate } from '../AnalyticsDashboard/constants.js';
import {
  PageHeader, PageBody, IBtn, Toast, GlobalStyles, Empty, Table, TH, TD, Badge, DrawerShell,
} from '../AnalyticsDashboard/Ui.jsx';
import { api } from '../../../utils/api.js';

const BANNER_KEY = 'promo_banner';
const DEFAULT_BANNER = {
  enabled: false, text: '', linkUrl: '/store',
  bgColor: '#1A1102', textColor: '#FFFFFF', accentColor: '#FFAA14',
};

const field = {
  width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: C.rSm,
  fontSize: 13, color: C.ink, background: C.surface, fontFamily: C.font, boxSizing: 'border-box',
};
const Label = ({ children }) => (
  <span style={{ fontSize: 11, fontWeight: 700, color: C.inkMid, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>
    {children}
  </span>
);

/* ── Banner editor ───────────────────────────────────────────────────────── */
const BannerEditor = ({ toast }) => {
  const [banner, setBanner] = useState(DEFAULT_BANNER);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/global-settings')
      .then((r) => {
        const rows = r.data?.data ?? r.data ?? [];
        const row = Array.isArray(rows) ? rows.find((s) => s.key === BANNER_KEY) : null;
        if (row?.value) setBanner({ ...DEFAULT_BANNER, ...row.value });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => setBanner((b) => ({ ...b, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/global-settings/${BANNER_KEY}`, { value: banner });
      toast('Banner saved');
    } catch (e) {
      toast(e?.response?.data?.message ?? 'Failed to save banner', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ height: 120, background: C.border, borderRadius: 14, animation: 'pulse 1.4s ease-in-out infinite' }} />;

  return (
    <section style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '22px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: C.ink, margin: 0 }}>Announcement banner</h2>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: C.inkMid, cursor: 'pointer' }}>
          <input type="checkbox" checked={banner.enabled} onChange={(e) => setBanner((b) => ({ ...b, enabled: e.target.checked }))} />
          {banner.enabled ? 'Showing on site' : 'Hidden'}
        </label>
      </div>
      <p style={{ fontSize: 12, color: C.inkFaint, margin: '0 0 18px' }}>Bar shown at the top of every page. Turn off to hide it sitewide.</p>

      {/* Live preview */}
      <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 18, opacity: banner.enabled ? 1 : 0.5 }}>
        <div style={{ background: banner.bgColor, color: banner.textColor, textAlign: 'center', padding: '12px 16px', fontSize: 14, fontWeight: 600 }}>
          🎉 {banner.text || 'Your announcement text…'}
          <span style={{ color: banner.accentColor, marginLeft: 6 }}>›</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <Label>Banner text</Label>
          <input style={field} value={banner.text} onChange={set('text')} placeholder="New Year Promo — 15% off with code NEWYEAR15" maxLength={160} />
        </div>
        <div>
          <Label>Link URL</Label>
          <input style={field} value={banner.linkUrl} onChange={set('linkUrl')} placeholder="/store" />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {[['bgColor', 'Background'], ['textColor', 'Text'], ['accentColor', 'Accent']].map(([k, lbl]) => (
            <div key={k}>
              <Label>{lbl}</Label>
              <input type="color" value={banner[k]} onChange={set(k)} style={{ width: 44, height: 38, border: `1px solid ${C.border}`, borderRadius: C.rSm, background: C.surface, cursor: 'pointer', padding: 2 }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
        <IBtn variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save banner'}</IBtn>
      </div>
    </section>
  );
};

/* ── Promo code modal ────────────────────────────────────────────────────── */
const BLANK = {
  code: '', description: '', discountType: 'percentage', discountValue: '',
  maxDiscount: '', minOrderAmount: '', usageLimit: '', expiresAt: '', isActive: true,
};

const PromoModal = ({ promo, onClose, onSaved, toast }) => {
  const isEdit = !!promo;
  const [form, setForm] = useState(promo ? {
    ...BLANK, ...promo,
    discountValue:  promo.discountValue ?? '',
    maxDiscount:    promo.maxDiscount ?? '',
    minOrderAmount: promo.minOrderAmount ?? '',
    usageLimit:     promo.usageLimit ?? '',
    expiresAt:      promo.expiresAt ? promo.expiresAt.slice(0, 10) : '',
  } : BLANK);
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        description:    form.description || null,
        discountType:   form.discountType,
        discountValue:  Number(form.discountValue) || 0,
        maxDiscount:    form.maxDiscount !== '' ? Number(form.maxDiscount) : null,
        minOrderAmount: form.minOrderAmount !== '' ? Number(form.minOrderAmount) : 0,
        usageLimit:     form.usageLimit !== '' ? Number(form.usageLimit) : null,
        expiresAt:      form.expiresAt || null,
        isActive:       form.isActive,
      };
      if (isEdit) {
        await api.patch(`/admin/promos/${promo.id}`, payload);
        toast('Promo code updated');
      } else {
        await api.post('/admin/promos', { ...payload, code: form.code });
        toast('Promo code created');
      }
      onSaved();
      onClose();
    } catch (e) {
      toast(e?.response?.data?.message ?? 'Failed to save promo code', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DrawerShell open onClose={onClose} width={460}>
      <span>{isEdit ? `Edit ${promo.code}` : 'New promo code'}</span>
      <div>
        {!isEdit && (
          <div style={{ marginBottom: 14 }}>
            <Label>Code</Label>
            <input style={{ ...field, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }} value={form.code} onChange={set('code')} placeholder="NEWYEAR15" maxLength={40} />
          </div>
        )}
        <div style={{ marginBottom: 14 }}>
          <Label>Description (shown to customer)</Label>
          <input style={field} value={form.description} onChange={set('description')} placeholder="15% off your order" maxLength={200} />
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <Label>Type</Label>
            <select style={field} value={form.discountType} onChange={set('discountType')}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed amount (₦)</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <Label>{form.discountType === 'percentage' ? 'Percent off' : 'Amount off (₦)'}</Label>
            <input style={field} type="number" value={form.discountValue} onChange={set('discountValue')} placeholder={form.discountType === 'percentage' ? '15' : '5000'} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          {form.discountType === 'percentage' && (
            <div style={{ flex: 1 }}>
              <Label>Max discount (₦, optional)</Label>
              <input style={field} type="number" value={form.maxDiscount} onChange={set('maxDiscount')} placeholder="No cap" />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <Label>Min order (₦, optional)</Label>
            <input style={field} type="number" value={form.minOrderAmount} onChange={set('minOrderAmount')} placeholder="0" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <Label>Usage limit (optional)</Label>
            <input style={field} type="number" value={form.usageLimit} onChange={set('usageLimit')} placeholder="Unlimited" />
          </div>
          <div style={{ flex: 1 }}>
            <Label>Expires (optional)</Label>
            <input style={field} type="date" value={form.expiresAt} onChange={set('expiresAt')} />
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: C.inkMid, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
          Active
        </label>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <IBtn onClick={onClose} disabled={saving}>Cancel</IBtn>
        <IBtn variant="primary" onClick={save} disabled={saving || (!isEdit && !form.code.trim()) || !form.discountValue}>
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create code'}
        </IBtn>
      </div>
    </DrawerShell>
  );
};

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function Promotions() {
  const [promos, setPromos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);   // null | 'new' | promo object
  const [toast, setToast]     = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/admin/promos')
      .then((r) => setPromos(r.data?.data ?? r.data ?? []))
      .catch(() => setPromos([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (promo) => {
    if (!window.confirm(`Delete promo code ${promo.code}? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/promos/${promo.id}`);
      setPromos((p) => p.filter((x) => x.id !== promo.id));
      showToast('Promo code deleted');
    } catch (e) {
      showToast(e?.response?.data?.message ?? 'Failed to delete', 'error');
    }
  };

  const discountLabel = (p) =>
    p.discountType === 'percentage'
      ? `${Number(p.discountValue)}%${p.maxDiscount ? ` (max ${fmtCurrency(p.maxDiscount)})` : ''}`
      : fmtCurrency(p.discountValue);

  const statusOf = (p) => {
    if (!p.isActive) return { label: 'Inactive', status: 'closed' };
    if (p.expiresAt && new Date(p.expiresAt) < new Date()) return { label: 'Expired', status: 'failed' };
    if (p.usageLimit != null && p.usedCount >= p.usageLimit) return { label: 'Used up', status: 'failed' };
    return { label: 'Active', status: 'paid' };
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, color: C.ink }}>
      <GlobalStyles />
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <PageHeader
        title="Promotions"
        subtitle="Announcement banner & checkout promo codes"
        actions={<IBtn variant="primary" onClick={() => setModal('new')}>+ New promo code</IBtn>}
      />

      <PageBody>
        <BannerEditor toast={showToast} />

        <section style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}` }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: C.ink, margin: 0 }}>Promo codes</h2>
            <p style={{ fontSize: 12, color: C.inkFaint, margin: '4px 0 0' }}>Customers enter these at checkout for a discount on their order.</p>
          </div>

          <Table>
            <thead>
              <tr>
                <TH>Code</TH><TH>Discount</TH><TH>Min order</TH><TH>Used</TH><TH>Expires</TH><TH>Status</TH><TH />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div style={{ padding: 40, textAlign: 'center', color: C.inkFaint }}>Loading…</div></td></tr>
              ) : promos.length === 0 ? (
                <tr><td colSpan={7}><Empty icon="🏷️" message="No promo codes yet — create one to run a sale" /></td></tr>
              ) : promos.map((p) => {
                const st = statusOf(p);
                return (
                  <tr key={p.id}>
                    <TD><span style={{ fontWeight: 800, letterSpacing: '0.04em' }}>{p.code}</span>{p.description && <div style={{ fontSize: 11, color: C.inkFaint }}>{p.description}</div>}</TD>
                    <TD>{discountLabel(p)}</TD>
                    <TD style={{ color: C.inkMid }}>{Number(p.minOrderAmount) > 0 ? fmtCurrency(p.minOrderAmount) : '—'}</TD>
                    <TD style={{ color: C.inkMid }}>{p.usedCount}{p.usageLimit != null ? ` / ${p.usageLimit}` : ''}</TD>
                    <TD style={{ color: C.inkMid, fontSize: 12 }}>{p.expiresAt ? fmtDate(p.expiresAt) : '—'}</TD>
                    <TD><Badge label={st.label} status={st.status} /></TD>
                    <TD style={{ whiteSpace: 'nowrap' }}>
                      <IBtn onClick={() => setModal(p)} style={{ fontSize: 12, padding: '4px 10px', marginRight: 6 }}>Edit</IBtn>
                      <IBtn variant="danger" onClick={() => remove(p)} style={{ fontSize: 12, padding: '4px 10px' }}>Delete</IBtn>
                    </TD>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </section>
      </PageBody>

      {modal && (
        <PromoModal
          promo={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={load}
          toast={showToast}
        />
      )}
    </div>
  );
}
