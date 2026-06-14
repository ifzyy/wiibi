/**
 * FloatingSupport.jsx
 *
 * Site-wide floating "Contact support" launcher (bottom-right). Opens a compact
 * panel that creates a support ticket via POST /support/tickets — the same
 * backend the Support page and admin Support Desk use.
 *
 * UX goals:
 *  - Logged-in users: name/email are taken from their account automatically, and
 *    if the issue is about an order they pick it from a list (no typing order
 *    numbers). The picked order is attached via orderId so the admin sees it.
 *  - Guests: a lightweight form (name/email + optional order number).
 *  - On success, logged-in users jump straight into the ticket thread.
 *
 * Rendered once inside PublicLayout, so it appears on every public page but
 * never in the admin dashboard.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LifeBuoy, X, ChevronLeft, ChevronRight, Package, MessageSquare,
  AlertCircle, CheckCircle, Loader2, ShoppingBag,
} from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext.jsx';

const TYPE_OPTIONS = [
  { value: 'inquiry',        label: 'General question' },
  { value: 'request',        label: 'Order help'       },
  { value: 'refund_request', label: 'Return / refund'  },
  { value: 'complaint',      label: 'Complaint'         },
  { value: 'technical',      label: 'Technical issue'   },
  { value: 'other',          label: 'Other'             },
];

const fmtMoney = (n) => '₦' + Number(n ?? 0).toLocaleString('en-NG');
const fmtDate  = (iso) => !iso ? '' : new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

const inputCls =
  'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-[#FFAA14] transition-colors';

export default function FloatingSupport() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  const [open, setOpen]   = useState(false);
  const [view, setView]   = useState('menu');   // menu | order | form | done
  const [orders, setOrders]           = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder]  = useState(null);

  const [form, setForm] = useState({
    type: 'inquiry', subject: '', body: '',
    name: '', email: '', phone: '', orderNumber: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]   = useState(null);
  const [done,  setDone]    = useState(null);   // { ticketNumber }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Reset everything when the panel closes
  const close = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      setView('menu'); setSelectedOrder(null); setError(null); setDone(null);
      setForm({ type: 'inquiry', subject: '', body: '', name: '', email: '', phone: '', orderNumber: '' });
    }, 250);
  }, []);

  // Esc closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  // Lazy-load the user's orders when they choose "about an order"
  const goToOrders = () => {
    setError(null);
    if (isLoggedIn) {
      setView('order');
      if (orders.length === 0) {
        setOrdersLoading(true);
        api.get('/orders/my')
          .then((r) => setOrders(r.data?.data ?? r.data ?? []))
          .catch(() => setOrders([]))
          .finally(() => setOrdersLoading(false));
      }
    } else {
      // Guests type the order number on the form
      setForm((f) => ({ ...f, type: 'request' }));
      setView('form');
    }
  };

  const pickOrder = (order) => {
    setSelectedOrder(order);
    setForm((f) => ({
      ...f,
      type:    'request',
      subject: f.subject || `Help with order ${order.orderNumber}`,
    }));
    setView('form');
  };

  const startGeneral = (type) => {
    setSelectedOrder(null);
    setForm((f) => ({ ...f, type }));
    setView('form');
  };

  const submit = async (e) => {
    e?.preventDefault?.();
    setError(null);

    const email = (isLoggedIn ? user?.email : form.email)?.trim();
    const name  = isLoggedIn
      ? [user?.firstName, user?.lastName].filter(Boolean).join(' ')
      : form.name.trim();

    if (!email)                       return setError('Please enter your email address.');
    if (form.subject.trim().length < 3) return setError('Please add a short subject.');
    if (form.body.trim().length < 10)   return setError('Please describe your issue (at least 10 characters).');

    setSubmitting(true);
    try {
      // Guests can't attach an order by id; fold any typed order number into the body.
      const orderNumberLine = !selectedOrder && form.orderNumber.trim()
        ? `\n\nOrder number: ${form.orderNumber.trim()}`
        : '';

      const { data } = await api.post('/support/tickets', {
        requesterEmail: email,
        requesterName:  name || null,
        requesterPhone: (isLoggedIn ? user?.phoneNumber : form.phone)?.trim() || null,
        orderId:        selectedOrder?.id ?? null,
        type:           form.type,
        subject:        form.subject.trim(),
        body:           form.body.trim() + orderNumberLine,
      });
      setDone(data?.data ?? data);
      setView('done');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const firstName = user?.firstName;

  return (
    <>
      {/* ── Launcher button ─────────────────────────────────────────────── */}
      <button
        onClick={() => (open ? close() : setOpen(true))}
        aria-label={open ? 'Close support' : 'Contact support'}
        className="fixed bottom-5 right-5 z-[60] w-14 h-14 rounded-full bg-[#FFAA14] text-white shadow-lg shadow-amber-300/50 flex items-center justify-center hover:bg-[#e69912] hover:scale-105 active:scale-95 transition-all"
      >
        {open ? <X size={24} /> : <LifeBuoy size={24} />}
      </button>

      {/* ── Panel ───────────────────────────────────────────────────────── */}
      {open && (
        <div
          role="dialog"
          aria-label="Support"
          className="fixed bottom-24 right-5 z-[60] w-[min(360px,calc(100vw-2.5rem))] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          style={{ maxHeight: 'min(560px, calc(100vh - 8rem))', animation: 'fsUp 0.2s ease' }}
        >
          <style>{`@keyframes fsUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

          {/* Header */}
          <div className="bg-[#1A1102] px-5 py-4 text-white shrink-0">
            <div className="flex items-center gap-2">
              {view !== 'menu' && view !== 'done' && (
                <button onClick={() => setView(view === 'form' && selectedOrder ? 'order' : 'menu')} className="text-white/70 hover:text-white -ml-1">
                  <ChevronLeft size={18} />
                </button>
              )}
              <div className="flex-1">
                <p className="font-bold text-[15px] leading-tight">
                  {view === 'done' ? 'Request sent ✓' : 'How can we help?'}
                </p>
                <p className="text-[12px] text-white/60 mt-0.5">
                  {isLoggedIn && firstName ? `Hi ${firstName} — we usually reply within 24h` : 'We usually reply within 24 hours'}
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4">

            {/* ── Menu ── */}
            {view === 'menu' && (
              <div className="space-y-2.5">
                <MenuItem icon={Package}       title="Help with an order"  desc="Delivery, returns, refunds" onClick={goToOrders} />
                <MenuItem icon={MessageSquare} title="General question"    desc="Products, advice, anything" onClick={() => startGeneral('inquiry')} />
                <MenuItem icon={AlertCircle}   title="Report a problem"    desc="Something isn't working"    onClick={() => startGeneral('complaint')} />

                {isLoggedIn && (
                  <button
                    onClick={() => { close(); navigate('/account/support'); }}
                    className="w-full mt-1 text-center text-[13px] font-semibold text-[#FFAA14] hover:underline py-2"
                  >
                    View my existing requests →
                  </button>
                )}
              </div>
            )}

            {/* ── Order picker (logged in) ── */}
            {view === 'order' && (
              <div>
                <p className="text-[13px] font-semibold text-gray-700 mb-3">Which order is this about?</p>

                {ordersLoading && (
                  <div className="flex items-center justify-center py-10 text-gray-400">
                    <Loader2 size={18} className="animate-spin mr-2" /> Loading your orders…
                  </div>
                )}

                {!ordersLoading && orders.length === 0 && (
                  <div className="text-center py-8">
                    <ShoppingBag size={28} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-4">No orders found on your account.</p>
                    <button onClick={() => startGeneral('inquiry')} className="text-[13px] font-bold text-[#FFAA14] hover:underline">
                      Ask a general question instead →
                    </button>
                  </div>
                )}

                {!ordersLoading && orders.length > 0 && (
                  <div className="space-y-2">
                    {orders.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => pickOrder(o)}
                        className="w-full text-left border border-gray-100 rounded-xl p-3 hover:border-[#FFAA14] hover:bg-amber-50/40 transition-all flex items-center gap-3"
                      >
                        <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                          <Package size={16} className="text-[#FFAA14]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-[#1A1102] truncate">{o.orderNumber}</p>
                          <p className="text-[11px] text-gray-400 capitalize">{o.status} · {fmtDate(o.createdAt)} · {fmtMoney(o.totalAmount)}</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 shrink-0" />
                      </button>
                    ))}
                    <button onClick={() => startGeneral('request')} className="w-full text-center text-[12px] font-semibold text-gray-400 hover:text-gray-600 py-2">
                      It's not about a specific order
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Form ── */}
            {view === 'form' && (
              <form onSubmit={submit} className="space-y-3">
                {/* Attached order chip */}
                {selectedOrder && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                    <Package size={14} className="text-[#FFAA14] shrink-0" />
                    <span className="text-[12px] font-semibold text-[#1A1102]">Order {selectedOrder.orderNumber}</span>
                    <button type="button" onClick={() => { setSelectedOrder(null); }} className="ml-auto text-gray-400 hover:text-gray-600">
                      <X size={13} />
                    </button>
                  </div>
                )}

                {/* Guest identity fields */}
                {!isLoggedIn && (
                  <>
                    <input className={inputCls} placeholder="Your name (optional)" value={form.name} onChange={set('name')} autoComplete="name" />
                    <input className={inputCls} type="email" placeholder="Email address *" value={form.email} onChange={set('email')} autoComplete="email" required />
                    {!selectedOrder && (
                      <input className={inputCls} placeholder="Order number (if about an order)" value={form.orderNumber} onChange={set('orderNumber')} />
                    )}
                  </>
                )}

                {/* Type */}
                <select className={`${inputCls} appearance-none cursor-pointer`} value={form.type} onChange={set('type')}>
                  {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>

                <input className={inputCls} placeholder="Subject *" value={form.subject} onChange={set('subject')} maxLength={300} required />

                <textarea
                  className={`${inputCls} resize-y leading-relaxed`}
                  placeholder="Describe your issue…"
                  rows={4} maxLength={5000}
                  value={form.body} onChange={set('body')} required
                />

                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    <AlertCircle size={14} className="text-red-400 shrink-0" />
                    <p className="text-[12px] text-red-500 font-medium">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                    submitting ? 'bg-[#FFD699] text-white cursor-not-allowed' : 'bg-[#FFAA14] text-white hover:bg-[#e69912]'
                  }`}
                >
                  {submitting ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : 'Send message'}
                </button>
              </form>
            )}

            {/* ── Done ── */}
            {view === 'done' && (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={28} className="text-green-500" />
                </div>
                <p className="text-sm font-bold text-[#1A1102] mb-1">We've got your message</p>
                <p className="text-[13px] text-gray-500 leading-relaxed mb-3">
                  Our team will reply by email{isLoggedIn ? ' and in your support inbox' : ''}.
                </p>
                {done?.ticketNumber && (
                  <p className="text-[12px] text-gray-400 mb-5">
                    Ticket <span className="font-mono font-bold text-gray-600">{done.ticketNumber}</span>
                  </p>
                )}
                {isLoggedIn && done?.ticketNumber ? (
                  <button
                    onClick={() => { close(); navigate(`/account/support/${done.ticketNumber}`); }}
                    className="w-full py-3 rounded-xl bg-[#FFAA14] text-white font-black text-sm hover:bg-[#e69912] transition-colors"
                  >
                    View conversation
                  </button>
                ) : (
                  <button onClick={close} className="w-full py-3 rounded-xl bg-[#1A1102] text-white font-black text-sm">
                    Done
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ── Menu item ─────────────────────────────────────────────────────────── */
const MenuItem = ({ icon: Icon, title, desc, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left border border-gray-100 rounded-xl p-3.5 hover:border-[#FFAA14] hover:bg-amber-50/40 transition-all flex items-center gap-3 group"
  >
    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
      <Icon size={18} className="text-[#FFAA14]" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-[#1A1102]">{title}</p>
      <p className="text-[12px] text-gray-400">{desc}</p>
    </div>
    <ChevronRight size={16} className="text-gray-300 shrink-0" />
  </button>
);
