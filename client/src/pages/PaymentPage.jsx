/**
 * pages/PaymentPage.jsx
 *
 * Receives router state: { orderId, orderNumber, orderTotal, guestEmail }
 * from CheckoutPage after the order is created server-side.
 *
 * Flow:
 *  1. POST /payment/initialize → { authorization_url, reference }
 *  2. Redirect to authorization_url (mock gateway in dev, real Paystack in prod)
 *  3. Paystack redirects back to GET /payment/verify/:orderId (backend)
 *  4. Backend redirects to /orders/:orderNumber?payment=success
 *
 * Error path:
 *  Backend redirects to /payment?orderId=xxx&error=message
 *  This page reads ?error and shows Try Again / Go Back
 */

import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ShieldCheck, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { api } from '../utils/api.js';

const fmt = (n) => '₦' + (n ?? 0).toLocaleString('en-NG');

const Spinner = () => (
  <div style={{
    width: 22, height: 22, borderRadius: '50%',
    border: '2.5px solid rgba(255,170,20,0.25)',
    borderTopColor: '#FFAA14',
    animation: 'spin 0.7s linear infinite',
    flexShrink: 0,
  }} />
);

const PaymentPage = () => {
  const location        = useLocation();
  const navigate        = useNavigate();
  const [params]        = useSearchParams();

  // Passed from CheckoutPage via router state
  const {
    orderId: stateOrderId,
    orderNumber,
    orderTotal,
    guestEmail,       // always passed from CheckoutPage — the email the user typed
  } = location.state ?? {};

  // Error case: backend redirects here with ?error=... after failed verification
  const redirectError   = params.get('error');
  const redirectOrderId = params.get('orderId') ?? stateOrderId;

  const [phase,    setPhase]    = useState('loading'); // loading | redirecting | error
  const [errorMsg, setErrorMsg] = useState(null);

  const initialize = async () => {
    if (!redirectOrderId) {
      setErrorMsg('No order found. Please go back and try again.');
      setPhase('error');
      return;
    }

    setPhase('loading');
    setErrorMsg(null);

    try {
      // Send guestEmail alongside orderId so the backend has the email
      // even for orders that were created before this fix (guest_email = NULL in DB).
      // paymentController uses order.guestEmail first, then falls back to req.body.email.
      const res = await api.post('/payment/initialize', {
        orderId: redirectOrderId,
        email:   guestEmail,   // ← THE FIX: always send the email from checkout state
      });
      const { authorization_url } = res.data.data;

      setPhase('redirecting');
      setTimeout(() => { window.location.href = authorization_url; }, 700);

    } catch (err) {
      const status  = err?.response?.status;
      const message = err?.response?.data?.message ?? '';

      // 409 = already paid (webhook confirmed while user was on gateway page).
      // Instead of showing an error, redirect straight to the order success page.
      if (status === 409 && orderNumber) {
        window.location.replace('/orders/' + orderNumber + '?payment=success');
        return;
      }

      if (status === 409) {
        setErrorMsg('Your payment was already confirmed. Check your orders.');
        setPhase('error');
        return;
      }

      setErrorMsg(message || 'Could not set up payment. Please try again.');
      setPhase('error');
    }
  };

  useEffect(() => {
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
          {(phase === 'loading' || phase === 'redirecting') && (
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

              {orderTotal && (
                <div className="bg-[#F9F9F9] rounded-xl px-5 py-4 w-full text-center">
                  <p className="text-[10px] text-[#B8A98A] uppercase tracking-widest font-bold mb-1">Amount</p>
                  <p className="text-2xl font-black text-[#1A1102]">{fmt(orderTotal)}</p>
                  {orderNumber && (
                    <p className="text-xs text-[#B8A98A] font-mono mt-0.5">{orderNumber}</p>
                  )}
                </div>
              )}

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

              {orderTotal && (
                <div className="bg-[#F9F9F9] rounded-xl px-5 py-4 w-full text-center">
                  <p className="text-[10px] text-[#B8A98A] uppercase tracking-widest font-bold mb-1">Order</p>
                  <p className="text-xl font-black text-[#1A1102]">{fmt(orderTotal)}</p>
                  {orderNumber && <p className="text-xs text-[#B8A98A] font-mono mt-0.5">{orderNumber}</p>}
                </div>
              )}

              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={initialize}
                  className="w-full py-3.5 rounded-xl bg-[#FFAA14] text-[#1A1102] font-black text-sm flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors"
                >
                  <RefreshCw size={14} /> Try Again
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="w-full py-3 rounded-xl bg-[#F9F9F9] text-[#6B6040] font-bold text-sm flex items-center justify-center gap-2 border border-[#F1F1F1] hover:bg-[#F1F1F1] transition-colors"
                >
                  <ArrowLeft size={14} /> Go Back
                </button>
              </div>

              <p className="text-xs text-[#B8A98A]">Your order is saved. You have not been charged.</p>
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