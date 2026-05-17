

// ─────────────────────────────────────────────────────────────────────────────
// components/ProtectedRoute.jsx
//
// allowGuest={true}  → guests see the page; only logged-in check is skipped.
//                      Used for /checkout and /payment where guests are valid.
// allowGuest={false} → default. Shows lock screen + auth modal if not logged in.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import AuthModal from '../Auth/AuthModal.jsx';

export const ProtectedRoute = ({ children, allowGuest = false }) => {
  const { isLoggedIn, loading } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [authView,  setAuthView]  = useState('login');

  useEffect(() => {
    // Only auto-open the modal when auth is definitely required
    if (!loading && !isLoggedIn && !allowGuest) setModalOpen(true);
  }, [loading, isLoggedIn, allowGuest]);

  // Auth check in flight — show spinner
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-[#FFAA14] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Guest is allowed on this route (checkout, payment)
  if (allowGuest) return children;

  // Auth required and user is not logged in — show lock gate + modal
  if (!isLoggedIn) {
    return (
      <>
        <div className="min-h-[60vh] flex items-center justify-center select-none" aria-hidden="true">
          <div className="text-center px-6">
            <p className="text-5xl mb-5">🔒</p>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Sign in to continue</h2>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">
              Please log in or create a free account to access this page.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-6 bg-[#FFAA14] text-white font-black px-8 py-3.5 rounded-2xl hover:bg-amber-500 transition-all text-sm"
            >
              Sign In →
            </button>
          </div>
        </div>

        <AuthModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          view={authView}
          setView={setAuthView}
        />
      </>
    );
  }

  return children;
};

export default ProtectedRoute;