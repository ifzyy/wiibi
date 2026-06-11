import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { scrollToTop } from '../utils/scrollToTop.js';
import {
  ChevronDown, ChevronLeft, ChevronRight, LayoutGrid, List,
  AlertCircle, ShoppingCart, Search, X, SlidersHorizontal,
  CheckCircle2, ArrowUpDown,
} from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useCalculatorModal } from '../context/CalculatorModalContext.jsx';
import { usePublicProducts } from '../hooks/queries';
import { recordAddToCartLead } from '../utils/solarLead.js';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: '',           label: 'Default'       },
  { value: 'newest',     label: 'Newest'        },
  { value: 'featured',   label: 'Featured'      },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'name_asc',   label: 'A → Z'         },
  { value: 'name_desc',  label: 'Z → A'         },
];

const PRICE_PRESETS = [
  { label: 'Under ₦500k',         min: '',       max: '500000'   },
  { label: '₦500k – ₦1M',         min: '500000', max: '1000000'  },
  { label: '₦1M – ₦3M',           min: '1000000',max: '3000000'  },
  { label: '₦3M – ₦10M',          min: '3000000',max: '10000000' },
  { label: 'Over ₦10M',           min: '10000000',max: ''        },
];

// ─────────────────────────────────────────────────────────────────────────────
// BANNER SLIDES
// To use real images later: add { image: '/path/to/banner.jpg', ... } to any slide.
// When `image` is set it renders as a full background; the gradient is hidden.
// ─────────────────────────────────────────────────────────────────────────────

const BANNER_SLIDES = [
  {
    id: 1,
    tag:     'Solar Energy Store',
    heading: 'Power your world.\nBuild your future.',
    sub:     'Premium solar panels, inverters & batteries — everything you need in one place.',
    cta:     { label: 'Shop All Products', filter: {} },
    accent:  '#FFAA14',
    bg:      'from-[#0C0901] via-[#1a1200] to-[#2a1f00]',
    // image: null,   ← swap in a URL here when the design team delivers
    decorators: [
      { size: 220, x: 'right-[-40px]', y: 'top-[-60px]',   opacity: 0.08, blur: 60 },
      { size: 120, x: 'right-[120px]', y: 'bottom-[-30px]',opacity: 0.12, blur: 40 },
      { size:  80, x: 'right-[60px]',  y: 'top-[40px]',    opacity: 0.06, blur: 30 },
    ],
  },
  {
    id: 2,
    tag:     'New Arrivals',
    heading: 'Next-gen inverters.\nJust landed.',
    sub:     'Lithium-powered, whisper-quiet, and built for Nigerian weather.',
    cta:     { label: 'See New Arrivals', filter: { sort: 'newest' } },
    accent:  '#22d3ee',
    bg:      'from-[#020f14] via-[#041c24] to-[#06303e]',
    decorators: [
      { size: 200, x: 'right-[-20px]', y: 'top-[-50px]',   opacity: 0.10, blur: 60 },
      { size: 100, x: 'right-[140px]', y: 'bottom-[-20px]',opacity: 0.08, blur: 35 },
    ],
  },
  {
    id: 3,
    tag:     'Top Picks',
    heading: 'Our most-loved\nsolar setups.',
    sub:     'Hand-picked by our engineers for reliability, value, and long life.',
    cta:     { label: 'View Featured', filter: { is_featured: 'true' } },
    accent:  '#a78bfa',
    bg:      'from-[#0d0614] via-[#160922] to-[#1e0d30]',
    decorators: [
      { size: 240, x: 'right-[-60px]', y: 'top-[-80px]',   opacity: 0.09, blur: 70 },
      { size:  90, x: 'right-[100px]', y: 'bottom-[-10px]',opacity: 0.07, blur: 30 },
    ],
  },
  {
    id: 4,
    tag:     'Solar Calculator',
    heading: 'Not sure what\nyou need?',
    sub:     'Answer 3 questions and get a tailored solar recommendation instantly.',
    cta:     { label: 'Use Solar Calculator', href: '/calculator' },
    accent:  '#4ade80',
    bg:      'from-[#010f07] via-[#031a0d] to-[#042e14]',
    decorators: [
      { size: 180, x: 'right-[-30px]', y: 'top-[-40px]',   opacity: 0.10, blur: 55 },
      { size: 110, x: 'right-[160px]', y: 'bottom-[-20px]',opacity: 0.07, blur: 40 },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────────────────────

/** Debounce a value by `delay` ms */
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Sync filter state ↔ URL search params */
function useFilterState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const get = (key, fallback = '') => searchParams.get(key) ?? fallback;

  const filters = {
    search:       get('search'),
    category:     get('category'),
    listing_type: get('listing_type'),
    min_price:    get('min_price'),
    max_price:    get('max_price'),
    is_featured:  get('is_featured'),
    sort:         get('sort'),
    view:         get('view', 'grid'),
    // Comma-separated product ids from the solar calculator — filters the grid
    // down to systems capable of the customer's entered load. `kva` is the
    // recommended inverter size shown in the chip; `fit=partial` means the
    // catalog couldn't meet the spec exactly and these are closest available.
    recommended:  get('recommended'),
    kva:          get('kva'),
    fit:          get('fit'),
  };

  const setFilters = useCallback((updates) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([k, v]) => {
        if (v === '' || v === null || v === undefined) next.delete(k);
        else next.set(k, v);
      });
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const clearFilters = useCallback(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams();
      if (prev.get('view')) next.set('view', prev.get('view'));
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const activeCount = [
    filters.search, filters.category, filters.listing_type,
    filters.min_price || filters.max_price, filters.is_featured,
    filters.recommended,
  ].filter(Boolean).length;

  return { filters, setFilters, clearFilters, activeCount };
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
);

const ProductCardSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="aspect-square w-full rounded-2xl" />
    <div className="flex gap-2"><Skeleton className="h-5 w-16 rounded" /><Skeleton className="h-5 w-14 rounded" /></div>
    <Skeleton className="h-5 w-3/4" />
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-2/3" />
    <Skeleton className="h-6 w-28" />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const FilterSection = ({ title, isOpen, onToggle, children }) => (
  <div className="border-b border-gray-100">
    <button
      className="w-full flex justify-between items-center py-4 text-left group"
      onClick={onToggle}
    >
      <span className="text-[13px] font-semibold text-gray-800">{title}</span>
      <ChevronDown
        size={15}
        className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
    {isOpen && <div className="pb-4">{children}</div>}
  </div>
);

const SortDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = SORT_OPTIONS.find(o => o.value === value) ?? SORT_OPTIONS[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-[12px] font-semibold text-gray-600 hover:text-black border border-gray-200 rounded-lg px-3 py-2 transition-all hover:border-gray-400 bg-white"
      >
        <ArrowUpDown size={13} />
        {current.label}
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-30 overflow-hidden min-w-[180px]">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-[12px] hover:bg-gray-50 transition-colors flex items-center justify-between
                ${opt.value === value ? 'font-bold text-black' : 'text-gray-600'}`}
            >
              {opt.label}
              {opt.value === value && <CheckCircle2 size={12} className="text-amber-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const getProductTagClasses = (tag) => {
  const normalized = String(tag || '').trim().toLowerCase();
  if (normalized === 'hot') return 'font-bold text-[#FF0000] ';
  if (normalized === 'new') return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  return 'bg-gray-100 text-gray-500';
};

const ProductCard = ({ product, viewMode, onAddToCart, isAdding, onClick }) => {
  const isGrid = viewMode === 'grid';
  const tags = Array.isArray(product.tags) ? product.tags.filter(Boolean) : [];
  return (
    <div
      className={`group cursor-pointer ${!isGrid ? 'flex gap-8 border-b border-gray-50 pb-8' : ''}`}
      onClick={onClick}
    >
      {/* Image */}
      <div className={`relative ${isGrid ? 'aspect-square mb-4' : 'w-56 h-56 flex-shrink-0'} bg-[#F8F9FA] rounded-2xl overflow-hidden border border-gray-50`}>
        {product.featured_image_url ? (
          <img
            src={product.featured_image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ShoppingCart size={32} />
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-white px-3 py-1 rounded-full border">Out of Stock</span>
          </div>
        )}
        {product.stock > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(product.id); }}
            disabled={isAdding}
            className="absolute bottom-3 right-3 bg-[#FFAA14] text-white p-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-amber-500 disabled:opacity-60 shadow-lg"
            aria-label="Add to cart"
          >
            {isAdding
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
              : <ShoppingCart size={15} />
            }
          </button>
        )}
      </div>

      {/* Info */}
      <div className={`flex flex-col ${isGrid ? '' : 'justify-center py-2'}`}>
        <div className="flex gap-1.5 mb-2.5 flex-wrap">
          {tags.map((tag) => (
            <span
              key={tag}
              className={`text-[9px] font-medium uppercase px-2 py-1 rounded tracking-wide ${getProductTagClasses(tag)}`}
            >
              {tag}
            </span>
          ))}
        </div>
        <h3 className={`font-bold text-gray-900 mb-1 leading-snug group-hover:text-[#FFAA14] transition-colors ${isGrid ? 'text-[14px]' : 'text-[16px]'}`}>
          {product.name}
        </h3>
        {product.short_description && (
          <p className="text-[11px] text-gray-400 font-medium mb-3 line-clamp-2 leading-relaxed">
            {product.short_description}
          </p>
        )}
   
        <div className="flex items-baseline gap-2 mt-auto">
          <span className={`font-bold text-gray-900 tracking-tight ${isGrid ? 'text-[17px]' : 'text-[20px]'}`}>
            ₦{Number(product.price).toLocaleString()}
          </span>
          {product.sale_price && Number(product.sale_price) > Number(product.price) && (
            <span className="text-[12px] text-gray-400 line-through">
              ₦{Number(product.sale_price).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// BANNER SLIDESHOW
// ─────────────────────────────────────────────────────────────────────────────

const BannerSlideshow = ({ onFilterApply, onNavigate }) => {
  const [current, setCurrent]   = useState(0);
  const [prev,    setPrev]      = useState(null);
  const [dir,     setDir]       = useState(1);   // 1 = forward, -1 = backward
  const [paused,  setPaused]    = useState(false);
  const [animKey, setAnimKey]   = useState(0);
  const timerRef = useRef(null);

  const total = BANNER_SLIDES.length;

  const go = useCallback((nextIndex, direction = 1) => {
    setPrev(current);
    setDir(direction);
    setCurrent(nextIndex);
    setAnimKey(k => k + 1);
  }, [current]);

  const goNext = useCallback(() => go((current + 1) % total, 1),  [go, current, total]);
  const goPrev = useCallback(() => go((current - 1 + total) % total, -1), [go, current, total]);

  // Auto-advance
  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(goNext, 5000);
    return () => clearInterval(timerRef.current);
  }, [paused, goNext]);

  const resetTimer = () => { clearInterval(timerRef.current); };

  const handleNav = (fn, direction) => {
    resetTimer();
    fn();
    // Resume after 8s of user interaction
    clearInterval(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = setInterval(goNext, 5000);
    }, 8000);
  };

  const slide = BANNER_SLIDES[current];

  return (
    <div
      className="relative w-full h-60 rounded-3xl overflow-hidden select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Slide layers ─────────────────────────────────────────────────── */}
      {BANNER_SLIDES.map((s, i) => {
        const isActive  = i === current;
        const isLeaving = i === prev;
        if (!isActive && !isLeaving) return null;

        return (
          <div
            key={s.id}
            className={`absolute inset-0 transition-all duration-700 ease-in-out
              ${isActive  ? 'opacity-100 translate-x-0 z-10' : ''}
              ${isLeaving ? `opacity-0 z-0 ${dir === 1 ? '-translate-x-8' : 'translate-x-8'}` : ''}
            `}
          >
            {/* Background: image OR gradient */}
            {s.image ? (
              <img src={s.image} alt={s.tag} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-r ${s.bg}`} />
            )}

            {/* Decorative orbs */}
            {!s.image && s.decorators.map((d, di) => (
              <div
                key={di}
                className={`absolute rounded-full pointer-events-none ${d.x} ${d.y}`}
                style={{
                  width:  d.size,
                  height: d.size,
                  background: s.accent,
                  opacity: d.opacity,
                  filter: `blur(${d.blur}px)`,
                }}
              />
            ))}

            {/* Content */}
            <div
              key={`content-${animKey}-${i}`}
              className={`relative z-10 h-full flex flex-col justify-center px-10
                ${isActive ? 'animate-[slideIn_0.55s_ease-out_forwards]' : ''}
              `}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2"
                style={{ color: s.accent }}
              >
                {s.tag}
              </p>
              <h2 className="text-white text-[26px] font-black leading-[1.15] mb-3 whitespace-pre-line">
                {s.heading}
              </h2>
              <p className="text-white/60 text-[12px] font-medium mb-5 max-w-xs leading-relaxed">
                {s.sub}
              </p>
              <button
                onClick={() => {
                  if (s.cta.href) { onNavigate(s.cta.href); }
                  else            { onFilterApply(s.cta.filter); }
                }}
                className="inline-flex items-center gap-2 font-bold text-[11px] px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 w-fit"
                style={{ background: s.accent, color: '#000' }}
              >
                {s.cta.label}
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        );
      })}

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      {/* Prev / Next arrows */}
      <button
        onClick={() => handleNav(goPrev, -1)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/25 transition-all opacity-0 hover:opacity-100 group-hover:opacity-100 focus:opacity-100"
        aria-label="Previous slide"
      >
        <ChevronLeft size={18} className="text-white" />
      </button>
      <button
        onClick={() => handleNav(goNext, 1)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/25 transition-all"
        aria-label="Next slide"
      >
        <ChevronRight size={18} className="text-white" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {BANNER_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => handleNav(() => go(i, i > current ? 1 : -1))}
            className="transition-all duration-300 rounded-full bg-white"
            style={{
              width:   i === current ? 20 : 6,
              height:  6,
              opacity: i === current ? 1 : 0.35,
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 h-0.5 bg-white/10">
        {!paused && (
          <div
            key={`progress-${current}-${animKey}`}
            className="h-full bg-white/40 rounded-full"
            style={{ animation: 'progress 5s linear forwards' }}
          />
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

const StorePage = () => {
  const navigate = useNavigate();
  const { openCalculator } = useCalculatorModal();
  const { filters, setFilters, clearFilters, activeCount } = useFilterState();
  const { addToCart } = useCart();
  const [adding, setAdding]       = useState({});
  const [mobileSidebar, setMobileSidebar] = useState(false);
useEffect(() => { scrollToTop(); }, []);
  // Sidebar accordion state
  const [openSections, setOpenSections] = useState({
    categories: true,
    brands: false,
    price: true,
    type: false,
  });

  // Local search input (debounced before hitting the query)
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 400);

  // Price range: track local slider state, apply on button click
  const [priceInput, setPriceInput] = useState({
    min: filters.min_price,
    max: filters.max_price,
  });

  // Sync debounced search → URL
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters({ search: debouncedSearch });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Build query params (only pass non-empty values)
  const queryFilters = useMemo(() => {
    const f = {};
    if (filters.search)       f.search       = filters.search;
    if (filters.category)     f.category     = filters.category;
    if (filters.listing_type) f.listing_type = filters.listing_type;
    if (filters.min_price)    f.min_price    = filters.min_price;
    if (filters.max_price)    f.max_price    = filters.max_price;
    if (filters.is_featured)  f.is_featured  = filters.is_featured;
    if (filters.sort)         f.sort         = filters.sort;
    return f;
  }, [filters]);

  const { data, isLoading, isError, isFetching } = usePublicProducts(queryFilters);
  const fetchedProducts = data?.products ?? data ?? [];

  // Calculator capable-systems filter — applied client-side over the fetched
  // set, preserving the server's order (inverters first, in-stock first).
  const products = useMemo(() => {
    if (!filters.recommended) return fetchedProducts;
    const order = new Map(filters.recommended.split(',').map((id, i) => [id, i]));
    return fetchedProducts
      .filter(p => order.has(String(p.id)))
      .sort((a, b) => order.get(String(a.id)) - order.get(String(b.id)));
  }, [fetchedProducts, filters.recommended]);

  // Derive unique categories and listing_types from ALL products (unfiltered)
  // We fetch all products once without filters for sidebar options
  const { data: allData } = usePublicProducts({});
  const allProducts = allData?.products ?? allData ?? [];

  const categories = useMemo(() =>
    [...new Set(allProducts.map(p => p.category).filter(Boolean))].sort(),
    [allProducts]
  );

  const listingTypes = useMemo(() =>
    [...new Set(allProducts.map(p => p.listing_type).filter(Boolean))].sort(),
    [allProducts]
  );

  const packageCount = allProducts.filter(p => p.listing_type === 'package').length;

  const handleAddToCart = useCallback(async (productId) => {
    setAdding(prev => ({ ...prev, [productId]: true }));
    try {
      await addToCart(productId, 1);
      // User came from the solar calculator and just added a recommended
      // product — record a silent CRM lead (deduped per calculation).
      if (filters.recommended) recordAddToCartLead();
    } catch (err) {
      console.error('Add to cart failed:', err);
    } finally {
      setAdding(prev => ({ ...prev, [productId]: false }));
    }
  }, [addToCart, filters.recommended]);

  const toggleSection = (key) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const applyPriceFilter = () => {
    setFilters({ min_price: priceInput.min, max_price: priceInput.max });
  };

  const applyPricePreset = (preset) => {
    setPriceInput({ min: preset.min, max: preset.max });
    setFilters({ min_price: preset.min, max_price: preset.max });
  };

  // ── Sidebar content (shared between desktop + mobile drawer) ──────────────
  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold tracking-tight">
          Filters
          {activeCount > 0 && (
            <span className="ml-2 bg-[#FFAA14] text-black text-[10px] font-bold px-2 py-0.5 rounded-full">{activeCount}</span>
          )}
        </h2>
        {activeCount > 0 && (
          <button
            onClick={() => { clearFilters(); setPriceInput({ min: '', max: '' }); setSearchInput(''); }}
            className="text-[10px] font-semibold text-gray-400 underline uppercase tracking-widest hover:text-black transition-colors flex items-center gap-1"
          >
            <X size={10} />
            Clear All
          </button>
        )}
      </div>

      <nav className="space-y-0">
        {/* Categories */}
        {categories.length > 0 && (
          <FilterSection title="Categories" isOpen={openSections.categories} onToggle={() => toggleSection('categories')}>
            <div className="space-y-1">
              <button
                onClick={() => setFilters({ category: '' })}
                className={`w-full text-left text-[12px] px-2 py-1.5 rounded-lg transition-colors ${!filters.category ? 'bg-black text-white font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                All Categories
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilters({ category: filters.category === cat ? '' : cat })}
                  className={`w-full text-left text-[12px] px-2 py-1.5 rounded-lg transition-colors capitalize flex justify-between items-center
                    ${filters.category === cat ? 'bg-amber-50 text-amber-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {cat}
                  {filters.category === cat && <X size={10} />}
                </button>
              ))}
            </div>
          </FilterSection>
        )}

        {/* Listing Types */}
        {listingTypes.length > 0 && (
          <FilterSection title="Product Type" isOpen={openSections.type} onToggle={() => toggleSection('type')}>
            <div className="space-y-1">
              <button
                onClick={() => setFilters({ listing_type: '' })}
                className={`w-full text-left text-[12px] px-2 py-1.5 rounded-lg transition-colors ${!filters.listing_type ? 'bg-black text-white font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                All Types
              </button>
              {listingTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setFilters({ listing_type: filters.listing_type === type ? '' : type })}
                  className={`w-full text-left text-[12px] px-2 py-1.5 rounded-lg transition-colors capitalize flex justify-between items-center
                    ${filters.listing_type === type ? 'bg-amber-50 text-amber-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {type}
                  {filters.listing_type === type && <X size={10} />}
                </button>
              ))}
            </div>
          </FilterSection>
        )}

        {/* Price */}
        <FilterSection title="Price Range" isOpen={openSections.price} onToggle={() => toggleSection('price')}>
          <div className="space-y-4">
            {/* Presets */}
            <div className="space-y-1">
              {PRICE_PRESETS.map(preset => {
                const active = priceInput.min === preset.min && priceInput.max === preset.max;
                return (
                  <button
                    key={preset.label}
                    onClick={() => applyPricePreset(preset)}
                    className={`w-full text-left text-[12px] px-2 py-1.5 rounded-lg transition-colors
                      ${active ? 'bg-amber-50 text-amber-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Manual input */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Custom Range</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceInput.min}
                  onChange={e => setPriceInput(p => ({ ...p, min: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceInput.max}
                  onChange={e => setPriceInput(p => ({ ...p, max: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100"
                />
              </div>
              <button
                onClick={applyPriceFilter}
                className="w-full bg-[#FFAA14] hover:bg-black hover:text-white text-black font-bold py-2.5 rounded-lg transition-all duration-300 text-[12px]"
              >
                Apply Price
              </button>
            </div>
          </div>
        </FilterSection>

        {/* Featured */}
        <div className="py-4 border-b border-gray-100">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => setFilters({ is_featured: filters.is_featured ? '' : 'true' })}
              className={`w-10 h-5 rounded-full transition-all duration-200 relative flex-shrink-0 cursor-pointer
                ${filters.is_featured ? 'bg-[#FFAA14]' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${filters.is_featured ? 'left-[22px]' : 'left-0.5'}`} />
            </div>
            <span className="text-[12px] font-semibold text-gray-700">Featured only</span>
          </label>
        </div>
      </nav>

      {/* Help card */}
      <div className="mt-8 bg-[#0C0901] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 text-[#FFAA14] mb-2">
          <AlertCircle size={13} fill="#FFAA14" className="text-black" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Need Help?</span>
        </div>
        <h3 className="text-[15px] font-bold mb-4 leading-tight">Find your solar setup</h3>
        <button
          onClick={openCalculator}
          className="w-full bg-[#FFAA14] text-black font-bold py-2 rounded-lg text-[11px] hover:bg-white transition-all"
        >
          Use Solar Calculator
        </button>
      </div>
    </>
  );

  // ── Active filter chips ────────────────────────────────────────────────────
  const ActiveChips = () => {
    const chips = [
      filters.recommended  && {
        key:      'recommended',
        label:    filters.fit === 'partial'
          ? '☀ Closest available systems · our team will confirm sizing'
          : `☀ Capable systems for your load${filters.kva ? ` · ${filters.kva}kVA inverter` : ''}`,
        onRemove: () => setFilters({ recommended: '', kva: '', fit: '' }),
      },
      filters.category     && { key: 'category',     label: filters.category },
      filters.listing_type && { key: 'listing_type', label: filters.listing_type },
      (filters.min_price || filters.max_price) && {
        key: 'price',
        label: `₦${filters.min_price ? Number(filters.min_price).toLocaleString() : '0'} – ${filters.max_price ? '₦' + Number(filters.max_price).toLocaleString() : '∞'}`,
        onRemove: () => { setFilters({ min_price: '', max_price: '' }); setPriceInput({ min: '', max: '' }); },
      },
      filters.is_featured  && { key: 'is_featured',  label: 'Featured' },
    ].filter(Boolean);

    if (!chips.length) return null;

    return (
      <div className="flex gap-2 flex-wrap mb-6">
        {chips.map(chip => (
          <button
            key={chip.key}
            onClick={chip.onRemove ?? (() => setFilters({ [chip.key]: '' }))}
            className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors capitalize"
          >
            {chip.label}
            <X size={10} />
          </button>
        ))}
      </div>
    );
  };

  const viewMode = filters.view || 'grid';

  return (
    <div className="bg-white min-h-screen">

      {/* Mobile sidebar overlay */}
      {mobileSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebar(false)} />
          <div className="absolute left-0 top-0 h-full w-[300px] bg-white overflow-y-auto p-6 shadow-2xl">
            <button
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              onClick={() => setMobileSidebar(false)}
            >
              <X size={16} />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto flex min-h-screen border-x border-gray-50">

        {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
        <aside className="hidden lg:block w-[280px] p-8 flex-shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-gray-100">
          <SidebarContent />
        </aside>

        {/* ── Main ────────────────────────────────────────────────────────── */}
        <main className="flex-1 bg-white min-w-0">
          {/* Banner Slideshow */}
          <div className="p-6 pb-0 group">
            <style>{`
              @keyframes slideIn {
                from { opacity: 0; transform: translateX(24px); }
                to   { opacity: 1; transform: translateX(0);    }
              }
              @keyframes progress {
                from { width: 0%;   }
                to   { width: 100%; }
              }
            `}</style>
            <BannerSlideshow
              onFilterApply={(f) => setFilters(f)}
              // The calculator banner opens the modal in place; other CTAs route
              onNavigate={(href) => href === '/calculator' ? openCalculator() : navigate(href)}
            />
          </div>

          {/* Controls bar */}
          <div className="px-6 pt-8">
            {/* Search + controls row */}
            <div className="flex items-center gap-3 mb-6">
              {/* Mobile filter toggle */}
              <button
                onClick={() => setMobileSidebar(true)}
                className="lg:hidden flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-[12px] font-semibold text-gray-600 hover:border-gray-400 transition-all flex-shrink-0"
              >
                <SlidersHorizontal size={14} />
                Filters
                {activeCount > 0 && (
                  <span className="bg-amber-400 text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{activeCount}</span>
                )}
              </button>

              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products…"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-9 py-2 text-[13px] focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-50 transition-all"
                />
                {searchInput && (
                  <button
                    onClick={() => { setSearchInput(''); setFilters({ search: '' }); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <div className="ml-auto flex items-center gap-2">
                {/* Sort */}
                <SortDropdown value={filters.sort} onChange={v => setFilters({ sort: v })} />

                {/* View toggle */}
                <button
                  onClick={() => setFilters({ view: viewMode === 'grid' ? 'list' : 'grid' })}
                  className="p-2 text-gray-400 hover:text-black bg-gray-50 hover:bg-gray-100 rounded-lg transition-all border border-gray-100"
                  aria-label="Toggle view"
                >
                  {viewMode === 'grid' ? <List size={18} /> : <LayoutGrid size={18} />}
                </button>
              </div>
            </div>

            {/* Active filter chips */}
            <ActiveChips />

            {/* Result count + fetch indicator */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 border-b border-gray-100 pb-4">
              <button
                onClick={() => setFilters({ listing_type: '' })}
                className={`text-[12px] font-semibold rounded-full px-3 py-1.5 transition ${filters.listing_type ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-black text-white'}`}
              >
                All Products {products.length}
              </button>

              <div className="flex flex-wrap items-center gap-2 justify-end">
                <button
                  onClick={() => setFilters({ listing_type: filters.listing_type === 'package' ? '' : 'package' })}
                  className={`text-[12px] font-semibold rounded-full px-3 py-1.5 transition ${filters.listing_type === 'package' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Packages {packageCount}
                </button>
                {isFetching && !isLoading && (
                  <span className="w-3.5 h-3.5 border-2 border-amber-300 border-t-amber-500 rounded-full animate-spin" />
                )}
              </div>
              {filters.search && !isLoading && (
                <span className="text-[11px] text-gray-400">
                  Results for "<span className="font-semibold text-gray-600">{filters.search}</span>"
                </span>
              )}
            </div>

            {/* ── Product grid / list ──────────────────────────────────────── */}
            {isError ? (
              <div className="py-24 text-center">
                <AlertCircle size={32} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400 font-medium">Failed to load products.</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 text-[12px] underline text-gray-500 hover:text-black"
                >
                  Retry
                </button>
              </div>
            ) : isLoading ? (
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10'
                : 'flex flex-col gap-8'
              }>
                {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-gray-300" />
                </div>
                <p className="text-gray-500 font-semibold mb-1">No products found</p>
                <p className="text-[12px] text-gray-400 mb-6">Try adjusting your filters or search terms</p>
                <button
                  onClick={() => { clearFilters(); setPriceInput({ min: '', max: '' }); setSearchInput(''); }}
                  className="bg-[#FFAA14] text-black font-bold px-6 py-2.5 rounded-lg text-[12px] hover:bg-amber-500 transition-all"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10'
                : 'flex flex-col gap-8'
              }>
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    viewMode={viewMode}
                    onAddToCart={handleAddToCart}
                    isAdding={!!adding[product.id]}
                    onClick={() => navigate(`/store/${product.slug}`)}
                  />
                ))}
              </div>
            )}

            <div className="h-24" />
          </div>
        </main>
      </div>
    </div>
  );
};

export default StorePage;