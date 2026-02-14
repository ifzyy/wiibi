import { useState } from 'react';
import { api } from '../utils/api.js';
import { Icon, I } from '../utils/icons.jsx';
import { toast } from 'react-toastify';

const Field = ({ label, hint, children }) => (
  <div>
    <div className="flex items-baseline justify-between mb-2">
      <label className="text-stone-700 text-[13px] font-semibold">{label}</label>
      {hint && <span className="text-stone-400 text-[11px]">{hint}</span>}
    </div>
    {children}
  </div>
);

const Input = ({ value, onChange, placeholder = '', type = 'text' }) => (
  <input
    type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-900 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 focus:bg-white transition-all"
  />
);

const Card = ({ title, icon, children }) => (
  <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-stone-100">
      <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center">
        <Icon d={icon} size={14} stroke="#78716c" />
      </div>
      <h3 className="text-stone-800 font-bold text-[13px]">{title}</h3>
    </div>
    <div className="p-6 space-y-4">{children}</div>
  </div>
);

export const SettingsPage = () => {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    site_name:          'Wiibi Energy',
    tagline:            'Clean, reliable solar solutions for every home',
    contact_email:      'hello@wiibienergy.com',
    contact_phone:      '+234 800 000 0000',
    whatsapp_number:    '+234 800 000 0000',
    address:            'Lagos, Nigeria',
    social_instagram:   '',
    social_facebook:    '',
    social_twitter:     '',
    social_linkedin:    '',
    footer_about:       'Wiibi Energy provides affordable solar and power solutions for homes and businesses across Nigeria.',
    meta_title_default: 'Wiibi Energy — Solar Solutions',
    meta_description:   'Affordable solar energy solutions for every Nigerian home and business.',
    google_analytics:   '',
    primary_color:      '#FFAA14',
  });
  const u = (k, v) => setSettings(s => ({ ...s, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await api.put(`/admin/global-settings/${key}`, { value }).catch(() => {});
      }
      toast.success('✓ Settings saved');
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  return (
    <div className="h-full overflow-y-auto bg-stone-50">
      <div className="max-w-2xl mx-auto p-8 space-y-5">

        <Card title="Site Identity" icon={I.home}>
          <Field label="Site Name">
            <Input value={settings.site_name} onChange={v => u('site_name', v)} placeholder="Wiibi Energy" />
          </Field>
          <Field label="Tagline" hint="Shown in header/footer">
            <Input value={settings.tagline} onChange={v => u('tagline', v)} placeholder="Clean, reliable solar…" />
          </Field>
          <Field label="Primary Brand Color" hint="Used for buttons and accents">
            <div className="flex items-center gap-3">
              <input
                type="color" value={settings.primary_color} onChange={e => u('primary_color', e.target.value)}
                className="w-12 h-10 rounded-xl border border-stone-200 cursor-pointer bg-stone-50"
              />
              <Input value={settings.primary_color} onChange={v => u('primary_color', v)} placeholder="#FFAA14" />
            </div>
          </Field>
          <Field label="Footer About Text">
            <textarea
              value={settings.footer_about} onChange={e => u('footer_about', e.target.value)} rows={3}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-900 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 focus:bg-white resize-none transition-all"
              placeholder="Short description for footer…"
            />
          </Field>
        </Card>

        <Card title="Contact Details" icon={I.link}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email">
              <Input value={settings.contact_email} onChange={v => u('contact_email', v)} type="email" placeholder="hello@…" />
            </Field>
            <Field label="Phone">
              <Input value={settings.contact_phone} onChange={v => u('contact_phone', v)} placeholder="+234…" />
            </Field>
          </div>
          <Field label="WhatsApp Number" hint="Used for WhatsApp chat link">
            <Input value={settings.whatsapp_number} onChange={v => u('whatsapp_number', v)} placeholder="+234…" />
          </Field>
          <Field label="Address">
            <Input value={settings.address} onChange={v => u('address', v)} placeholder="City, State, Country" />
          </Field>
        </Card>

        <Card title="Social Media" icon={I.users}>
          <div className="grid grid-cols-2 gap-4">
            {[
              { k: 'social_instagram', label: 'Instagram', ph: 'https://instagram.com/…' },
              { k: 'social_facebook',  label: 'Facebook',  ph: 'https://facebook.com/…'  },
              { k: 'social_twitter',   label: 'Twitter/X', ph: 'https://twitter.com/…'   },
              { k: 'social_linkedin',  label: 'LinkedIn',  ph: 'https://linkedin.com/…'  },
            ].map(({ k, label, ph }) => (
              <Field key={k} label={label}>
                <Input value={settings[k]} onChange={v => u(k, v)} placeholder={ph} />
              </Field>
            ))}
          </div>
        </Card>

        <Card title="SEO Defaults" icon={I.tag}>
          <Field label="Default Meta Title" hint="Used when page has no custom title">
            <Input value={settings.meta_title_default} onChange={v => u('meta_title_default', v)} placeholder="Wiibi Energy — Solar Solutions" />
          </Field>
          <Field label="Default Meta Description">
            <textarea
              value={settings.meta_description} onChange={e => u('meta_description', e.target.value)} rows={2}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-900 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none transition-all"
              placeholder="Affordable solar energy solutions…"
            />
          </Field>
          <Field label="Google Analytics ID" hint="e.g. G-XXXXXXXXXX">
            <Input value={settings.google_analytics} onChange={v => u('google_analytics', v)} placeholder="G-XXXXXXXXXX" />
          </Field>
        </Card>

        <button
          onClick={save} disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white py-4 rounded-2xl font-black text-sm transition-all shadow-sm disabled:opacity-50"
        >
          {saving
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
            : <><Icon d={I.save} size={16} />Save all settings</>
          }
        </button>

        {/* Danger zone */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <h3 className="text-red-700 font-bold text-[13px] mb-3 flex items-center gap-2">
            <Icon d={I.alert} size={14} stroke="#b91c1c" /> Danger Zone
          </h3>
          <p className="text-red-600 text-[12px] mb-4">These actions are irreversible. Be careful.</p>
          <div className="flex gap-3">
            <button className="bg-white border border-red-200 text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl text-[12px] font-bold transition-all">
              Clear site cache
            </button>
            <button className="bg-white border border-red-200 text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl text-[12px] font-bold transition-all">
              Reset all content
            </button>
          </div>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
};
