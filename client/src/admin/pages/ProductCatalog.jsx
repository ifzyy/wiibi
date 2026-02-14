import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE = 'http://localhost:5000/api';

// ── Utilities ─────────────────────────────────────────────────────────────────
const slugify = (text) =>
  text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const STATUS_CONFIG = {
  in_stock:     { label: 'In Stock',   dot: '#10b981', bg: '#ecfdf5', text: '#065f46' },
  low_stock:    { label: 'Low Stock',  dot: '#f59e0b', bg: '#fffbeb', text: '#92400e' },
  out_of_stock: { label: 'Sold Out',   dot: '#ef4444', bg: '#fef2f2', text: '#991b1b' },
  pre_order:    { label: 'Pre-Order',  dot: '#6366f1', bg: '#eef2ff', text: '#3730a3' },
};

const getComputedStatus = (stock, manualStatus) => {
  if (manualStatus === 'pre_order') return 'pre_order';
  if (stock <= 0) return 'out_of_stock';
  if (stock <= 5) return 'low_stock';
  return 'in_stock';
};

const fmt = (n) => Number(n || 0).toLocaleString('en-NG');

// ── Icons (inline SVG) ────────────────────────────────────────────────────────
const Icon = ({ name, size = 16, className = '' }) => {
  const icons = {
    plus: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />,
    save: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />,
    trash: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></>,
    edit: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
    search: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
    x: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />,
    chevronDown: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />,
    chevronUp: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />,
    image: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />,
    check: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />,
    refresh: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
    star: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />,
    eye: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>,
    eyeOff: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></>,
    upload: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      {icons[name]}
    </svg>
  );
};

// ── Badge ─────────────────────────────────────────────────────────────────────
const StatusBadge = ({ stock, manualStatus }) => {
  const key = getComputedStatus(stock, manualStatus);
  const cfg = STATUS_CONFIG[key];
  return (
    <span style={{ background: cfg.bg, color: cfg.text }} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold">
      <span style={{ background: cfg.dot }} className="w-1.5 h-1.5 rounded-full" />
      {cfg.label}
    </span>
  );
};

// ── Field ─────────────────────────────────────────────────────────────────────
const Field = ({ label, required, children, hint }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
      {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
  </div>
);

const inputCls = "w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition placeholder-gray-400";
const textareaCls = `${inputCls} resize-none leading-relaxed`;

// ── Image Upload / URL Input ──────────────────────────────────────────────────
const ImageField = ({ label, value, file, onUrlChange, onFileChange, preview }) => {
  const [mode, setMode] = useState(file ? 'file' : 'url');
  const fileRef = useRef();
  const imgSrc = mode === 'file' && file ? URL.createObjectURL(file) : (value || preview);

  return (
    <Field label={label}>
      <div className="flex gap-2 mb-2">
        {['url', 'file'].map(m => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${mode === m ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {m === 'url' ? '🔗 URL' : '📁 Upload'}
          </button>
        ))}
      </div>
      {mode === 'url' ? (
        <input type="text" value={value || ''} onChange={e => onUrlChange(e.target.value)}
          className={inputCls} placeholder="https://..." />
      ) : (
        <div onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition">
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => onFileChange(e.target.files[0])} />
          <Icon name="upload" size={20} className="mx-auto text-gray-400 mb-1" />
          <p className="text-xs text-gray-500">{file ? file.name : 'Click or drag image here'}</p>
        </div>
      )}
      {imgSrc && (
        <div className="mt-2 relative inline-block">
          <img src={imgSrc} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-gray-200 shadow-sm" />
          <button type="button" onClick={() => { onUrlChange(''); onFileChange(null); }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition">
            <Icon name="x" size={10} />
          </button>
        </div>
      )}
    </Field>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────────
const ProductCatalogPage = ({ token }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null = new
  const [dirtyIds, setDirtyIds] = useState(new Set());
  const originalMap = useRef({});

  const authHeaders = { Authorization: `Bearer ${token}` };

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/admin/products`, { headers: authHeaders });
      const data = res.data.products || [];
      setProducts(data);
      originalMap.current = Object.fromEntries(data.map(p => [p.id, JSON.stringify(p)]));
      setDirtyIds(new Set());
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Mark dirty on inline edits ──────────────────────────────────────────────
  const handleInlineUpdate = (id, updates) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, ...updates };
      setDirtyIds(prev => {
        const next = new Set(prev);
        JSON.stringify(updated) !== originalMap.current[id] ? next.add(id) : next.delete(id);
        return next;
      });
      return updated;
    }));
  };

  // ── Save individual (PUT /admin/products/:id) ───────────────────────────────
  const saveSingle = async (product) => {
    const formData = new FormData();
    const fields = ['name','slug','price','sale_price','stock','sku','category','brand',
                    'short_description','description','is_visible','is_featured'];
    fields.forEach(k => {
      if (product[k] !== undefined && product[k] !== null) formData.append(k, product[k]);
    });
    if (product._imageFile) formData.append('featuredImage', product._imageFile);
    else if (product.featured_image_url) formData.append('featured_image_url', product.featured_image_url);

    await axios.put(`${API_BASE}/admin/products/${product.id}`, formData, {
      headers: { ...authHeaders, 'Content-Type': 'multipart/form-data' },
    });
    toast.success(`"${product.name}" updated`);
    setDirtyIds(prev => { const n = new Set(prev); n.delete(product.id); return n; });
    originalMap.current[product.id] = JSON.stringify(product);
  };

  // ── Create (POST /admin/products) ──────────────────────────────────────────
  const createProduct = async (form) => {
    const formData = new FormData();
    const slug = form.slug || slugify(form.name);
    const fields = { ...form, slug };
    delete fields._imageFile;

    Object.entries(fields).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') formData.append(k, v);
    });
    if (form._imageFile) formData.append('featuredImage', form._imageFile);

    const res = await axios.post(`${API_BASE}/admin/products`, formData, {
      headers: { ...authHeaders, 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" permanently?`)) return;
    try {
      await axios.delete(`${API_BASE}/admin/products/${id}`, { headers: authHeaders });
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Product deleted');
    } catch {
      toast.error('Failed to delete product');
    }
  };

  // ── Drawer save handler ────────────────────────────────────────────────────
  const handleDrawerSave = async (formData, isEdit) => {
    try {
      if (isEdit) {
        await saveSingle(formData);
        setProducts(prev => prev.map(p => p.id === formData.id ? { ...p, ...formData } : p));
      } else {
        const created = await createProduct(formData);
        setProducts(prev => [created, ...prev]);
        toast.success(`"${created.name}" created`);
      }
      setIsDrawerOpen(false);
      setEditingProduct(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    if (q && !p.name?.toLowerCase().includes(q) && !p.category?.toLowerCase().includes(q) && !p.sku?.toLowerCase().includes(q)) return false;
    if (filterStatus !== 'all' && getComputedStatus(p.stock, p.stock_status) !== filterStatus) return false;
    if (filterCategory !== 'all' && p.category !== filterCategory) return false;
    return true;
  });

  const stats = {
    total: products.length,
    inStock: products.filter(p => getComputedStatus(p.stock, p.stock_status) === 'in_stock').length,
    lowStock: products.filter(p => getComputedStatus(p.stock, p.stock_status) === 'low_stock').length,
    outOfStock: products.filter(p => getComputedStatus(p.stock, p.stock_status) === 'out_of_stock').length,
  };

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }} className="min-h-screen bg-gray-50">

      {/* ── Top Bar ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Product Catalog</h1>
            <p className="text-sm text-gray-500 mt-0.5">{products.length} products · {dirtyIds.size} unsaved changes</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchProducts} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition" title="Refresh">
              <Icon name="refresh" size={18} />
            </button>
            <button
              onClick={() => { setEditingProduct(null); setIsDrawerOpen(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-sm shadow-indigo-200"
            >
              <Icon name="plus" size={16} />
              New Product
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, color: '#6366f1', bg: '#eef2ff' },
            { label: 'In Stock', value: stats.inStock, color: '#10b981', bg: '#ecfdf5' },
            { label: 'Low Stock', value: stats.lowStock, color: '#f59e0b', bg: '#fffbeb' },
            { label: 'Sold Out', value: stats.outOfStock, color: '#ef4444', bg: '#fef2f2' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg }} className="rounded-2xl p-4 border border-white shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{s.label}</p>
              <p style={{ color: s.color }} className="text-3xl font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Search & Filters ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, category, SKU…"
              className={`${inputCls} pl-9`}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <Icon name="x" size={14} />
              </button>
            )}
          </div>

          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={`${inputCls} w-auto`}>
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={`${inputCls} w-auto`}>
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {(search || filterStatus !== 'all' || filterCategory !== 'all') && (
            <button onClick={() => { setSearch(''); setFilterStatus('all'); setFilterCategory('all'); }}
              className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 whitespace-nowrap">
              Clear filters
            </button>
          )}
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Loading products…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Icon name="search" size={40} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-500 font-medium">No products match your filters</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting the search or filters above</p>
            </div>
          ) : (
            <>
              {/* Table Head */}
              <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <div className="col-span-4">Product</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-1 text-center">Stock</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-1 text-center">Visible</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {filtered.map(product => (
                <ProductRow
                  key={product.id}
                  product={product}
                  isDirty={dirtyIds.has(product.id)}
                  onUpdate={(updates) => handleInlineUpdate(product.id, updates)}
                  onSave={() => saveSingle(product)}
                  onEdit={() => { setEditingProduct(product); setIsDrawerOpen(true); }}
                  onDelete={() => handleDelete(product.id, product.name)}
                />
              ))}
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400">
          Showing {filtered.length} of {products.length} products
        </p>
      </div>

      {/* ── Product Drawer ── */}
      <ProductDrawer
        isOpen={isDrawerOpen}
        product={editingProduct}
        onClose={() => { setIsDrawerOpen(false); setEditingProduct(null); }}
        onSave={handleDrawerSave}
      />

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        toastClassName="rounded-xl shadow-lg"
      />
    </div>
  );
};

// ── Product Row ────────────────────────────────────────────────────────────────
const ProductRow = ({ product, isDirty, onUpdate, onSave, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border-b border-gray-50 last:border-0 transition-all ${isDirty ? 'bg-amber-50/40' : 'hover:bg-gray-50/60'}`}>
      {/* Summary row */}
      <div className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center">

        {/* Product Info */}
        <div className="col-span-4 flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
            <img
              src={product.featured_image_url || 'https://placehold.co/44?text=?'}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={e => e.target.src = 'https://placehold.co/44?text=?'}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
              {product.is_featured && (
                <Icon name="star" size={12} className="text-amber-400 fill-amber-400 flex-shrink-0" />
              )}
              {isDirty && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" title="Unsaved changes" />}
            </div>
            <p className="text-xs text-gray-400 truncate">{product.category || '—'}{product.sku ? ` · ${product.sku}` : ''}</p>
          </div>
        </div>

        {/* Price */}
        <div className="col-span-2 text-right">
          <p className="text-sm font-bold text-gray-900">₦{fmt(product.sale_price || product.price)}</p>
          {product.sale_price && product.sale_price < product.price && (
            <p className="text-xs text-gray-400 line-through">₦{fmt(product.price)}</p>
          )}
        </div>

        {/* Stock inline edit */}
        <div className="col-span-1 flex justify-center">
          <input
            type="number" min={0} value={product.stock ?? 0}
            onChange={e => onUpdate({ stock: Number(e.target.value) })}
            className="w-16 text-center text-sm font-semibold border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          />
        </div>

        {/* Status */}
        <div className="col-span-2 flex justify-center">
          <StatusBadge stock={product.stock} manualStatus={product.stock_status} />
        </div>

        {/* Visible toggle */}
        <div className="col-span-1 flex justify-center">
          <button
            onClick={() => onUpdate({ is_visible: !product.is_visible })}
            className={`p-1.5 rounded-lg transition ${product.is_visible ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' : 'text-gray-400 bg-gray-100 hover:bg-gray-200'}`}
            title={product.is_visible ? 'Visible to customers' : 'Hidden from store'}
          >
            <Icon name={product.is_visible ? 'eye' : 'eyeOff'} size={16} />
          </button>
        </div>

        {/* Actions */}
        <div className="col-span-2 flex justify-end gap-1.5">
          {isDirty && (
            <button onClick={onSave}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition">
              <Icon name="save" size={13} />
              Save
            </button>
          )}
          <button onClick={onEdit}
            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
            <Icon name="edit" size={16} />
          </button>
          <button onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
            <Icon name="trash" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Product Drawer (Create / Edit) ────────────────────────────────────────────
const BLANK_FORM = {
  name: '', slug: '', price: '', sale_price: '', stock: 0, sku: '',
  category: '', brand: '', short_description: '', description: '',
  featured_image_url: '', is_visible: true, is_featured: false,
  _imageFile: null,
};

const ProductDrawer = ({ isOpen, product, onClose, onSave }) => {
  const [form, setForm] = useState(BLANK_FORM);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!product;

  useEffect(() => {
    if (isOpen) {
      setForm(product ? { ...BLANK_FORM, ...product, _imageFile: null } : BLANK_FORM);
    }
  }, [isOpen, product]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSlugBlur = () => {
    if (!form.slug && form.name) set('slug', slugify(form.name));
  };

  const validate = () => {
    if (!form.name?.trim()) { toast.error('Product name is required'); return false; }
    if (!form.price || Number(form.price) <= 0) { toast.error('A valid price is required'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    await onSave({ ...form, slug: form.slug || slugify(form.name) }, isEdit);
    setSubmitting(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 w-full max-w-xl z-50 bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Product' : 'New Product'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{isEdit ? `ID: ${product?.id}` : 'Fields marked * are required'}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition">
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-5">

            {/* Basic Info */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Basic Information</h3>
              <div className="space-y-4">
                <Field label="Product Name" required>
                  <input type="text" value={form.name} onBlur={handleSlugBlur}
                    onChange={e => set('name', e.target.value)} className={inputCls}
                    placeholder="e.g. 5kWh Lithium Battery" />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Category">
                    <input type="text" value={form.category} onChange={e => set('category', e.target.value)}
                      className={inputCls} placeholder="Batteries, Inverters…" />
                  </Field>
                  <Field label="Brand">
                    <input type="text" value={form.brand} onChange={e => set('brand', e.target.value)}
                      className={inputCls} placeholder="Luminous, Felicity…" />
                  </Field>
                </div>

                <Field label="Slug (URL)" hint="Auto-generated from name. Must be unique.">
                  <input type="text" value={form.slug} onChange={e => set('slug', e.target.value)}
                    className={inputCls} placeholder="5kwh-lithium-battery" />
                </Field>

                <Field label="SKU" hint="Unique stock-keeping unit identifier">
                  <input type="text" value={form.sku} onChange={e => set('sku', e.target.value)}
                    className={inputCls} placeholder="BAT-5KWH-001" />
                </Field>
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* Pricing */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Pricing & Stock</h3>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Price (₦)" required>
                  <input type="number" min={0} value={form.price} onChange={e => set('price', e.target.value)}
                    className={inputCls} placeholder="850000" />
                </Field>
                <Field label="Sale Price (₦)" hint="Leave blank for no sale">
                  <input type="number" min={0} value={form.sale_price || ''} onChange={e => set('sale_price', e.target.value || null)}
                    className={inputCls} placeholder="750000" />
                </Field>
                <Field label="Stock Quantity">
                  <input type="number" min={0} value={form.stock} onChange={e => set('stock', Number(e.target.value))}
                    className={inputCls} placeholder="45" />
                </Field>
                <Field label="Stock Status" hint="Override auto-detection">
                  <select value={form.stock_status || 'auto'} onChange={e => set('stock_status', e.target.value === 'auto' ? null : e.target.value)}
                    className={inputCls}>
                    <option value="auto">Auto (from qty)</option>
                    <option value="pre_order">Pre-Order</option>
                  </select>
                </Field>
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* Description */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Descriptions</h3>
              <div className="space-y-4">
                <Field label="Short Description" hint="Displayed in product cards (max 500 chars)">
                  <textarea rows={2} value={form.short_description || ''} onChange={e => set('short_description', e.target.value)}
                    className={textareaCls} maxLength={500}
                    placeholder="High-performance lithium battery for solar storage…" />
                </Field>
                <Field label="Full Description">
                  <textarea rows={5} value={form.description || ''} onChange={e => set('description', e.target.value)}
                    className={textareaCls}
                    placeholder="Detailed specs, features, warranty information…" />
                </Field>
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* Image */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Featured Image</h3>
              <ImageField
                label="Product Image"
                value={form.featured_image_url}
                file={form._imageFile}
                preview={product?.featured_image_url}
                onUrlChange={v => set('featured_image_url', v)}
                onFileChange={f => set('_imageFile', f)}
              />
            </section>

            <hr className="border-gray-100" />

            {/* Flags */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Visibility & Flags</h3>
              <div className="space-y-3">
                {[
                  { key: 'is_visible', label: 'Visible in store', desc: 'Customers can see and purchase this product' },
                  { key: 'is_featured', label: 'Featured product', desc: 'Show in homepage carousel / featured section' },
                ].map(({ key, label, desc }) => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5">
                      <input type="checkbox" checked={!!form[key]} onChange={e => set(key, e.target.checked)}
                        className="peer sr-only" />
                      <div className="w-9 h-5 bg-gray-200 rounded-full peer-checked:bg-indigo-600 transition-colors" />
                      <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transform peer-checked:translate-x-4 transition-transform" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{label}</p>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 font-medium border border-gray-200 rounded-xl hover:bg-gray-100 transition">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-sm shadow-indigo-200">
            {submitting ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
            ) : (
              <><Icon name={isEdit ? 'save' : 'plus'} size={15} />{isEdit ? 'Save Changes' : 'Create Product'}</>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default ProductCatalogPage;