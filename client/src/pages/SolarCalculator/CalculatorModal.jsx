import React, { useState, useMemo, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  X, ChevronDown, ChevronUp, ChevronRight, ArrowRight,
  Plus, Minus, Zap, Battery, Sun, TrendingDown,
  CheckCircle, Loader2, AlertCircle, ShoppingCart,
  AlertTriangle, Package,
} from 'lucide-react';

// ─── API client ───────────────────────────────────────────────────────────────
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

API.interceptors.request.use((config) => {
  const guest = localStorage.getItem('guestToken');
  const auth  = localStorage.getItem('authToken');
  if (guest) config.headers['x-guest-token'] = guest;
  if (auth)  config.headers['Authorization']  = `Bearer ${auth}`;
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
  { value: 'lithium',  label: 'Lithium',     note: 'Recommended — longer lifespan, deeper discharge, lighter' },
  { value: 'tubular',  label: 'Tubular',      note: 'Proven, budget-friendly, good for high-cycle use'         },
  { value: 'dry-cell', label: 'Dry Cell',     note: 'Basic and affordable — shorter lifespan'                  },
];

const HOME_OPTIONS = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'bungalow',  label: 'Bungalow'  },
  { value: 'duplex',    label: 'Duplex'     },
  { value: 'office',    label: 'Office'     },
  { value: 'other',     label: 'Other'      },
];

const TIER_STYLE = {
  sufficient:  { accent: '#6B7280', bg: 'bg-gray-50',    border: 'border-gray-200',    badge: 'bg-gray-100 text-gray-600'          },
  recommended: { accent: '#FFAA14', bg: 'bg-amber-50',   border: 'border-[#FFAA14]',   badge: 'bg-amber-50 text-[#FFAA14] border border-amber-200' },
  overkill:    { accent: '#1A1102', bg: 'bg-gray-800/5', border: 'border-gray-800',    badge: 'bg-gray-800 text-white'             },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt    = (n) => '₦' + Math.round(n).toLocaleString('en-NG');
const fmtRange = (min, max) => `${fmt(min)} — ${fmt(max)}`;

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
                          <button onClick={() => adjust(item, -1)} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:border-[#FFAA14] hover:text-[#FFAA14] transition-colors">
                            <Minus size={12} />
                          </button>
                          <span className="w-5 text-center text-sm font-bold text-gray-800">{qty}</span>
                          <button onClick={() => adjust(item, 1)} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:border-[#FFAA14] hover:text-[#FFAA14] transition-colors">
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

      {/* Home type */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Property Type <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {HOME_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => onChange('homeType', config.homeType === opt.value ? '' : opt.value)}
              className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                config.homeType === opt.value
                  ? 'bg-[#FFAA14] border-[#FFAA14] text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-[#FFAA14]'
              }`}>
              {opt.label}
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
            ['Property', HOME_OPTIONS.find(h => h.value === config.homeType)?.label ?? 'Not specified'],
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

// ─── Component line item ──────────────────────────────────────────────────────
function ComponentRow({ comp }) {
  if (!comp.found) {
    return (
      <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
        <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Package size={13} className="text-gray-400" />
        </div>
        <div>
          <p className="text-[12px] font-bold text-gray-500">{comp.displayLabel}</p>
          <p className="text-[11px] text-gray-400 italic">Not in catalog yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-3">
        {comp.image ? (
          <img src={comp.image} alt={comp.name} className="w-8 h-8 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Package size={13} className="text-[#FFAA14]" />
          </div>
        )}
        <div>
          <p className="text-[12px] font-bold text-gray-800 leading-tight">
            {comp.qty > 1 && <span className="text-[#FFAA14] mr-1">×{comp.qty}</span>}
            {comp.name}
          </p>
          {comp.brand && <p className="text-[10px] text-gray-400">{comp.brand}</p>}

          {/* Stock notice */}
          {comp.isOutOfStock && (
            <div className="flex items-center gap-1 mt-0.5">
              <AlertTriangle size={10} className="text-amber-500" />
              <p className="text-[10px] text-amber-500">Out of stock — team will confirm</p>
            </div>
          )}
          {comp.isUpsell && (
            <div className="flex items-center gap-1 mt-0.5">
              <CheckCircle size={10} className="text-green-500" />
              <p className="text-[10px] text-green-600">Upgraded to next available size</p>
            </div>
          )}
        </div>
      </div>
      <p className="text-[12px] font-black text-[#1A1102] flex-shrink-0 ml-2">{fmt(comp.lineTotal)}</p>
    </div>
  );
}

// ─── Recommendation Card ──────────────────────────────────────────────────────
function RecommendationCard({ rec, isSelected, onSelect, onAddToCart, addingToCart }) {
  const [expanded, setExpanded] = useState(false);
  const style = TIER_STYLE[rec.tier];

  return (
    <div
      className={`rounded-3xl border-2 overflow-hidden transition-all duration-200 cursor-pointer ${
        isSelected ? style.border + ' shadow-lg' : 'border-gray-100 hover:border-gray-200'
      }`}
      onClick={() => onSelect(rec.tier)}
    >
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${style.badge}`}>
            {rec.isRecommended ? '★ Recommended' : rec.label}
          </span>
          {isSelected && (
            <div className="w-5 h-5 rounded-full bg-[#FFAA14] flex items-center justify-center flex-shrink-0">
              <CheckCircle size={12} className="text-white" />
            </div>
          )}
        </div>

        <p className="text-[12px] text-gray-400 leading-relaxed mb-4">{rec.description}</p>

        {/* Quick spec pills */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { icon: <Sun     size={13} className="text-[#FFAA14] mx-auto mb-1" />, label: 'Panels',    value: `${rec.specs.panels.count}×`      },
            { icon: <Battery size={13} className="text-[#FFAA14] mx-auto mb-1" />, label: 'Batteries', value: `${rec.specs.battery.units}×`     },
            { icon: <Zap     size={13} className="text-[#FFAA14] mx-auto mb-1" />, label: 'Inverter',  value: `${rec.specs.inverter.kva}kVA`    },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
              {s.icon}
              <p className="text-[10px] text-gray-400 mb-0.5">{s.label}</p>
              <p className="text-sm font-black text-[#1A1102]">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Price + stock status */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">Store Price</p>
            <p className="text-2xl font-black text-[#1A1102]">{fmt(rec.productTotal)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Estimate range: {fmtRange(rec.costMin, rec.costMax)}</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ml-2 ${
            rec.overallStockStatus === 'available' ? 'bg-green-50 text-green-600'
            : rec.overallStockStatus === 'partial'  ? 'bg-amber-50 text-amber-600'
            : 'bg-gray-100 text-gray-500'
          }`}>
            {rec.overallStockStatus === 'available' ? 'In stock'
             : rec.overallStockStatus === 'partial'  ? 'Partial stock'
             : 'On order'}
          </span>
        </div>
      </div>

      {/* Expandable components */}
      <button
        onClick={e => { e.stopPropagation(); setExpanded(p => !p); }}
        className="w-full flex items-center justify-between px-5 py-3 border-t border-gray-50 text-[11px] font-bold text-gray-500 hover:bg-gray-50 transition-colors"
      >
        <span>View component breakdown</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="px-5 pb-4" onClick={e => e.stopPropagation()}>
          {rec.components.map((comp, i) => (
            <ComponentRow key={i} comp={comp} />
          ))}
          <div className="pt-3 space-y-1 border-t border-gray-100 mt-2">
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">Subtotal</span>
              <span className="font-bold text-gray-700">{fmt(rec.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">VAT (7.5%)</span>
              <span className="font-bold text-gray-700">{fmt(rec.vatAmount)}</span>
            </div>
            <div className="flex justify-between text-sm font-black pt-1 border-t border-gray-100">
              <span>Total</span>
              <span>{fmt(rec.productTotal)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ROI — only on selected */}
      {isSelected && (
        <div className="mx-5 mb-4 bg-amber-50/60 border border-amber-100 rounded-2xl p-4" onClick={e => e.stopPropagation()}>
          <p className="text-[10px] uppercase tracking-widest font-bold text-[#FFAA14] mb-2">vs Generator</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Grid savings/yr', value: fmt(rec.annualGridSavings) },
              { label: 'Fuel savings/yr', value: fmt(rec.annualFuelSavings) },
              { label: 'Break-even',      value: `${rec.paybackYears} yrs`  },
            ].map(m => (
              <div key={m.label}>
                <p className="text-[10px] text-gray-400">{m.label}</p>
                <p className="text-xs font-black text-[#1A1102]">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTAs — only on selected */}
      {isSelected && (
        <div className="px-5 pb-5 space-y-2" onClick={e => e.stopPropagation()}>
          {/* Add to cart */}
          <button
            onClick={() => onAddToCart(rec, 'add_to_cart')}
            disabled={addingToCart || rec.overallStockStatus === 'unavailable'}
            className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
              addingToCart
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-[#1A1102] text-white hover:bg-black'
            }`}
          >
            {addingToCart
              ? <><Loader2 size={14} className="animate-spin" /> Adding...</>
              : <><ShoppingCart size={14} /> Add to cart</>
            }
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Step 3 — Results ─────────────────────────────────────────────────────────
function Step3({ result, onAddToCart, addingToCart, onRequestQuote }) {
  const [selectedTier, setSelectedTier] = useState('recommended');
  const recs = result?.recommendations ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-black text-[#1A1102] leading-tight">Your Recommendations</h2>
        <p className="text-sm text-gray-400 mt-1">
          {result.metrics.dailyWh.toLocaleString()}Wh/day · {result.metrics.location} · {result.metrics.autonomyHours}h backup
        </p>
      </div>

      {/* Load metrics strip */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Daily load',  value: `${(result.metrics.dailyWh / 1000).toFixed(2)}kWh`  },
          { label: 'Peak load',   value: `${(result.metrics.peakWatts / 1000).toFixed(1)}kW`  },
          { label: 'Sun hours',   value: `${result.metrics.peakSunHours}h/day`                 },
        ].map(m => (
          <div key={m.label} className="bg-gray-50 rounded-2xl p-3 text-center">
            <p className="text-[10px] text-gray-400 mb-1">{m.label}</p>
            <p className="text-sm font-black text-[#1A1102]">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Three recommendation cards */}
      <div className="space-y-3">
        {recs.map(rec => (
          <RecommendationCard
            key={rec.tier}
            rec={rec}
            isSelected={selectedTier === rec.tier}
            onSelect={setSelectedTier}
            onAddToCart={onAddToCart}
            addingToCart={addingToCart}
          />
        ))}
      </div>

      {/* Request quote CTA */}
      <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-gray-800">Want a detailed quote?</p>
          <p className="text-[11px] text-gray-400">Our team reviews your load and sends a proposal</p>
        </div>
        <button
          onClick={() => onRequestQuote(recs.find(r => r.tier === selectedTier) ?? recs[1])}
          className="flex-shrink-0 flex items-center gap-1.5 bg-[#FFAA14] text-white text-xs font-black px-4 py-2.5 rounded-xl hover:bg-[#e69912] transition-colors"
        >
          Get quote <ArrowRight size={12} />
        </button>
      </div>

      {/* Included */}
      <div className="bg-gray-50 rounded-2xl p-4">
        <p className="text-[11px] uppercase tracking-widest font-bold text-gray-500 mb-3">What's included</p>
        {[
          'Free site assessment & consultation',
          'Professional installation by certified engineers',
          '1-year workmanship warranty',
          'Remote monitoring setup',
        ].map(item => (
          <div key={item} className="flex items-start gap-2 mb-2 last:mb-0">
            <CheckCircle size={14} className="text-[#FFAA14] flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-gray-600 font-medium">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 4 — Lead form ───────────────────────────────────────────────────────
function Step4({ form, onChange, error, chosenTier }) {
  const tierLabel = { sufficient: 'Sufficient', recommended: 'Recommended', overkill: 'Overkill' };
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-black text-[#1A1102] mb-1">Get Your Quote</h2>
        <p className="text-sm text-gray-400">
          Our solar team will review your{' '}
          <span className="font-bold text-[#FFAA14]">{tierLabel[chosenTier]}</span>{' '}
          system and reach out with a detailed proposal.
        </p>
      </div>

      {[
        { key: 'name',  label: 'Full Name',     placeholder: 'e.g. Emeka Johnson',    type: 'text',  required: true  },
        { key: 'phone', label: 'Phone Number',  placeholder: 'e.g. 08012345678',       type: 'tel',   required: true  },
        { key: 'email', label: 'Email Address', placeholder: 'e.g. emeka@email.com',   type: 'email', required: false },
      ].map(field => (
        <div key={field.key}>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            {field.label}
            {!field.required && <span className="text-gray-400 font-normal ml-1">(optional)</span>}
          </label>
          <input
            type={field.type}
            value={form[field.key]}
            onChange={e => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base font-semibold text-gray-800 outline-none focus:border-[#FFAA14] transition-colors placeholder:text-gray-300"
          />
        </div>
      ))}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
          <p className="text-[12px] text-red-500 font-medium">{error}</p>
        </div>
      )}

      <p className="text-[11px] text-gray-400 text-center">
        No spam. Our team typically responds within 24 hours.
      </p>
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────
function SuccessScreen({ origin, onClose }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
      <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center">
        <CheckCircle size={32} className="text-[#FFAA14]" />
      </div>
      <h2 className="text-2xl font-black text-[#1A1102]">
        {origin === 'add_to_cart' ? 'Added to cart!' : "You're all set!"}
      </h2>
      <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
        {origin === 'add_to_cart'
          ? 'Your solar system components have been added to your cart. Proceed to checkout when ready.'
          : 'Our solar team has received your request and will contact you within 24 hours with a detailed proposal.'}
      </p>
      <button
        onClick={onClose}
        className="mt-2 px-8 py-4 rounded-2xl bg-[#FFAA14] text-white font-black text-base hover:bg-[#e69912] transition-colors"
      >
        {origin === 'add_to_cart' ? 'View Cart' : 'Done'}
      </button>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function CalculatorModal({ isOpen, onClose, onCartUpdate }) {
  const [step,         setStep]         = useState(1);
  const [selections,   setSelections]   = useState({});
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [config,       setConfig]       = useState({
    autonomyHours: 12,
    location:      'Lagos',
    batteryType:   'lithium',
    homeType:      '',
  });
  const [appData,      setAppData]      = useState(null);
  const [appLoading,   setAppLoading]   = useState(false);
  const [result,       setResult]       = useState(null);
  const [calcLoading,  setCalcLoading]  = useState(false);
  const [calcError,    setCalcError]    = useState(null);
  const [chosenTier,   setChosenTier]   = useState('recommended');
  const [chosenRec,    setChosenRec]    = useState(null);
  const [leadForm,     setLeadForm]     = useState({ name: '', phone: '', email: '' });
  const [leadLoading,  setLeadLoading]  = useState(false);
  const [leadError,    setLeadError]    = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [done,         setDone]         = useState({ show: false, origin: '' });

  // Load appliances once on first open
  useEffect(() => {
    if (!isOpen || appData) return;
    setAppLoading(true);
    API.get('/api/solar/appliances')
      .then(r => setAppData(r.data))
      .catch(() => setAppData(null))
      .finally(() => setAppLoading(false));
  }, [isOpen]);

  const totalSelected = useMemo(
    () => Object.values(selections).reduce((s, v) => s + (v.qty > 0 ? 1 : 0), 0),
    [selections],
  );

  // Build appliance payload
  const buildPayload = useCallback(() =>
    Object.entries(selections).map(([id, val]) => ({
      id:    parseInt(id),
      qty:   val.qty,
      hours: val.hours,
      watts: val.watts,
    })),
  [selections]);

  const handleCalculate = useCallback(async () => {
    setCalcLoading(true);
    setCalcError(null);
    try {
      const { data } = await API.post('/api/solar/calculate', {
        appliances:        buildPayload(),
        location:          config.location,
        autonomyHours:     config.autonomyHours,
        batteryType:       config.batteryType,
        homeType:          config.homeType || undefined,
        criticalLoadsOnly: criticalOnly,
      });
      setResult(data);
      setStep(3);
    } catch (err) {
      setCalcError(err.response?.data?.message || 'Calculation failed. Please try again.');
    } finally {
      setCalcLoading(false);
    }
  }, [buildPayload, config, criticalOnly]);

  // Add to cart — fires cart requests then silently creates lead
  const handleAddToCart = useCallback(async (rec, origin) => {
    setAddingToCart(true);
    try {
      const found = rec.components.filter(c => c.found && c.id);
      await Promise.all(
        found.map(c => API.post('/api/cart', { productId: c.id, quantity: c.qty })),
      );

      // Silent lead creation
      API.post('/api/solar/leads', {
        appliances:    buildPayload(),
        location:      config.location,
        autonomyHours: config.autonomyHours,
        batteryType:   config.batteryType,
        homeType:      config.homeType || undefined,
        criticalLoadsOnly: criticalOnly,
        chosenTier:    rec.tier,
        origin:        'add_to_cart',
      })
        .then(r => { if (r.data.guestToken) localStorage.setItem('guestToken', r.data.guestToken); })
        .catch(() => {});

      if (onCartUpdate) onCartUpdate();
      setDone({ show: true, origin: 'add_to_cart' });
    } catch (err) {
      console.error('Add to cart error:', err);
    } finally {
      setAddingToCart(false);
    }
  }, [buildPayload, config, criticalOnly, onCartUpdate]);

  // Request quote — go to step 4
  const handleRequestQuote = useCallback((rec) => {
    setChosenTier(rec.tier);
    setChosenRec(rec);
    setStep(4);
  }, []);

  // Submit quote lead
  const handleSubmitLead = useCallback(async () => {
    if (!leadForm.name.trim() || !leadForm.phone.trim()) {
      setLeadError('Name and phone number are required.');
      return;
    }
    setLeadLoading(true);
    setLeadError(null);
    try {
      const { data } = await API.post('/api/solar/leads', {
        appliances:    buildPayload(),
        location:      config.location,
        autonomyHours: config.autonomyHours,
        batteryType:   config.batteryType,
        homeType:      config.homeType || undefined,
        criticalLoadsOnly: criticalOnly,
        chosenTier,
        origin:        'request_quote',
        name:          leadForm.name.trim(),
        phone:         leadForm.phone.trim(),
        email:         leadForm.email.trim() || undefined,
      });
      if (data.guestToken) localStorage.setItem('guestToken', data.guestToken);
      setDone({ show: true, origin: 'request_quote' });
    } catch (err) {
      setLeadError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setLeadLoading(false);
    }
  }, [leadForm, buildPayload, config, criticalOnly, chosenTier]);

  const handleClose = () => {
    onClose();
    // Reset after animation
    setTimeout(() => {
      setStep(1); setSelections({}); setCriticalOnly(false);
      setConfig({ autonomyHours: 12, location: 'Lagos', batteryType: 'lithium', homeType: '' });
      setResult(null); setCalcError(null);
      setChosenTier('recommended'); setChosenRec(null);
      setLeadForm({ name: '', phone: '', email: '' }); setLeadError(null);
      setDone({ show: false, origin: '' });
    }, 300);
  };

  if (!isOpen) return null;

  const STEP_LABELS = ['Select Appliances', 'Configure System', 'View Results', 'Get Quote'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      <div
        className="relative bg-white w-full max-w-[480px] rounded-[32px] shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: '92vh' }}
      >
        {/* Header */}
        {!done.show && (
          <div className="px-8 pt-7 pb-0 flex-shrink-0">
            <div className="flex justify-between items-start mb-5">
              <div className="bg-gray-50 px-4 py-2 rounded-xl">
                <span className="text-[13px] font-black text-gray-800 tracking-tight">Solar Calculator</span>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Progress bar */}
            <div className="flex gap-1.5 mb-2">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-[#FFAA14]' : 'bg-gray-100'}`} />
              ))}
            </div>
            <div className="flex justify-between items-center mb-5">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{STEP_LABELS[step - 1]}</span>
              <span className="text-[10px] font-black text-gray-400">Step {step}/4</span>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 pb-2">
          {done.show ? (
            <SuccessScreen origin={done.origin} onClose={handleClose} />
          ) : (
            <>
              {step === 1 && (
                <Step1
                  selections={selections}
                  onChange={setSelections}
                  applianceData={appData}
                  loading={appLoading}
                  criticalOnly={criticalOnly}
                  onCriticalToggle={() => setCriticalOnly(p => !p)}
                />
              )}
              {step === 2 && (
                <Step2
                  config={config}
                  onChange={(k, v) => setConfig(p => ({ ...p, [k]: v }))}
                  locations={appData?.locations}
                />
              )}
              {step === 3 && result && (
                <Step3
                  result={result}
                  onAddToCart={handleAddToCart}
                  addingToCart={addingToCart}
                  onRequestQuote={handleRequestQuote}
                />
              )}
              {step === 4 && (
                <Step4
                  form={leadForm}
                  onChange={(k, v) => setLeadForm(p => ({ ...p, [k]: v }))}
                  error={leadError}
                  chosenTier={chosenTier}
                />
              )}
              {calcError && step === 2 && (
                <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
                  <p className="text-[12px] text-red-500 font-medium">{calcError}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!done.show && (
          <div className="px-8 pb-7 pt-4 bg-white border-t border-gray-50 flex-shrink-0">
            {step === 1 && (
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

            {step === 2 && (
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-6 py-4 rounded-2xl border border-gray-200 text-sm font-black text-gray-600 hover:bg-gray-50">
                  Back
                </button>
                <button
                  onClick={handleCalculate}
                  disabled={calcLoading}
                  className={`flex-1 py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all ${
                    calcLoading
                      ? 'bg-[#FFD699] text-white cursor-not-allowed'
                      : 'bg-[#FFAA14] text-white hover:bg-[#e69912] shadow-md shadow-amber-200'
                  }`}
                >
                  {calcLoading
                    ? <><Loader2 size={18} className="animate-spin" /> Calculating...</>
                    : <>See Recommendations <ChevronRight size={18} /></>
                  }
                </button>
              </div>
            )}

            {step === 3 && (
              <button onClick={() => setStep(2)} className="w-full px-6 py-4 rounded-2xl border border-gray-200 text-sm font-black text-gray-600 hover:bg-gray-50">
                ← Adjust configuration
              </button>
            )}

            {step === 4 && (
              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="px-6 py-4 rounded-2xl border border-gray-200 text-sm font-black text-gray-600 hover:bg-gray-50">
                  Back
                </button>
                <button
                  onClick={handleSubmitLead}
                  disabled={leadLoading}
                  className={`flex-1 py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all ${
                    leadLoading
                      ? 'bg-[#FFD699] text-white cursor-not-allowed'
                      : 'bg-[#FFAA14] text-white hover:bg-[#e69912] shadow-md shadow-amber-200'
                  }`}
                >
                  {leadLoading
                    ? <><Loader2 size={18} className="animate-spin" /> Submitting...</>
                    : <>Submit Request <ChevronRight size={18} /></>
                  }
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}