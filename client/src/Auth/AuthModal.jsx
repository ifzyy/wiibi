/**
 * AuthModal.jsx
 *
 * Google strategy:
 *
 *  1. One Tap (primary for all devices)
 *     - useGoogleOneTapLogin fires automatically when the modal opens
 *     - "Continue with Google" button also calls google.accounts.id.prompt()
 *       to show the One Tap card on demand — no popup, never blocked
 *
 *  2. Mobile redirect (fallback only)
 *     - Used when One Tap fails (incognito, third-party cookies disabled)
 *     - Detected via the onError callback from useGoogleOneTapLogin
 *     - Falls back to useGoogleLogin ux_mode:'redirect'
 */

import { useState, useRef, useCallback } from 'react';
import { X, Check }                      from 'lucide-react';
import { useGoogleOneTapLogin, useGoogleLogin } from '@react-oauth/google';
import { useAuth }                       from '../context/AuthContext.jsx';
import { useCart }                       from '../context/CartContext.jsx';

const MOBILE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
    <path d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.5-.4-3.5z" fill="#FFC107"/>
    <path d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" fill="#FF3D00"/>
    <path d="M24 44c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.2C29.3 35.2 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8H6.4C9.8 35.6 16.4 44 24 44z" fill="#4CAF50"/>
    <path d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.2 5.2C41.2 35.4 44 30.1 44 24c0-1.2-.1-2.5-.4-3.5z" fill="#1976D2"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

const NigerianFlagIcon = () => (
  <svg width="24" height="16" viewBox="0 0 900 600" fill="none">
    <rect width="300" height="600" fill="#008751"/>
    <rect x="300" width="300" height="600" fill="white"/>
    <rect x="600" width="300" height="600" fill="#008751"/>
  </svg>
);

const Spinner = () => (
  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
);

const OrDivider = () => (
  <div className="flex items-center gap-3 my-5">
    <div className="flex-1 h-px bg-stone-100" />
    <span className="text-xs font-bold text-gray-300 tracking-widest uppercase">or</span>
    <div className="flex-1 h-px bg-stone-100" />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────

const AuthModal = ({ isOpen, onClose, view, setView, onSuccess }) => {
  const { requestOtp, verifyOtp, loginWithGoogle } = useAuth();
  const { fetchCart } = useCart();

  // ALL hooks before any conditional return
  const [step,          setStep]          = useState('form');
  const [method,        setMethod]        = useState('email');
  const [email,         setEmail]         = useState('');
  const [phoneNumber,   setPhone]         = useState('');
  const [otp,           setOtp]           = useState(new Array(6).fill(''));
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [oneTapFailed,  setOneTapFailed]  = useState(false); // true = fall back to redirect
  const [error,         setError]         = useState('');
  const otpRefs = useRef([]);

  const resetError = () => setError('');
  const fullPhone  = (p) => p.startsWith('+') ? p : '+234' + p.replace(/^0/, '');

  // ── Shared: handle credential from One Tap ────────────────────────────────
  // credential is the id_token string Google passes to onSuccess
  const handleGoogleCredential = useCallback(async (credential) => {
    setGoogleLoading(true);
    resetError();
    try {
      const user = await loginWithGoogle(credential); // no redirectUri = id_token path
      await fetchCart();
      setStep('success');
      onSuccess?.(user);
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  }, [loginWithGoogle, fetchCart, onSuccess]);

  // ── One Tap: fires automatically when hook is active ─────────────────────
  // Disabled when modal is closed (isOpen check) or user is loading
  // suppress_on_tap_outside: false keeps it visible if user clicks elsewhere
  useGoogleOneTapLogin({
    onSuccess: (res) => handleGoogleCredential(res.credential),
    onError:   ()    => setOneTapFailed(true), // One Tap not available — use redirect
    disabled:  !isOpen, // only active when modal is open
    cancel_on_tap_outside: false,
  });

  // ── Redirect fallback: only used if One Tap failed ────────────────────────
  const googleRedirect = useGoogleLogin({
    flow:         'auth-code',
    ux_mode:      'redirect',
    redirect_uri: MOBILE_REDIRECT_URI,
    onError:      () => setError('Google sign-in was cancelled or failed'),
  });

  // ── Button click ──────────────────────────────────────────────────────────
  // Primary: re-prompt One Tap via the Google SDK directly (no popup)
  // Fallback: redirect (if One Tap previously reported it's unavailable)
  const handleGoogleClick = () => {
    resetError();

    if (oneTapFailed) {
      // One Tap not available in this browser/context — use redirect
      googleRedirect();
      return;
    }

    // Trigger One Tap programmatically — shows Google's card, not a popup
    // This is the same card that auto-shows on page load
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // One Tap suppressed (e.g. user dismissed it too many times) — fall back
          setOneTapFailed(true);
          googleRedirect();
        }
      });
    } else {
      // SDK not ready yet — fall back
      googleRedirect();
    }
  };

  // ── OTP Step 1 ────────────────────────────────────────────────────────────
  const handleIdentifierSubmit = async () => {
    resetError();
    const identifier = method === 'email'
      ? email.trim().toLowerCase()
      : phoneNumber.trim();

    if (!identifier) {
      setError(method === 'email'
        ? 'Please enter your email address'
        : 'Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      const payload = method === 'email'
        ? identifier
        : fullPhone(identifier);
      await requestOtp(payload);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP Step 2: digit input ───────────────────────────────────────────────
  const handleOtpChange = (el, index) => {
    if (isNaN(el.value)) return;
    const next = [...otp];
    next[index] = el.value;
    setOtp(next);
    if (el.value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0)
      otpRefs.current[index - 1]?.focus();
  };

  // ── OTP Step 3: verify ────────────────────────────────────────────────────
  const handleOtpVerify = async () => {
    resetError();
    const code = otp.join('');
    if (code.length !== 6) { setError('Enter all 6 digits'); return; }
    setLoading(true);
    try {
      const identifier = method === 'email'
        ? email.trim().toLowerCase()
        : fullPhone(phoneNumber.trim());
      const user = await verifyOtp(identifier, code);
      await fetchCart();
      setStep('success');
      onSuccess?.(user);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
      setOtp(new Array(6).fill(''));
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setOtp(new Array(6).fill(''));
    setEmail('');
    setPhone('');
    setMethod('email');
    setError('');
    onClose();
  };

  const ErrorBanner = () => !error ? null : (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-4 text-sm">
      <span className="shrink-0">⚠</span> {error}
    </div>
  );

  // Early return AFTER all hooks
  if (!isOpen) return null;

  // ── Success ───────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-[#F9F9F9] w-full max-w-[360px] rounded-[32px] p-12 text-center shadow-2xl">
          <div className="w-20 h-20 bg-white border border-stone-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
            <div className="w-10 h-10 rounded-full border-2 border-[#FFAA14] flex items-center justify-center">
              <Check size={20} strokeWidth={3} className="text-[#FFAA14]" />
            </div>
          </div>
          <h3 className="text-gray-900 font-black text-xl mb-2">You're in!</h3>
          <p className="text-gray-500 font-medium text-sm mb-10 px-4 leading-relaxed">
            Welcome to Wiibi Energy. Start shopping or explore your account.
          </p>
          <button onClick={handleClose}
            className="w-full bg-[#FFAA14] text-white font-black py-4 rounded-2xl hover:bg-amber-500 transition-all shadow-lg">
            Continue
          </button>
        </div>
      </div>
    );
  }

  // ── OTP verification ──────────────────────────────────────────────────────
  if (step === 'otp') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-[440px] rounded-[32px] p-10 shadow-2xl relative">
          <button onClick={handleClose} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900">
            <X size={24} />
          </button>
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900 mb-2">Verify your {method}</h2>
            <p className="text-gray-500 font-medium text-sm leading-relaxed">
              Enter the 6-digit OTP sent to{' '}
              <span className="text-gray-900 font-bold">{method === 'email' ? email.trim().toLowerCase() : phoneNumber.trim()}</span>
            </p>
          </div>
          <ErrorBanner />
          <div className="flex justify-between gap-2 mb-10">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                maxLength="1"
                ref={(el) => (otpRefs.current[index] = el)}
                value={digit}
                onChange={(e) => handleOtpChange(e.target, index)}
                onKeyDown={(e) => handleOtpKeyDown(e, index)}
                onFocus={(e) => e.target.select()}
                className="w-12 h-14 bg-stone-100 border border-stone-100 rounded-xl text-center font-black text-xl text-gray-900 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all"
              />
            ))}
          </div>
          <button
            onClick={handleOtpVerify}
            disabled={loading || otp.join('').length !== 6}
            className="w-full bg-[#FFAA14] hover:bg-amber-500 text-white font-black py-5 rounded-2xl transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Spinner /> Verifying…</> : 'Verify & Continue'}
          </button>
          <div className="text-center mt-6 space-y-2">
            <button
              onClick={() => { setStep('form'); setOtp(new Array(6).fill('')); resetError(); }}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors block w-full"
            >
              ← Use a different {method === 'email' ? 'email' : 'phone'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-[440px] rounded-[32px] p-10 shadow-2xl relative">
        <button onClick={handleClose} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900">
          <X size={24} />
        </button>
        <div className="mb-8">
          <h2 className="text-3xl font-black text-gray-900 mb-2">
            Sign In
          </h2>
          <p className="text-gray-500 font-medium">
            Sign in to access your account or create one.
          </p>
        </div>

        <ErrorBanner />


        <OrDivider />

        <div className="space-y-5">
            <div className="flex gap-2 mb-3 rounded-2xl bg-stone-100 p-2">
              {['email', 'phone'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMethod(option)}
                  className={`flex-1 rounded-2xl py-3 text-sm font-bold transition-all ${method === option ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:bg-stone-50'}`}
                >
                  {option === 'email' ? 'Email' : 'Phone'}
                </button>
              ))}
            </div>

            {method === 'email' ? (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleIdentifierSubmit()}
                  disabled={googleLoading}
                  placeholder="you@example.com"
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-4 px-5 font-bold text-gray-900 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all disabled:opacity-40"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Phone number
                </label>
                <div className="flex gap-3">
                  <div className="flex items-center gap-2 px-4 py-4 bg-stone-50 border border-stone-100 rounded-2xl">
                    <NigerianFlagIcon />
                    <span className="font-bold text-gray-800">NG</span>
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleIdentifierSubmit()}
                    disabled={googleLoading}
                    placeholder="800 000 0000"
                    className="flex-1 bg-stone-50 border border-stone-100 rounded-2xl py-4 px-5 font-bold text-gray-900 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all disabled:opacity-40"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleIdentifierSubmit}
              disabled={loading || googleLoading}
              className="w-full bg-[#FFAA14] hover:bg-amber-500 text-white font-black py-5 rounded-2xl transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><Spinner /> Sending OTP…</> : 'Continue →'}
            </button>
        </div>
        
        <div className="flex gap-3 mb-5 mt-5 justify-center">
          <button onClick={() => alert('Apple sign-in coming soon')} className="flex items-center gap-2 px-5 py-3 bg-stone-100 cursor-pointer  font-semibold text-sm text-gray-900 hover:bg-gray-50 transition-all">
            <AppleIcon />
            <span>Apple</span>
          </button>
          <button onClick={() => alert('Facebook sign-in coming soon')} className="flex items-center gap-2 px-5 py-3 bg-stone-100 cursor-pointer  font-semibold text-sm text-gray-900 hover:bg-gray-50 transition-all">
            <FacebookIcon />
            <span>Facebook</span>
          </button>
          <button onClick={handleGoogleClick} disabled={googleLoading} className="flex items-center gap-2 px-5 py-3 bg-stone-100 cursor-pointer  font-semibold text-sm text-gray-900 hover:bg-gray-50 transition-all disabled:opacity-50">
            {googleLoading ? <Spinner /> : <GoogleIcon />}
            <span>{googleLoading ? 'Signing in…' : 'Google'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;