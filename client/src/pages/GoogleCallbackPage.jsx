/**
 * pages/GoogleCallbackPage.jsx
 *
 * Handles the mobile redirect fallback only.
 * Reads ?code= from the URL and calls loginWithGoogle(code, REDIRECT_URI).
 *
 * Register in React Router:
 *   <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
 */

import { useEffect, useState } from 'react';
import { useNavigate }         from 'react-router-dom';
import { useAuth }             from '../context/AuthContext.jsx';
import { useCart }             from '../context/CartContext.jsx';

const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;

const GoogleCallbackPage = () => {
  const { loginWithGoogle } = useAuth();
  const { fetchCart }       = useCart();
  const navigate            = useNavigate();
  const [error, setError]   = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code   = params.get('code');
    const state  = params.get('state');

    if (!code) { setError('No authorization code received.'); return; }

    const finish = async () => {
      try {
        await loginWithGoogle(code, REDIRECT_URI); // auth-code path
        await fetchCart();
        navigate(state ? decodeURIComponent(state) : '/', { replace: true });
      } catch (err) {
        setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
      }
    };

    finish();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-red-600 font-bold mb-4">{error}</p>
          <button onClick={() => navigate('/')} className="text-sm text-[#FFAA14] font-bold">
            Go back home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <span className="w-8 h-8 border-4 border-stone-200 border-t-[#FFAA14] rounded-full animate-spin" />
        <p className="text-sm font-bold text-gray-500">Signing you in…</p>
      </div>
    </div>
  );
};

export default GoogleCallbackPage;