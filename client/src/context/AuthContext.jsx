/**
 * src/context/AuthContext.jsx
 */

import {
  createContext, useContext, useState,
  useEffect, useCallback, useRef,
} from 'react';
import api from '../utils/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef(null);

  // ── Restore session on page load ──────────────────────────────────────────
  useEffect(() => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    api.get('/users/me', { signal: ctrl.signal })
      .then((res) => {
        setUser(res.data.data);
        localStorage.setItem('isLoggedIn', 'true');
      })
      .catch((err) => {
        if (err.name === 'CanceledError') return;
        setUser(null);
        localStorage.removeItem('isLoggedIn');
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, []);

  // ── Listen for forced logout from api.js ──────────────────────────────────
  useEffect(() => {
    const handler = () => {
      setUser(null);
      localStorage.removeItem('isLoggedIn');
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  const guestToken  = () => localStorage.getItem('guestToken');
  const guestHeader = () => guestToken() ? { 'X-Guest-Token': guestToken() } : {};

  const afterLogin = (u) => {
    setUser(u);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.removeItem('guestToken');
  };

  const buildIdentifierPayload = (identifier) => {
    if (typeof identifier === 'string') {
      const trimmed = identifier.trim();
      return trimmed.includes('@')
        ? { email: trimmed.toLowerCase() }
        : { phoneNumber: trimmed };
    }
    return identifier;
  };

  // ── OTP ───────────────────────────────────────────────────────────────────
  const requestOtp = useCallback(async (identifier) => {
    const payload = buildIdentifierPayload(identifier);
    const res = await api.post('/auth/request-otp', payload);
    return res.data;
  }, []);

  const verifyOtp = useCallback(async (identifier, otp) => {
    const payload = buildIdentifierPayload(identifier);
    const res = await api.post('/auth/verify-otp', { ...payload, otp }, { headers: guestHeader() });
    afterLogin(res.data.data.user);
    return res.data.data.user;
  }, []);

  // ── Password ──────────────────────────────────────────────────────────────
  const loginWithPassword = useCallback(async (phoneNumber, password) => {
    const res = await api.post('/auth/login', { phoneNumber, password }, { headers: guestHeader() });
    afterLogin(res.data.data.user);
    return res.data.data.user;
  }, []);

  // ── Google ────────────────────────────────────────────────────────────────
  // credential = id_token  (One Tap, button)  — no redirectUri needed
  // credential = auth-code (mobile redirect)  — redirectUri required
  const loginWithGoogle = useCallback(async (credential, redirectUri = null) => {
    const body = redirectUri ? { credential, redirectUri } : { credential };
    const res  = await api.post('/oauth/google', body, { headers: guestHeader() });
    afterLogin(res.data.data.user);
    return res.data.data.user;
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    setUser(null);
    localStorage.removeItem('isLoggedIn');
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await api.get('/users/me');
    setUser(res.data.data);
    return res.data.data;
  }, []);

  return (
    <AuthContext.Provider value={{
      user, loading, isLoggedIn: !!user,
      requestOtp, verifyOtp, loginWithPassword,
      loginWithGoogle,
      logout, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};