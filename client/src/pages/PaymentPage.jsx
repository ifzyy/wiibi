/**
 * pages/PaymentPage.jsx
 *
 * Receives router state: { orderId, orderNumber, orderTotal, guestEmail }
 * from CheckoutPage after the order is created server-side.
 *
 * Flow:
 *  1. POST /payment/initialize → { authorization_url, reference }
 *  2. Redirect to authorization_url (mock gateway in dev, real Paystack in prod)
 *  3. Provider redirects back to GET /payment/verify/:orderId (backend)
 *  4. Backend redirects to /orders/:orderNumber?payment=success
 *
 * Error path:
 *  Backend redirects to /payment?orderId=xxx&error=message
 *  This page reads ?error and shows a recoverable error card.
 *
 * No-session path:
 *  If the user navigates directly to /payment with no state (e.g. after a
 *  refresh), they see a clear "session expired" card with a link to their orders.
 */

import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, ShieldCheck, AlertCircle, RefreshCw, ArrowLeft, Package } from 'lucide-react';
import { api } from '../utils/api.js';

const fmt = (n) => n > 0 ? '₦' + Number(n).toLocaleString('en-NG') : null;

/* ── Sub-components ──────────────────────────────────────────────────────── */

const Spinner = () => (
  <div style={{
    width: 22, height: 22, borderRadius: '50%',
    border: '2.5px solid rgba(255,170,20,0.25)',
    borderTopColor: '#FFAA14',
    animation: 'spin 0.7s linear infinite',
    flexShrink: 0,
  }} />
);

const AmountCard = ({ orderTotal, orderNumber }) => {
  const formatted = fmt(orderTotal);
  if (!formatted) return null;
  return (
    <div className="bg-[#F9F9F9] rounded-xl px-5 py-4 w-full text-center">
      <p className="text-[10px] text-[#B8A98A] uppercase tracking-widest font-bold mb-1">Amount</p>
      <p className="text-2xl font-black text-[#1A1102]">{formatted}</p>
      {orderNumber && (
        <p className="text-xs text-[#B8A98A] font-mono mt-0.5">{orderNumber}</p>
      )}
    </div>
  );
};

/* ── PaymentPage ─────────────────────────────────────────────────────────── */

const PaymentPage = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [params]  = useSearchParams();

  const {
    orderId:    stateOrderId,
    orderNumber,
    orderTotal,
    guestEmail,
  } = location.state ?? {};

  const redirectError   = params.get('error');
  const redirectOrderId = params.get('orderId') ?? stateOrderId;

  const [phase,    setPhase]    = useState('idle');  // idle | loading | redirecting | error | no-session
  const [errorMsg, setErrorMsg] = useState(null);
  const [retrying, setRetrying] = useState(false);

  // Prevent double-initialize on StrictMode double mount
  const calledRef = useRef(false);

  const initialize = async () => {
    if (!redirectOrderId) {
      setPhase('no-session');
      return;
    }

    setPhase('loading');
    setErrorMsg(null);
    setRetrying(false);

    try {
      const res = await api.post('/payment/initialize', {
        orderId: redirectOrderId,
        email:   guestEmail,
      });
      const { authorization_url } = res.data.data;

      setPhase('redirecting');
      setTimeout(() => { window.location.href = authorization_url; }, 700);

    } catch (err) {
      const status  = err?.response?.status;
      const message = err?.response?.data?.message ?? '';

      if (status === 409) {
        if (orderNumber) {
          window.location.replace('/orders/' + orderNumber + '?payment=success');
        } else {
          setErrorMsg('Your payment was already confirmed. Check your orders.');
          setPhase('error');
        }
        return;
      }

      setErrorMsg(message || 'Could not set up payment. Please try again.');
      setPhase('error');
    }
  };

  const handleRetry = () => {
    setRetrying(true);
    initialize();
  };

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    if (redirectError) {
      setErrorMsg(decodeURIComponent(redirectError));
      setPhase('error');
    } else {
      initialize();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center px-4 py-12">
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      <div className="w-full max-w-sm" style={{ animation: 'fadeUp 0.3s ease' }}>
        <div className="bg-white rounded-2xl border border-[#F1F1F1] p-8">

          {/* ── Loading / redirecting ── */}
          {(phase === 'idle' || phase === 'loading' || phase === 'redirecting') && (
            <div className="flex flex-col items-center text-center gap-6">
              <div className="w-16 h-16 rounded-full bg-[#FFF8E7] flex items-center justify-center">
                <Lock size={26} className="text-[#FFAA14]" />
              </div>

              <div>
                <h1 className="text-xl font-black text-[#1A1102] mb-1.5">
                  {phase === 'redirecting' ? 'Redirecting to checkout…' : 'Preparing payment'}
                </h1>
                <p className="text-sm text-[#B8A98A] leading-relaxed">
                  {phase === 'redirecting'
                    ? 'You\'re being taken to our secure payment page.'
                    : 'Setting up your secure checkout link…'}
                </p>
              </div>

              <AmountCard orderTotal={orderTotal} orderNumber={orderNumber} />
              <Spinner />

              <p className="text-xs text-[#B8A98A] flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-[#FFAA14]" />
                Secured · 256-bit SSL
              </p>
            </div>
          )}

          {/* ── Error ── */}
          {phase === 'error' && (
            <div className="flex flex-col items-center text-center gap-5">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle size={26} className="text-red-400" />
              </div>

              <div>
                <h1 className="text-xl font-black text-[#1A1102] mb-1.5">Payment Unsuccessful</h1>
                <p className="text-sm text-[#B8A98A] leading-relaxed">{errorMsg}</p>
              </div>

              <AmountCard orderTotal={orderTotal} orderNumber={orderNumber} />

              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={handleRetry}
                  disabled={retrying}
                  className="w-full py-3.5 rounded-xl bg-[#FFAA14] text-[#1A1102] font-black text-sm flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors disabled:opacity-60"
                >
                  {retrying
                    ? <><Spinner /> Retrying…</>
                    : <><RefreshCw size={14} /> Try Again</>}
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="w-full py-3 rounded-xl bg-[#F9F9F9] text-[#6B6040] font-bold text-sm flex items-center justify-center gap-2 border border-[#F1F1F1] hover:bg-[#F1F1F1] transition-colors"
                >
                  <ArrowLeft size={14} /> Go Back
                </button>
              </div>

              <p className="text-xs text-[#B8A98A]">
                Your order is saved. You have <strong>not</strong> been charged.
              </p>
            </div>
          )}

          {/* ── No session (page refreshed / navigated directly) ── */}
          {phase === 'no-session' && (
            <div className="flex flex-col items-center text-center gap-5">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
                <Package size={26} className="text-[#FFAA14]" />
              </div>

              <div>
                <h1 className="text-xl font-black text-[#1A1102] mb-1.5">Session Expired</h1>
                <p className="text-sm text-[#B8A98A] leading-relaxed">
                  We couldn't find your order details. This can happen if you refreshed
                  the page mid-checkout.
                </p>
              </div>

              <div className="flex flex-col gap-3 w-full">
                <Link
                  to="/orders"
                  className="w-full py-3.5 rounded-xl bg-[#FFAA14] text-[#1A1102] font-black text-sm flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors"
                >
                  View My Orders
                </Link>
                <button
                  onClick={() => navigate('/cart')}
                  className="w-full py-3 rounded-xl bg-[#F9F9F9] text-[#6B6040] font-bold text-sm flex items-center justify-center gap-2 border border-[#F1F1F1] hover:bg-[#F1F1F1] transition-colors"
                >
                  <ArrowLeft size={14} /> Back to Cart
                </button>
              </div>

              <p className="text-xs text-[#B8A98A]">
                If you placed an order, it's safe — check your orders above.
              </p>
            </div>
          )}

        </div>

        <p className="text-center text-xs text-[#B8A98A] mt-5 flex items-center justify-center gap-1.5">
          <ShieldCheck size={11} className="text-[#FFAA14]" />
          Payment details are never stored on our servers
        </p>
      </div>
    </div>
  );
};

export default PaymentPage;
