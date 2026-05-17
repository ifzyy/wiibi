/**
 * context/CartContext.jsx
 *
 * CHANGES:
 *  1. On login (isLoggedIn changes true), we re-fetch cart immediately.
 *     The server has already merged the guest cart — so the refetch returns
 *     the merged cart. No client-side merge logic needed.
 *
 *  2. guestToken is written to localStorage only when the server returns it
 *     (new guest session). After login + merge it's cleared by AuthContext.
 *
 *  3. AbortController + debounce prevent rapid re-fetches and stale setState.
 *
 *  4. prevLoggedIn ref tracks the login→logout transition so we only re-fetch
 *     when the state *changes*, not on every render.
 */

import {
  createContext, useContext, useState,
  useEffect, useCallback, useRef,
} from 'react';
import api from '../utils/api.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isLoggedIn } = useAuth();

  const [cart,       setCart]       = useState({ items: [], total: '0.00' });
  const [loading,    setLoading]    = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const abortRef    = useRef(null);
  const debounceRef = useRef(null);
  const prevLogin   = useRef(null);  // tracks previous isLoggedIn to detect changes

  // ── Fetch cart ────────────────────────────────────────────────────────────
  const fetchCart = useCallback(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      // Cancel any in-flight request
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setLoading(true);
      try {
        const res  = await api.get('/cart', { signal: ctrl.signal });
        const data = res.data.data;

        // Server may issue a new guestToken for fresh guest sessions
        if (data.guestToken) localStorage.setItem('guestToken', data.guestToken);

        setCart(data);
      } catch (err) {
        if (err.name !== 'CanceledError') console.error('Cart fetch error:', err.message);
      } finally {
        setLoading(false);
      }
    }, 80);
  }, []);

  // ── Fetch on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchCart();
    return () => {
      clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchCart]);

  // ── Re-fetch when login state changes ─────────────────────────────────────
  // When user logs in: server merged the guest cart. Re-fetch to get merged cart.
  // When user logs out: re-fetch to get a fresh guest cart.
  useEffect(() => {
    // Skip the very first render (prevLogin is null on mount)
    if (prevLogin.current === null) {
      prevLogin.current = isLoggedIn;
      return;
    }
    // Only fire if the value actually changed
    if (prevLogin.current !== isLoggedIn) {
      prevLogin.current = isLoggedIn;
      fetchCart();
    }
  }, [isLoggedIn, fetchCart]);

  // ── Cart mutations ────────────────────────────────────────────────────────
  const addToCart = useCallback(async (productId, quantity = 1) => {
    const res = await api.post('/cart/items', { productId, quantity });
    await fetchCart();
    setDrawerOpen(true);
    return res.data;
  }, [fetchCart]);

  const updateItem = useCallback(async (itemId, quantity) => {
    await api.put(`/cart/items/${itemId}`, { quantity });
    await fetchCart();
  }, [fetchCart]);

  const removeItem = useCallback(async (itemId) => {
    await api.delete(`/cart/items/${itemId}`);
    await fetchCart();
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    await api.delete('/cart');
    setCart({ items: [], total: '0.00' });
  }, []);

  const saveCart = useCallback(async () => {
    const res = await api.post('/cart/saved');
    return res.data.data;
  }, []);

  const itemCount = (cart.items || []).reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart, loading, drawerOpen, itemCount,
      setDrawerOpen, fetchCart,
      addToCart, saveCart, updateItem, removeItem, clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
};