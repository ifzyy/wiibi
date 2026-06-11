/**
 * CalculatorModal — stripped-down solar sizing flow.
 *
 * Step 1: pick appliances (qty per item, optional essential-loads-only toggle)
 * Step 2: location + backup hours + battery type
 * Then  : POST /api/solar/find-systems → navigate to /store?recommended=<ids>
 *         so the store shows every inverter/battery/panel/controller capable
 *         of serving the entered load.
 *
 * The previous 4-step flow (tier cards, ROI, quote/lead form) was removed on
 * purpose — the store IS the results screen now.
 *
 * Lead capture (re-added, lighter than the old flow):
 *  - "Request a quote" — optional form (name/phone/email) reachable from
 *    step 2 and from the no-systems banner → POST /api/solar/leads
 *    (origin request_quote). Shows in the admin Leads page.
 *  - add_to_cart — inputs are saved to sessionStorage on "Show capable
 *    systems"; StorePage records a silent lead when a recommended product
 *    is added to cart (see utils/solarLead.js).
 */
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  X, ChevronDown, ChevronUp, ChevronRight,
  Plus, Minus, Loader2, AlertCircle, Store, Phone, CheckCircle2,
} from 'lucide-react';
import { saveCalcContext, submitSolarLead } from '../../utils/solarLead.js';

// ─── API client ───────────────────────────────────────────────────────────────
// Request paths in this file include the `/api` prefix, so the baseURL must be
// the ORIGIN without `/api`. VITE_API_URL ends in `/api` — strip it.
const ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
const API = axios.create({
  baseURL:         ORIGIN,
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  const guest = localStorage.getItem('guestToken');
  if (guest) config.headers['x-guest-token'] = guest;
  return config;
});

// ─── Constants ────────────────────────────────────────────────────────────────
const AUTONOMY_OPTIONS = [
  { value: 8,  label: '8 hrs'  },
  { value: 12, label: '12 hrs' },
  { value: 24, label: '1 day'  },
  { value: 48, label: '2 days' },
];

const BATTERY_OPTIONS = [
  { value: 'lithium',  label: 'Lithium',  note: 'Recommended — longer lifespan, deeper discharge, lighter' },
  { value: 'tubular',  label: 'Tubular',  note: 'Proven, budget-friendly, good for high-cycle use'         },
  { value: 'dry-cell', label: 'Dry Cell', note: 'Basic and affordable — shorter lifespan'                  },
];

// ─── Step 1 — Appliance Picker ────────────────────────────────────────────────
function Step1({ selections, onChange, applianceData, loading, criticalOnly, onCriticalToggle }) {
  const [openCats, setOpenCats] = useState({});

  useEffect(() => {
    if (applianceData?.categories?.length) {
      setOpenCats({ [applianceData.categories[0]]: true });
    }
  }, [applianceData]);

  const totalSelected = useMemo(
    () => Object.values(selections).reduce((s, v) => s + (v.qty > 0 ? 1 : 0), 0),
    [selections],
  );

  const adjust = useCallback((item, delta) => {
    const current = selections[item.id]?.qty || 0;
    const newQty  = Math.max(0, current + delta);
    if (newQty === 0) {
      const next = { ...selections };
      delete next[item.id];
      onChange(next);
    } else {
      onChange({
        ...selections,
        [item.id]: {
          qty:   newQty,
          hours: selections[item.id]?.hours ?? item.defaultHours,
          watts: item.watts,
        },
      });
    }
  }, [selections, onChange]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 size={28} className="text-[#FFAA14] animate-spin" />
      <p className="text-sm text-gray-400">Loading appliances...</p>
    </div>
  );

  if (!applianceData) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <AlertCircle size={28} className="text-red-400" />
      <p className="text-sm text-gray-500">Failed to load. Please close and try again.</p>
    </div>
  );

  const categories = criticalOnly
    ? applianceData.categories.filter(cat =>
        applianceData.appliances[cat]?.some(i => i.isCritical))
    : applianceData.categories;

  return (
    <div>
      <h2 className="text-2xl font-black text-[#1A1102] mb-1">Select Appliances</h2>
      <p className="text-sm text-gray-400 mb-4">Add every appliance you want to power</p>

      {/* Critical toggle */}
      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 mb-4">
        <div>
          <p className="text-[13px] font-bold text-gray-700">Essential loads only</p>
          <p className="text-[11px] text-gray-400">Show only critical appliances</p>
        </div>
        <button
          onClick={onCriticalToggle}
          className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${criticalOnly ? 'bg-[#FFAA14]' : 'bg-gray-200'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${criticalOnly ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {totalSelected > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 mb-4 w-fit">
          <span className="text-[#FFAA14] text-[13px] font-bold">
            {totalSelected} item{totalSelected !== 1 ? 's' : ''} selected
          </span>
        </div>
      )}

      <div className="space-y-1">
        {categories.map((cat) => {
          const items    = (applianceData.appliances[cat] || []).filter(i => !criticalOnly || i.isCritical);
          const isOpen   = !!openCats[cat];
          const catCount = items.filter(i => selections[i.id]?.qty > 0).length;
          if (!items.length) return null;

          return (
            <div key={cat} className="rounded-2xl overflow-hidden border border-gray-100">
              <button
                className="w-full flex justify-between items-center px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                onClick={() => setOpenCats(p => ({ ...p, [cat]: !p[cat] }))}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-gray-800">{cat}</span>
                  {catCount > 0 && (
                    <span className="bg-[#FFAA14] text-white text-[10px] font-black px-2 py-0.5 rounded-full">{catCount}</span>
                  )}
                </div>
                {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </button>

              {isOpen && (
                <div className="bg-white divide-y divide-gray-50">
                  {items.map((item) => {
                    const qty = selections[item.id]?.qty || 0;
                    return (
                      <div key={item.id} className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-sm flex-shrink-0 transition-colors ${qty > 0 ? 'bg-[#FFAA14]' : 'bg-gray-200'}`} />
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                            <p className="text-[11px] text-gray-400">
                              {item.wattsMin !== item.wattsMax
                                ? `${item.wattsMin}W – ${item.wattsMax}W`
                                : `${item.watts}W`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => adjust(item, -1)} aria-label={`Remove one ${item.name}`} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:border-[#FFAA14] hover:text-[#FFAA14] transition-colors">
                            <Minus size={12} />
                          </button>
                          <span className="w-5 text-center text-sm font-bold text-gray-800">{qty}</span>
                          <button onClick={() => adjust(item, 1)} aria-label={`Add one ${item.name}`} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:border-[#FFAA14] hover:text-[#FFAA14] transition-colors">
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 2 — System Config ───────────────────────────────────────────────────
function Step2({ config, onChange, locations }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-black text-[#1A1102] mb-1">Configure your system</h2>
        <p className="text-sm text-gray-400">Tell us about your power needs</p>
      </div>

      {/* Backup time */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Backup time <span className="text-gray-400 font-normal">(without power)</span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {AUTONOMY_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => onChange('autonomyHours', opt.value)}
              className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                config.autonomyHours === opt.value
                  ? 'bg-[#FFAA14] border-[#FFAA14] text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-[#FFAA14]'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
        <div className="border border-gray-200 rounded-xl px-4 py-3 flex items-center">
          <select
            value={config.location}
            onChange={e => onChange('location', e.target.value)}
            className="w-full outline-none text-base font-semibold text-gray-800 bg-transparent appearance-none"
          >
            {(locations || []).map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
          <ChevronDown size={18} className="text-gray-400 flex-shrink-0 pointer-events-none" />
        </div>
      </div>

      {/* Battery type */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Battery Type</label>
        <div className="flex flex-col gap-2">
          {BATTERY_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => onChange('batteryType', opt.value)}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                config.batteryType === opt.value
                  ? 'bg-amber-50 border-[#FFAA14]'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}>
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-colors ${
                config.batteryType === opt.value ? 'border-[#FFAA14] bg-[#FFAA14]' : 'border-gray-300'
              }`} />
              <div>
                <p className={`text-sm font-bold ${config.batteryType === opt.value ? 'text-[#FFAA14]' : 'text-gray-700'}`}>
                  {opt.label}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">{opt.note}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4">
        <p className="text-[11px] uppercase tracking-widest font-bold text-[#FFAA14] mb-3">Summary</p>
        <div className="space-y-2 text-sm">
          {[
            ['Backup', `${config.autonomyHours} hours`],
            ['Location', config.location],
            ['Battery', BATTERY_OPTIONS.find(b => b.value === config.batteryType)?.label ?? '—'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="text-gray-500">{label}</span>
              <span className="font-bold text-gray-800">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function CalculatorModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [step,         setStep]         = useState(1);
  const [selections,   setSelections]   = useState({});
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [config,       setConfig]       = useState({
    autonomyHours: 12,
    location:      'Lagos',
    batteryType:   'lithium',
  });
  const [appData,    setAppData]    = useState(null);
  const [appLoading, setAppLoading] = useState(false);
  const [finding,    setFinding]    = useState(false);
  const [findError,  setFindError]  = useState(null);
  const [noSystems,  setNoSystems]  = useState(false);

  // Quote-request lead form (origin: request_quote)
  const [quoteMode,       setQuoteMode]       = useState(false);
  const [quote,           setQuote]           = useState({ name: '', phone: '', email: '' });
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteError,      setQuoteError]      = useState(null);
  const [quoteDone,       setQuoteDone]       = useState(false);

  // Load appliances once on first open
  useEffect(() => {
    if (!isOpen || appData) return;
    setAppLoading(true);
    API.get('/api/solar/appliances')
      .then(r => setAppData(r.data))
      .catch(() => setAppData(null))
      .finally(() => setAppLoading(false));
  }, [isOpen, appData]);

  const totalSelected = useMemo(
    () => Object.values(selections).reduce((s, v) => s + (v.qty > 0 ? 1 : 0), 0),
    [selections],
  );

  const handleClose = useCallback(() => {
    onClose();
    // Reset after the close animation
    setTimeout(() => {
      setStep(1);
      setSelections({});
      setCriticalOnly(false);
      setConfig({ autonomyHours: 12, location: 'Lagos', batteryType: 'lithium' });
      setFindError(null);
      setNoSystems(false);
      setQuoteMode(false);
      setQuote({ name: '', phone: '', email: '' });
      setQuoteError(null);
      setQuoteDone(false);
    }, 300);
  }, [onClose]);

  // Calculator inputs in the shape POST /api/solar/find-systems and
  // POST /api/solar/leads both expect.
  const buildCalcPayload = useCallback(() => ({
    appliances: Object.entries(selections).map(([id, val]) => ({
      id:    parseInt(id),
      qty:   val.qty,
      hours: val.hours,
      watts: val.watts,
    })),
    location:          config.location,
    autonomyHours:     config.autonomyHours,
    batteryType:       config.batteryType,
    criticalLoadsOnly: criticalOnly,
  }), [selections, config, criticalOnly]);

  // Step 2 → store: size the system server-side, then show every capable
  // product on the store page.
  const handleFindSystems = useCallback(async () => {
    setFinding(true);
    setFindError(null);
    setNoSystems(false);
    try {
      const payload  = buildCalcPayload();
      const { data } = await API.post('/api/solar/find-systems', payload);

      // coverage: 'full' = everything meets spec; 'partial' = closest
      // available shown with an honest note; 'none' = nothing tagged yet.
      if (data.coverage === 'none' || !data.ids?.length) {
        setNoSystems(true);
        return;
      }

      // Arm the store page's silent add_to_cart lead capture for this calculation
      saveCalcContext(payload);

      handleClose();
      const fit = data.coverage === 'partial' ? '&fit=partial' : '';
      navigate(`/store?recommended=${data.ids.join(',')}&kva=${data.metrics.recommendedKva}${fit}`);
    } catch (err) {
      setFindError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setFinding(false);
    }
  }, [buildCalcPayload, navigate, handleClose]);

  // Quote form → lead (origin request_quote). The solar team follows up.
  const handleSubmitQuote = useCallback(async () => {
    if (!quote.name.trim() || !quote.phone.trim()) {
      setQuoteError('Please enter your name and phone number.');
      return;
    }
    setQuoteSubmitting(true);
    setQuoteError(null);
    try {
      await submitSolarLead({
        ...buildCalcPayload(),
        origin: 'request_quote',
        name:   quote.name.trim(),
        phone:  quote.phone.trim(),
        email:  quote.email.trim() || undefined,
      });
      setQuoteDone(true);
    } catch (err) {
      setQuoteError(
        err.response?.data?.errors?.[0]
        ?? err.response?.data?.message
        ?? 'Could not submit your request. Please try again.'
      );
    } finally {
      setQuoteSubmitting(false);
    }
  }, [quote, buildCalcPayload]);

  if (!isOpen) return null;

  const STEP_LABELS = ['Select Appliances', 'Configure System'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      <div
        className="relative bg-white w-full max-w-[480px] rounded-[32px] shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: '92vh' }}
        role="dialog"
        aria-modal="true"
        aria-label="Solar calculator"
      >
        {/* Header */}
        <div className="px-8 pt-7 pb-0 flex-shrink-0">
          <div className="flex justify-between items-start mb-5">
            <div className="bg-gray-50 px-4 py-2 rounded-xl">
              <span className="text-[13px] font-black text-gray-800 tracking-tight">Solar Calculator</span>
            </div>
            <button onClick={handleClose} aria-label="Close calculator" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1.5 mb-2">
            {[1, 2].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${quoteMode || step >= s ? 'bg-[#FFAA14]' : 'bg-gray-100'}`} />
            ))}
          </div>
          <div className="flex justify-between items-center mb-5">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              {quoteMode ? 'Request a Quote' : STEP_LABELS[step - 1]}
            </span>
            <span className="text-[10px] font-black text-gray-400">
              {quoteMode ? 'Almost done' : `Step ${step}/2`}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 pb-2">
          {quoteMode && (
            quoteDone ? (
              <div className="py-10 flex flex-col items-center text-center">
                <CheckCircle2 size={44} className="text-green-500 mb-4" />
                <h3 className="text-lg font-black text-gray-900 mb-2">Request received!</h3>
                <p className="text-[13px] text-gray-500 font-medium max-w-[300px]">
                  Thanks {quote.name.split(' ')[0]} — our solar team will call you
                  within 24 hours with a tailored quote for your setup.
                </p>
              </div>
            ) : (
              <div className="py-2">
                <p className="text-[13px] text-gray-500 font-medium mb-5">
                  Leave your details and our solar team will size your system and
                  call you back with a quote — usually within 24 hours.
                </p>
                {[
                  { key: 'name',  label: 'Full name *',        type: 'text',  placeholder: 'e.g. Ife Johnson' },
                  { key: 'phone', label: 'Phone number *',     type: 'tel',   placeholder: 'e.g. 0801 234 5678' },
                  { key: 'email', label: 'Email (optional)',   type: 'email', placeholder: 'you@example.com' },
                ].map(f => (
                  <label key={f.key} className="block mb-4">
                    <span className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5">{f.label}</span>
                    <input
                      type={f.type}
                      value={quote[f.key]}
                      onChange={e => setQuote(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] font-medium focus:outline-none focus:border-[#FFAA14] focus:ring-2 focus:ring-amber-100"
                    />
                  </label>
                ))}
                {quoteError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3" role="alert">
                    <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
                    <p className="text-[12px] text-red-500 font-medium">{quoteError}</p>
                  </div>
                )}
              </div>
            )
          )}
          {!quoteMode && step === 1 && (
            <Step1
              selections={selections}
              onChange={setSelections}
              applianceData={appData}
              loading={appLoading}
              criticalOnly={criticalOnly}
              onCriticalToggle={() => setCriticalOnly(p => !p)}
            />
          )}
          {!quoteMode && step === 2 && (
            <Step2
              config={config}
              onChange={(k, v) => setConfig(p => ({ ...p, [k]: v }))}
              locations={appData?.locations}
            />
          )}
          {!quoteMode && findError && step === 2 && (
            <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3" role="alert">
              <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
              <p className="text-[12px] text-red-500 font-medium">{findError}</p>
            </div>
          )}
          {!quoteMode && noSystems && step === 2 && (
            <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3" role="alert">
              <p className="text-[12px] text-amber-700 font-medium mb-2">
                We couldn't size an exact system online for this load yet. Browse the
                store, or send us your selection and our solar team will spec it for you.
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuoteMode(true)}
                  className="text-[12px] font-black text-[#FFAA14] underline"
                >
                  Send my selection — get a quote →
                </button>
                <button
                  onClick={() => { handleClose(); navigate('/store'); }}
                  className="text-[12px] font-black text-amber-700/70 underline"
                >
                  Browse the store
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-7 pt-4 bg-white border-t border-gray-50 flex-shrink-0">
          {quoteMode && (
            quoteDone ? (
              <button
                onClick={handleClose}
                className="w-full py-4 rounded-2xl font-black text-base bg-[#FFAA14] text-white hover:bg-[#e69912] shadow-md shadow-amber-200 transition-all"
              >
                Done
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => { setQuoteMode(false); setQuoteError(null); }}
                  disabled={quoteSubmitting}
                  className="px-6 py-4 rounded-2xl border border-gray-200 text-sm font-black text-gray-600 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitQuote}
                  disabled={quoteSubmitting}
                  className={`flex-1 py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all ${
                    quoteSubmitting
                      ? 'bg-[#FFD699] text-white cursor-not-allowed'
                      : 'bg-[#FFAA14] text-white hover:bg-[#e69912] shadow-md shadow-amber-200'
                  }`}
                >
                  {quoteSubmitting
                    ? <><Loader2 size={18} className="animate-spin" /> Sending…</>
                    : <><Phone size={18} /> Request my quote</>
                  }
                </button>
              </div>
            )
          )}

          {!quoteMode && step === 1 && (
            <button
              onClick={() => totalSelected > 0 && setStep(2)}
              disabled={totalSelected === 0}
              className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all ${
                totalSelected > 0
                  ? 'bg-[#FFAA14] text-white hover:bg-[#e69912] shadow-md shadow-amber-200'
                  : 'bg-[#FFD699] text-white cursor-not-allowed'
              }`}
            >
              Continue to configuration <ChevronRight size={18} />
            </button>
          )}

          {!quoteMode && step === 2 && (
            <>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-6 py-4 rounded-2xl border border-gray-200 text-sm font-black text-gray-600 hover:bg-gray-50">
                  Back
                </button>
                <button
                  onClick={handleFindSystems}
                  disabled={finding}
                  className={`flex-1 py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all ${
                    finding
                      ? 'bg-[#FFD699] text-white cursor-not-allowed'
                      : 'bg-[#FFAA14] text-white hover:bg-[#e69912] shadow-md shadow-amber-200'
                  }`}
                >
                  {finding
                    ? <><Loader2 size={18} className="animate-spin" /> Finding systems...</>
                    : <><Store size={18} /> Show capable systems</>
                  }
                </button>
              </div>
              <button
                onClick={() => setQuoteMode(true)}
                className="w-full mt-3 text-[12px] font-bold text-gray-400 hover:text-[#FFAA14] transition-colors"
              >
                Prefer to talk to someone? <span className="underline">Request a quote instead</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
