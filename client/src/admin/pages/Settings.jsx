/**
 * Admin → Settings
 *
 * Every field here drives a real place on the live website:
 *   site_name        → Nav brand text, Footer brand + copyright
 *   footer_about     → Footer about paragraph
 *   address          → Footer address block
 *   contact_email    → Footer "Contact Us" email link
 *   contact_phone    → Footer phone link
 *   whatsapp_number  → Footer WhatsApp link + social icon (wa.me)
 *   social_tiktok / social_instagram / social_facebook → Footer social icons
 *   delivery_fee     → default checkout delivery fee (products can override)
 *
 * Values load from /admin/global-settings on mount and save via upsert, so
 * edits persist and appear on the storefront on the next page load.
 */
import { useState, useEffect } from "react";
import { api } from "../utils/api.js";
import { Icon, I } from "../utils/icons.jsx";
import { toast } from "react-toastify";

const Field = ({ label, hint, children }) => (
  <div>
    <div className="flex items-baseline justify-between mb-2">
      <label className="text-gray-700 text-[13px] font-semibold">{label}</label>
      {hint && <span className="text-gray-400 text-[11px]">{hint}</span>}
    </div>
    {children}
  </div>
);

const inputCls =
  "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm " +
  "placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-300 " +
  "focus:border-amber-300 focus:bg-white transition-all";

const Input = ({ value, onChange, placeholder = "", type = "text" }) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={inputCls}
  />
);

const Card = ({ title, icon, children }) => (
  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
      <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
        <Icon d={icon} size={14} stroke="#B45309" />
      </div>
      <h3 className="text-gray-800 font-bold text-[13px]">{title}</h3>
    </div>
    <div className="p-6 space-y-4">{children}</div>
  </div>
);

export const SettingsPage = () => {
  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    site_name:        "Wiibi Energy",
    footer_about:     "",
    contact_email:    "",
    contact_phone:    "",
    whatsapp_number:  "",
    address:          "",
    social_tiktok:    "",
    social_instagram: "",
    social_facebook:  "",
    delivery_fee:     0,
    dispatch_location: "",
  });
  const u = (k, v) => setSettings((s) => ({ ...s, [k]: v }));

  // Load saved values — only primitives are merged; some settings rows hold
  // objects/arrays managed by other editors (footer.columns etc.).
  useEffect(() => {
    api.get("/admin/global-settings")
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : [];
        setSettings((s) => {
          const next = { ...s };
          for (const row of rows) {
            if (row.key in next && ["string", "number", "boolean"].includes(typeof row.value)) {
              next[row.key] = row.value;
            }
          }
          return next;
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        // delivery_fee feeds checkout math — store it as a number
        const v = key === "delivery_fee" ? (Number(value) || 0) : value;
        await api.put(`/admin/global-settings/${key}`, { value: v });
      }
      toast.success("Settings saved — live on the next page load");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-gray-50">
        <div className="max-w-2xl mx-auto p-8 space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 h-44 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto p-8 space-y-5">

        <div>
          <h1 className="text-xl font-black text-gray-900 m-0">Site Settings</h1>
          <p className="text-[13px] text-gray-400 mt-1 m-0">
            Everything here updates the live website — header, footer, and checkout.
          </p>
        </div>

        <Card title="Site Identity" icon={I.home}>
          <Field label="Site Name" hint="header brand, footer, copyright">
            <Input
              value={settings.site_name}
              onChange={(v) => u("site_name", v)}
              placeholder="Wiibi Energy"
            />
          </Field>
          <Field label="Footer About Text" hint="short paragraph under the footer logo">
            <textarea
              value={settings.footer_about}
              onChange={(e) => u("footer_about", e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
              placeholder="Wiibi Energy provides affordable solar and power solutions…"
            />
          </Field>
        </Card>

        <Card title="Commerce" icon={I.creditCard}>
          <Field
            label="Default Delivery Fee (₦)"
            hint="added to orders at checkout — 0 = free delivery"
          >
            <Input
              type="number"
              value={settings.delivery_fee}
              onChange={(v) => u("delivery_fee", v)}
              placeholder="e.g. 5000"
            />
          </Field>
          <p className="text-[11px] text-gray-400 leading-relaxed m-0">
            Adjust anytime for price changes — new orders use the current fee
            immediately; past orders keep what they were charged. Individual
            products can override this in the catalog (orders charge the
            highest fee among the items in the cart).
          </p>
          <Field
            label="Dispatch Location"
            hint='shown as "From" on customer order tracking'
          >
            <Input
              value={settings.dispatch_location}
              onChange={(v) => u("dispatch_location", v)}
              placeholder="e.g. Ojodu Berger, Lagos"
            />
          </Field>
        </Card>

        <Card title="Contact Details" icon={I.link}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email" hint="footer contact link">
              <Input
                value={settings.contact_email}
                onChange={(v) => u("contact_email", v)}
                type="email"
                placeholder="hello@wiibienergy.com"
              />
            </Field>
            <Field label="Phone" hint="footer phone link">
              <Input
                value={settings.contact_phone}
                onChange={(v) => u("contact_phone", v)}
                placeholder="+234…"
              />
            </Field>
          </div>
          <Field label="WhatsApp Number" hint="footer WhatsApp chat link">
            <Input
              value={settings.whatsapp_number}
              onChange={(v) => u("whatsapp_number", v)}
              placeholder="+234…"
            />
          </Field>
          <Field label="Address" hint="footer address block">
            <textarea
              value={settings.address}
              onChange={(e) => u("address", e.target.value)}
              rows={2}
              className={`${inputCls} resize-none`}
              placeholder={"1, Olaoluwa Street\nOff Adebowale Road, Ojodu"}
            />
          </Field>
        </Card>

        <Card title="Social Media" icon={I.users}>
          <p className="text-[11px] text-gray-400 m-0 -mt-1">
            Icons appear in the footer only when a link is filled in.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { k: "social_tiktok",    label: "TikTok",    ph: "https://tiktok.com/@…"    },
              { k: "social_instagram", label: "Instagram", ph: "https://instagram.com/…"  },
              { k: "social_facebook",  label: "Facebook",  ph: "https://facebook.com/…"   },
            ].map(({ k, label, ph }) => (
              <Field key={k} label={label}>
                <Input value={settings[k]} onChange={(v) => u(k, v)} placeholder={ph} />
              </Field>
            ))}
          </div>
        </Card>

        <button
          onClick={save}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-[#FFAA14] hover:bg-amber-500 text-white py-4 rounded-2xl font-black text-sm transition-all shadow-sm disabled:opacity-50"
        >
          {saving ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            "Save Settings"
          )}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
