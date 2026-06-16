/**
 * CookieSettings — Account → Cookie Preferences.
 *
 * Renders inside the account content card (the AccountPage shell supplies the
 * sidebar, header and back button), matching the other settings tabs.
 *
 * Choices are saved to the user's account (PATCH /users/me) AND mirrored into
 * localStorage so site-wide gating (e.g. analytics page-view tracking in
 * usePageTracking) reflects the decision immediately. `essential` is always on
 * and cannot be turned off.
 */
import { useState } from 'react';
import { ShieldCheck, BarChart3, Sparkles, Megaphone, Check } from 'lucide-react';
import api from '../../utils/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { getConsent, setConsent, DEFAULT_CONSENT } from '../../utils/cookieConsent.js';

const CATEGORIES = [
  {
    key:         'essential',
    icon:        ShieldCheck,
    title:       'Essential Cookies',
    description: 'Required for the site to work — sign-in, cart and checkout. These keep the platform secure and cannot be turned off.',
    locked:      true,
  },
  {
    key:         'analytics',
    icon:        BarChart3,
    title:       'Analytics Cookies',
    description: 'Help us understand how visitors use the platform so we can improve it. Turning this off stops your visits being counted.',
  },
  {
    key:         'personalization',
    icon:        Sparkles,
    title:       'Personalization',
    description: 'Remember your preferences, such as your solar calculator inputs and region, for a tailored experience.',
  },
  {
    key:         'marketing',
    icon:        Megaphone,
    title:       'Marketing Cookies',
    description: 'Measure the effectiveness of our campaigns and show you more relevant content based on your interests.',
  },
];

const CookieSettings = () => {
  const { user, refreshUser } = useAuth();

  // Saved account consent wins; fall back to the local/default choice.
  const initial = { ...DEFAULT_CONSENT, ...getConsent(), ...(user?.cookieConsent || {}) };
  const [settings, setSettings] = useState({ essential: true, ...initial });
  const [saving, setSaving]     = useState(false);
  const [savedAt, setSavedAt]   = useState(null);

  const toggle = (key) => {
    if (key === 'essential') return;
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setSavedAt(null);
  };

  const persist = async (next) => {
    setSaving(true);
    try {
      const payload = {
        analytics:       !!next.analytics,
        marketing:       !!next.marketing,
        personalization: !!next.personalization,
      };
      setConsent(payload);                         // mirror locally (site-wide gate)
      await api.patch('/users/me', { cookieConsent: payload });
      await refreshUser();
      setSavedAt(Date.now());
    } catch (err) {
      console.error('Failed to save cookie preferences', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSave      = () => persist(settings);
  const handleAcceptAll = () => {
    const all = { essential: true, analytics: true, marketing: true, personalization: true };
    setSettings(all);
    persist(all);
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-gray-50/50 -mx-6 -mt-6 px-6 py-3 mb-6 border-b border-gray-100">
        <h2 className="text-sm font-medium text-gray-800">Cookie Preferences</h2>
      </div>

      {/* Intro */}
      <div className="flex items-start gap-3 bg-amber-50/60 border border-amber-100 p-4 rounded-xl mb-6">
        <ShieldCheck size={18} className="text-[#FFAA14] shrink-0 mt-0.5" />
        <p className="text-[13px] text-gray-600 leading-relaxed">
          We use cookies to keep Wiibi Energy working, understand how it's used, and improve your
          experience. You're in control of everything except the essentials needed to run the site.
        </p>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        {CATEGORIES.map(({ key, icon: Icon, title, description, locked }) => (
          <div
            key={key}
            className="flex items-start justify-between gap-4 p-4 bg-gray-50/70 rounded-xl border border-transparent hover:border-gray-100 transition-all"
          >
            <div className="flex items-start gap-3 pr-2">
              <div className="w-9 h-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                <Icon size={16} className="text-gray-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-800">{title}</h3>
                  {locked && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      Always on
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mt-1 max-w-sm">{description}</p>
              </div>
            </div>

            <Toggle enabled={settings[key]} onToggle={() => toggle(key)} disabled={locked} />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-8 pt-5 border-t border-gray-50">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-[#FFAA14] hover:bg-amber-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all text-sm"
        >
          {saving ? 'Saving…' : 'Save Preferences'}
        </button>
        <button
          onClick={handleAcceptAll}
          disabled={saving}
          className="flex-1 bg-white border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 disabled:opacity-60 transition-all text-sm"
        >
          Accept All
        </button>
      </div>

      {savedAt && !saving && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-green-600 font-medium mt-3">
          <Check size={14} /> Preferences saved
        </p>
      )}
    </div>
  );
};

const Toggle = ({ enabled, onToggle, disabled = false }) => (
  <button
    type="button"
    onClick={onToggle}
    disabled={disabled}
    aria-pressed={enabled}
    className={`relative inline-flex h-6 w-11 shrink-0 mt-1 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400/30 ${
      enabled ? 'bg-[#FFAA14]' : 'bg-gray-200'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        enabled ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

export default CookieSettings;
