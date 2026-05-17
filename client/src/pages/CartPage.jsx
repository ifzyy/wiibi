import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';

const DEBOUNCE_MS = 1200;

const CartPage = () => {
  const { cart, updateItem, removeItem, clearCart, saveCart } = useCart();
  const navigate = useNavigate();

  const serverItems = cart.items || [];
  const deliveryFee = Number(cart.deliveryFee || 8300);

  // ── Local quantity map ─────────────────────────────────────────────────────
  const [localQtys, setLocalQtys] = useState(() =>
    Object.fromEntries(serverItems.map((i) => [i.id, i.quantity]))
  );

  useEffect(() => {
    setLocalQtys(Object.fromEntries(serverItems.map((i) => [i.id, i.quantity])));
  }, [cart]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pending changes ref ────────────────────────────────────────────────────
  const pendingRef   = useRef({});
  const timerRef     = useRef(null);
  const isSyncingRef = useRef(false);

  const flushPending = useCallback(async () => {
    const batch = { ...pendingRef.current };
    if (!Object.keys(batch).length) return;
    pendingRef.current = {};
    isSyncingRef.current = true;
    await Promise.all(Object.entries(batch).map(([id, qty]) => updateItem(id, qty)));
    isSyncingRef.current = false;
  }, [updateItem]);

  const changeQty = useCallback((itemId, newQty, stock) => {
    if (newQty < 1) {
      delete pendingRef.current[itemId];
      clearTimeout(timerRef.current);
      setLocalQtys((prev) => { const n = { ...prev }; delete n[itemId]; return n; });
      removeItem(itemId);
      return;
    }
    const clamped = stock != null ? Math.min(newQty, stock) : newQty;
    setLocalQtys((prev) => ({ ...prev, [itemId]: clamped }));
    pendingRef.current[itemId] = clamped;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flushPending, DEBOUNCE_MS);
  }, [flushPending, removeItem]);

  // Flush on unmount
  useEffect(() => () => {
    clearTimeout(timerRef.current);
    if (Object.keys(pendingRef.current).length) flushPending();
  }, [flushPending]);

  // Merge server items with local qtys for instant UI
  const items = serverItems.map((item) => ({
    ...item,
    quantity: localQtys[item.id] ?? item.quantity,
  }));

  const totalQty   = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal   = items.reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0);
  const grandTotal = subtotal + deliveryFee;

  const handleCheckout = () => {
    clearTimeout(timerRef.current);
    flushPending();
    navigate('/checkout');
  };

  const [saving, setSaving] = useState(false);

  const handleSaveAndClear = async () => {
    clearTimeout(timerRef.current);
    pendingRef.current = {};
    setSaving(true);

    try {
      await saveCart();
      await clearCart();
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login', { state: { returnTo: '/cart' } });
        return;
      }
      console.error('Save cart failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white min-h-screen font-sans">

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-8">
          <h1 className="text-xl font-bold text-gray-900">Cart</h1>
          {items.length > 0 && (
            <span className="bg-gray-900 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center leading-none">
              {totalQty}
            </span>
          )}
        </div>

        {/* ── Empty state ─────────────────────────────────────────────────── */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag size={28} className="text-gray-300" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-400 text-sm mb-6 max-w-xs">
              Browse our solar products and find something you love.
            </p>
            <button
              onClick={() => navigate('/store')}
              className="bg-[#FFAA14] text-white font-bold px-6 py-3 rounded-xl hover:bg-amber-500 transition-colors text-sm">
              Browse Products →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">

            {/* ── Items list ─────────────────────────────────────────────── */}
            <div className="divide-y divide-gray-100">
              {items.map((item) => {
                const p     = item.product || {};
                const stock = p.stock ?? null;
                const atMax = stock != null && item.quantity >= stock;

                return (
                  <div key={item.id} className="py-5 flex gap-4">

                    {/* Thumbnail */}
                    <div
                      onClick={() => p.slug && navigate(`/store/${p.slug}`)}
                      className="w-[90px] h-[90px] shrink-0 bg-gray-50 border border-gray-100 rounded-lg overflow-hidden cursor-pointer flex items-center justify-center">
                      {p.featured_image_url ? (
                        <img
                          src={p.featured_image_url}
                          alt={p.name}
                          className="w-full h-full object-contain mix-blend-multiply" />
                      ) : (
                        <ShoppingBag size={24} className="text-gray-200" />
                      )}
                    </div>

                    {/* Details + actions */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        {/* Name & specs */}
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm leading-snug truncate">
                            {p.name || item.productName}
                          </p>
                          {p.specs && (
                            <p className="text-xs text-gray-400 mt-0.5">{p.specs}</p>
                          )}
                        </div>

                        {/* Price */}
                        <p className="font-bold text-gray-900 text-sm shrink-0">
                          ₦{(Number(item.unitPrice) * item.quantity).toLocaleString()}
                        </p>
                      </div>

                      {/* Bottom row: delete + qty stepper */}
                      <div className="flex items-center justify-between mt-4">
                        {/* Delete */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                          aria-label="Remove item">
                          <Trash2 size={15} />
                        </button>

                        {/* Qty stepper */}
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => changeQty(item.id, item.quantity - 1, stock)}
                              className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-500 hover:text-gray-800 transition-all">
                              <Minus size={11} />
                            </button>
                            <span className="text-sm font-semibold text-gray-800 w-4 text-center tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => changeQty(item.id, item.quantity + 1, stock)}
                              disabled={atMax}
                              className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all
                                ${atMax
                                  ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                  : 'border-[#FFAA14] text-[#FFAA14] hover:bg-amber-50'}`}>
                              <Plus size={11} />
                            </button>
                          </div>
                          {atMax && (
                            <p className="text-[10px] text-amber-500 font-semibold">
                              Max {stock} in stock
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Cart Summary sidebar ────────────────────────────────────── */}
            <div className="sticky top-6">
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                {/* Summary header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900 text-sm">Cart Summary</h2>
                  <button
                    onClick={handleSaveAndClear}
                    disabled={saving}
                    className="text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save and clear cart'}
                  </button>
                </div>

                {/* Line items */}
                <div className="px-5 py-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal ({totalQty} item{totalQty !== 1 ? 's' : ''})</span>
                    <span className="font-semibold text-gray-900">₦{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Delivery Fee</span>
                    <span className="font-semibold text-gray-900">₦{deliveryFee.toLocaleString()}</span>
                  </div>

                  <div className="border-t border-gray-100 pt-3 flex justify-between text-sm">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-gray-900">₦{grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <div className="px-5 pb-5">
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-[#FFAA14] hover:bg-amber-500 active:scale-[0.98] text-white font-bold py-3 rounded-xl transition-all text-sm">
                    Check Out &nbsp; ₦{grandTotal.toLocaleString()}
                  </button>

                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;