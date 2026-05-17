/**
 * admin/pages/Login.jsx
 *
 * Modal overlay — light, minimal, Tailwind-only styling.
 */

import { useState } from 'react';
import { api } from '../utils/api.js';
import { Icon, I } from '../utils/icons.jsx';

export const LoginScreen = ({ onLogin }) => {
  const [mode,        setMode]    = useState('password');
  const [step,        setStep]    = useState(1);
  const [phoneNumber, setPhone]   = useState('');
  const [password,    setPassword]= useState('');
  const [otp,         setOtp]     = useState('');
  const [showPw,      setShowPw]  = useState(false);
  const [error,       setError]   = useState('');
  const [info,        setInfo]    = useState('');
  const [loading,     setLoading] = useState(false);

  const resetError = () => { setError(''); setInfo(''); };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    resetError();
    setLoading(true);
    try {
      const res =await api.post('/auth/login', body, {
  headers: { 'X-Guest-Token': localStorage.getItem('guestToken') ?? '' }
});
      if (res.data.data?.user?.role !== 'admin') {
        setError('This account does not have admin privileges.');
        return;
      }
      onLogin();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid phone number or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    resetError();
    setLoading(true);
    try {
      await api.post('/auth/request-otp', { phoneNumber });
      setInfo('OTP sent. Check your phone.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    resetError();
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { phoneNumber, otp });
      if (res.data.data?.user?.role !== 'admin') {
        setError('This account does not have admin privileges.');
        return;
      }
      onLogin();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => { setMode(m); setStep(1); setOtp(''); resetError(); };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{
          background: 'rgba(0,0,0,0.2)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Modal card */}
        <div
          className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100"
          style={{ animation: 'modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both' }}
        >
          <style>{`
            @keyframes modalIn {
              from { opacity: 0; transform: scale(0.95) translateY(8px); }
              to   { opacity: 1; transform: scale(1)    translateY(0);   }
            }
          `}</style>

          <div className="px-7 pt-7 pb-8">

            {/* Logo + title */}
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center font-black text-sm text-amber-900">
                W
              </div>
              <span className="font-bold text-gray-700 text-sm">Wiibi Energy</span>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-0.5">Welcome back</h2>
            <p className="text-sm text-gray-400 mb-5">Sign in to your admin dashboard</p>

            {/* Mode tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
              {[{ id: 'password', label: 'Password' }, { id: 'otp', label: 'OTP / SMS' }].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => switchMode(tab.id)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    mode === tab.id
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Feedback */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-500 px-3.5 py-2.5 rounded-xl mb-4 text-xs font-medium">
                <span className="mt-px">⚠</span>
                <span>{error}</span>
              </div>
            )}
            {info && !error && (
              <div className="flex items-start gap-2 bg-green-50 border border-green-100 text-green-600 px-3.5 py-2.5 rounded-xl mb-4 text-xs font-medium">
                <span>✓</span>
                <span>{info}</span>
              </div>
            )}

            {/* ── Password form ── */}
            {mode === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <Field label="Phone Number">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+2348012345678"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                  />
                </Field>

                <Field label="Password">
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      <Icon d={showPw ? I.eyeOff : I.eye} size={15} />
                    </button>
                  </div>
                </Field>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-amber-900 font-bold text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <><Spinner /> Signing in…</> : 'Sign in →'}
                </button>
              </form>
            )}

            {/* ── OTP step 1 ── */}
            {mode === 'otp' && step === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <Field label="Phone Number">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+2348012345678"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                  />
                </Field>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-amber-900 font-bold text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <><Spinner /> Sending OTP…</> : 'Send OTP →'}
                </button>
              </form>
            )}

            {/* ── OTP step 2 ── */}
            {mode === 'otp' && step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <Field label="Phone Number">
                  <input
                    type="tel"
                    value={phoneNumber}
                    readOnly
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-300 cursor-not-allowed"
                  />
                </Field>
                <Field label="6-digit OTP">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                    placeholder="000000"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 tracking-widest font-mono placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                  />
                </Field>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-amber-900 font-bold text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <><Spinner /> Verifying…</> : 'Verify & Sign in →'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(''); resetError(); }}
                  className="w-full text-gray-400 hover:text-gray-500 text-xs font-medium py-1 transition-colors text-center"
                >
                  ← Use a different number
                </button>
              </form>
            )}

            <p className="text-center text-gray-300 text-xs mt-6">
              Wiibi Energy · Admin only
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
      {label}
    </label>
    {children}
  </div>
);

const Spinner = () => (
  <span className="w-3.5 h-3.5 border-2 border-amber-700/30 border-t-amber-900 rounded-full inline-block animate-spin" />
);