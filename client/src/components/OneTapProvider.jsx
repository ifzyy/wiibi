/**
 * components/OneTapProvider.jsx
 *
 * Mounts One Tap globally — fires automatically on every page load
 * for any logged-out user. Requires no user interaction.
 *
 * Usage in App.jsx:
 *   <OneTapProvider />   ← place inside <GoogleOAuthProvider> and <AuthProvider>
 *
 * When the user taps the Google card:
 *   → loginWithGoogle(credential) is called
 *   → State updates, isLoggedIn becomes true
 *   → A brief toast appears ("Welcome back, Name!")
 *   → App re-renders with the logged-in state
 *
 * One Tap will NOT show if:
 *   - User is already logged in (isLoggedIn check)
 *   - User is in incognito / third-party cookies blocked
 *   - User has dismissed it 3+ times (Google suppresses it for a cooldown)
 *   - The domain isn't registered in Google Cloud Console
 */

import { useEffect } from 'react';
import { useGoogleOneTapLogin } from '@react-oauth/google';
import { useAuth }              from '../context/AuthContext.jsx';
import { useCart }              from '../context/CartContext.jsx';

// Simple toast — swap with your own toast library (react-hot-toast, sonner, etc.)
const showWelcomeToast = (name) => {
  const el = document.createElement('div');
  el.textContent = `👋 Welcome${name ? ', ' + name.split(' ')[0] : ''}!`;
  el.style.cssText = `
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: #1a1a1a; color: #fff; padding: 12px 24px;
    border-radius: 100px; font-weight: 700; font-size: 14px;
    z-index: 9999; box-shadow: 0 8px 32px rgba(0,0,0,0.24);
    animation: fadeInUp 0.3s ease;
  `;
  document.head.insertAdjacentHTML('beforeend', `
    <style>
      @keyframes fadeInUp {
        from { opacity: 0; transform: translate(-50%, 12px); }
        to   { opacity: 1; transform: translate(-50%, 0); }
      }
    </style>
  `);
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
};

const OneTapProvider = () => {
  const { isLoggedIn, loading, loginWithGoogle } = useAuth();
  const { fetchCart }                            = useCart();

  useEffect(() => {
    if (isLoggedIn && window.google?.accounts?.id?.cancel) {
      window.google.accounts.id.cancel();
    }
  }, [isLoggedIn]);

  useGoogleOneTapLogin({
    // Don't show while session is still being restored, or if already logged in
    disabled: loading || isLoggedIn,

    onSuccess: async (res) => {
      try {
        const user = await loginWithGoogle(res.credential); // id_token path
        await fetchCart();
        showWelcomeToast(user?.name || user?.firstName);
      } catch {
        // Silent failure — user can always log in manually
      }
    },

    // If One Tap isn't available (incognito, cookies blocked, etc.)
    // we just do nothing — the modal's redirect fallback handles it
    onError: () => {},

    cancel_on_tap_outside: false,
    // prompt_parent_id: 'one-tap-container', // optional: anchor to a specific element
  });

  return null; // renders nothing — One Tap injects its own DOM
};

export default OneTapProvider;