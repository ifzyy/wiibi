import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, MapPin, Package, Pencil, CheckCircle2,
  CreditCard, Truck, Tag, ShieldCheck,
} from 'lucide-react';
import api from '../utils/api.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const genKey = () =>
  ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  );

const cls = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all';

const Field = ({ label, error, children }) => (
  <div>
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">{label}</label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const Card = ({ icon: Icon, title, step, children, action }) => (
  <section className="border border-gray-100 rounded-2xl p-5 sm:p-6 bg-white">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        {step != null && (
          <span className="w-6 h-6 rounded-full bg-[#1A1102] text-white text-[11px] font-black flex items-center justify-center">{step}</span>
        )}
        <Icon size={16} className="text-[#FFAA14]" />
        <h2 className="font-black text-gray-900">{title}</h2>
      </div>
      {action}
    </div>
    {children}
  </section>
);

const CheckoutPage = () => {
  const navigate            = useNavigate();
  const { cart, clearCart } = useCart();
  const { user }            = useAuth();
  const keyRef              = useRef(genKey());

  const isGuest = !user;
  const saved   = user?.shippingAddress || {};
  const hasSaved = !!saved.addressLine1;

  const [form, setForm] = useState({
    fullName:     user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
    email:        user?.email || '',
    addressLine1: saved.addressLine1 || '',
    addressLine2: saved.addressLine2 || '',
    city:         saved.city || '',
    state:        saved.state || '',
    postalCode:   saved.postalCode || '',
    country:      saved.country || 'NG',
    phone:        saved.phone || user?.phoneNumber || '',
  });

  // Collapse the address form when the user already has a saved address.
  const [editingAddr, setEditingAddr] = useState(!hasSaved);
  const [saveAddr,    setSaveAddr]    = useState(true);

  const [errors,    setErrors]    = useState({});
  const [loading,   setLoading]   = useState(false);
  const [apiError,  setApiError]  = useState('');
  const [deliveryFee, setDeliveryFee] = useState(null);
  const [payMethod, setPayMethod] = useState('online');   // online | on_delivery

  // Promo
  const [promoInput,   setPromoInput]   = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError,   setPromoError]   = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  useEffect(() => {
    api.get('/public/settings')
      .then((res) => setDeliveryFee(Number(res.data?.delivery_fee) || 0))
      .catch(() => setDeliveryFee(0));
  }, []);

  // A promo discount must be paid online — never leave COD selected with a code.
  useEffect(() => {
    if (appliedPromo && payMethod === 'on_delivery') setPayMethod('online');
  }, [appliedPromo, payMethod]);

  const set = (f) => (e) => setForm((v) => ({ ...v, [f]: e.target.value }));

  const applyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    const sub = (cart.items || []).reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0);
    setPromoLoading(true); setPromoError('');
    try {
      const res = await api.post('/promo/validate', { code, subtotal: sub });
      const data = res.data?.data ?? res.data;
      setAppliedPromo({ code: data.code, discount: Number(data.discount), description: data.description });
    } catch (err) {
      setAppliedPromo(null);
      setPromoError(err.response?.data?.message || 'Invalid promo code.');
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => { setAppliedPromo(null); setPromoInput(''); setPromoError(''); };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim())     e.fullName     = 'Required';
    if (!form.email.trim())        e.email        = 'Required for payment';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email address';
    if (!form.addressLine1.trim()) e.addressLine1 = 'Required';
    if (!form.city.trim())         e.city         = 'Required';
    if (!form.state.trim())        e.state        = 'Required';
    if (!form.postalCode.trim())   e.postalCode   = 'Required';
    if (!form.phone.trim())        e.phone        = 'Required';
    setErrors(e);
    // If validation fails, make sure the form is visible to fix it.
    if (Object.keys(e).length) setEditingAddr(true);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || (cart.items?.length ?? 0) === 0) return;
    setLoading(true);
    setApiError('');

    try {
      const guestToken = isGuest ? localStorage.getItem('guestToken') : null;
      const address = {
        fullName:     form.fullName,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2 || null,
        city:         form.city,
        state:        form.state,
        postalCode:   form.postalCode,
        country:      form.country,
        phone:        form.phone,
      };

      const payload = {
        shippingAddress: address,
        currency:        'NGN',
        idempotencyKey:  keyRef.current,
        guestEmail:      form.email.trim(),
        paymentMethod:   payMethod,
        ...(isGuest && guestToken ? { guestToken } : {}),
        ...(appliedPromo?.code ? { promoCode: appliedPromo.code } : {}),
      };

      const res   = await api.post('/orders/checkout', payload);
      const order = res.data.data;

      // Save the address to the profile for next time (logged-in users only).
      if (user && saveAddr) {
        try {
          await api.patch('/users/me', {
            shippingAddress: {
              addressLine1: address.addressLine1,
              addressLine2: address.addressLine2,
              city:         address.city,
              state:        address.state,
              postalCode:   address.postalCode,
              country:      address.country,
              phone:        address.phone,
            },
          });
        } catch { /* non-fatal — order already placed */ }
      }

      clearCart();

      if (payMethod === 'on_delivery') {
        // Confirmed immediately — straight to the order page.
        navigate(`/orders/${order.orderNumber}?placed=cod`);
      } else {
        navigate('/payment', {
          state: {
            orderId:     order.id,
            orderNumber: order.orderNumber,
            orderTotal:  order.totalAmount ?? total,
            guestEmail:  form.email.trim(),
          },
        });
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Checkout failed. Please try again.');
      keyRef.current = genKey();
    } finally {
      setLoading(false);
    }
  };

  const items    = cart.items || [];
  const subtotal = items.reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0);
  const productFees  = items.map((i) => parseFloat(i.product?.delivery_fee)).filter((f) => Number.isFinite(f) && f >= 0);
  const effectiveFee = productFees.length ? Math.max(...productFees) : (deliveryFee ?? 0);
  const feePart  = (deliveryFee === null && !productFees.length ? 0 : effectiveFee);
  const discount = Math.min(appliedPromo?.discount ?? 0, subtotal);
  const total    = Math.max(0, subtotal + feePart - discount);

  const PayOption = ({ value, icon: Icon, title, desc, disabled, hint }) => {
    const active = payMethod === value;
    return (
      <button
        type="button"
        onClick={() => !disabled && setPayMethod(value)}
        disabled={disabled}
        className={`w-full text-left rounded-xl border p-4 transition-all flex items-start gap-3 ${
          disabled ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
          : active ? 'border-[#FFAA14] bg-amber-50/50 ring-2 ring-amber-400/20'
          : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <span className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${active ? 'border-[#FFAA14]' : 'border-gray-300'}`}>
          {active && <span className="w-2 h-2 rounded-full bg-[#FFAA14]" />}
        </span>
        <Icon size={18} className={active ? 'text-[#FFAA14]' : 'text-gray-400'} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
          {disabled && hint && <p className="text-[11px] text-amber-600 font-semibold mt-1">{hint}</p>}
        </div>
      </button>
    );
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        <button onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-900 text-sm font-medium mb-7 transition-colors">
          <ChevronLeft size={16} /> Back to Cart
        </button>

        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">

          {/* ── Left: steps ── */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {isGuest && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                <span className="mt-0.5 shrink-0">👤</span>
                <span>
                  You're checking out as a guest.{' '}
                  <button type="button" onClick={() => navigate('/login', { state: { returnTo: '/checkout' } })}
                    className="underline font-semibold hover:text-amber-900 transition-colors">Sign in</button>{' '}
                  to save your details and order history.
                </span>
              </div>
            )}

            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">{apiError}</div>
            )}

            {/* Step 1 — Shipping */}
            <Card
              icon={MapPin}
              title="Delivery details"
              step={1}
              action={
                hasSaved && !editingAddr ? (
                  <button type="button" onClick={() => setEditingAddr(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#FFAA14] hover:text-amber-600">
                    <Pencil size={13} /> Use a different address
                  </button>
                ) : hasSaved && editingAddr ? (
                  <button type="button" onClick={() => setEditingAddr(false)}
                    className="text-xs font-bold text-gray-400 hover:text-gray-600">Cancel</button>
                ) : null
              }
            >
              {/* Saved address summary */}
              {hasSaved && !editingAddr ? (
                <div className="flex items-start gap-3 rounded-xl border border-[#FFAA14] bg-amber-50/40 p-4">
                  <CheckCircle2 size={18} className="text-[#FFAA14] shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700 leading-relaxed">
                    <p className="font-bold text-gray-900">{form.fullName || 'Saved address'}</p>
                    <p>{form.addressLine1}{form.addressLine2 ? `, ${form.addressLine2}` : ''}</p>
                    <p>{form.city}, {form.state} · {form.country}</p>
                    {form.phone && <p className="text-gray-500">{form.phone}</p>}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Field label="Full Name" error={errors.fullName}>
                    <input className={cls} value={form.fullName} onChange={set('fullName')} placeholder="Adebayo Johnson" autoComplete="name" />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Email Address" error={errors.email}>
                      <input className={cls} type="email" value={form.email} onChange={set('email')} placeholder="adebayo@example.com" autoComplete="email" />
                    </Field>
                    <Field label="Phone Number" error={errors.phone}>
                      <input className={cls} value={form.phone} onChange={set('phone')} placeholder="+2348012345678" autoComplete="tel" />
                    </Field>
                  </div>
                  <Field label="Address Line 1" error={errors.addressLine1}>
                    <input className={cls} value={form.addressLine1} onChange={set('addressLine1')} placeholder="5, Bode Thomas Street" autoComplete="address-line1" />
                  </Field>
                  <Field label="Address Line 2 (optional)">
                    <input className={cls} value={form.addressLine2} onChange={set('addressLine2')} placeholder="Flat / Suite / Floor" autoComplete="address-line2" />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="City" error={errors.city}>
                      <input className={cls} value={form.city} onChange={set('city')} placeholder="Lagos" autoComplete="address-level2" />
                    </Field>
                    <Field label="State" error={errors.state}>
                      <input className={cls} value={form.state} onChange={set('state')} placeholder="Lagos" autoComplete="address-level1" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Postal Code" error={errors.postalCode}>
                      <input className={cls} value={form.postalCode} onChange={set('postalCode')} placeholder="100001" autoComplete="postal-code" />
                    </Field>
                    <Field label="Country">
                      <select className={cls} value={form.country} onChange={set('country')} autoComplete="country">
                        <option value="NG">Nigeria</option>
                        <option value="GH">Ghana</option>
                        <option value="KE">Kenya</option>
                      </select>
                    </Field>
                  </div>
                  {!isGuest && (
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                      <input type="checkbox" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} className="accent-[#FFAA14]" />
                      Save this address for next time
                    </label>
                  )}
                  {!isGuest && !user?.email && (
                    <p className="text-xs text-amber-600">Your account has no email on file — please enter one for order updates and payment.</p>
                  )}
                </div>
              )}
            </Card>

            {/* Step 2 — Payment method */}
            <Card icon={CreditCard} title="Payment method" step={2}>
              <div className="space-y-3">
                <PayOption value="online" icon={CreditCard}
                  title="Pay online" desc="Card, bank transfer or USSD — secured by Paystack." />
                <PayOption value="on_delivery" icon={Truck}
                  title="Pay on delivery" desc="Pay our delivery agent when your order arrives."
                  disabled={!!appliedPromo}
                  hint="Online payment is required to use a promo code." />
              </div>
            </Card>

            {/* Desktop submit */}
            <button type="submit" disabled={loading || items.length === 0}
              className="hidden lg:flex w-full bg-[#FFAA14] hover:bg-amber-500 active:scale-[0.98] text-white font-black py-4 rounded-2xl transition-all disabled:opacity-50 items-center justify-center gap-2 text-sm">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Placing order…</>
                : payMethod === 'on_delivery' ? 'Place Order' : 'Continue to Payment →'}
            </button>
          </form>

          {/* ── Right: order summary ── */}
          <div>
            <div className="bg-gray-50 rounded-2xl p-5 lg:sticky lg:top-6">
              <div className="flex items-center gap-2 mb-5">
                <Package size={15} className="text-[#FFAA14]" />
                <h2 className="font-black text-gray-900">Order Summary</h2>
              </div>

              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 items-start">
                    <div className="w-11 h-11 bg-white rounded-lg overflow-hidden border border-gray-100 shrink-0 flex items-center justify-center">
                      {item.product?.featured_image_url && (
                        <img src={item.product.featured_image_url} alt={item.product?.name} className="w-full h-full object-contain mix-blend-multiply" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{item.product?.name || item.productName}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-xs font-black text-gray-900 shrink-0">₦{(Number(item.unitPrice) * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              {/* Promo */}
              <div className="border-t border-gray-200 pt-3 mb-3">
                {appliedPromo ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                    <div className="min-w-0 flex items-center gap-2">
                      <Tag size={13} className="text-green-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-black text-green-700 uppercase tracking-wide truncate">{appliedPromo.code}</p>
                        <p className="text-[10px] text-green-600">{appliedPromo.description || 'Discount applied'}</p>
                      </div>
                    </div>
                    <button type="button" onClick={removePromo} className="text-[11px] font-bold text-gray-400 hover:text-red-500 shrink-0 ml-2">Remove</button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input value={promoInput}
                        onChange={(e) => { setPromoInput(e.target.value); setPromoError(''); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyPromo(); } }}
                        placeholder="Promo code"
                        className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium uppercase tracking-wide placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:border-amber-400" />
                      <button type="button" onClick={applyPromo} disabled={promoLoading || !promoInput.trim()}
                        className="px-4 rounded-xl bg-[#1A1102] text-white text-sm font-bold disabled:opacity-40">
                        {promoLoading ? '…' : 'Apply'}
                      </button>
                    </div>
                    {promoError && <p className="text-red-500 text-xs mt-1.5">{promoError}</p>}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-3 space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">₦{subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount {appliedPromo?.code ? `(${appliedPromo.code})` : ''}</span>
                    <span className="font-semibold">−₦{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Delivery</span>
                  {deliveryFee === null && !productFees.length ? (
                    <span className="text-xs font-medium text-gray-400">…</span>
                  ) : effectiveFee > 0 ? (
                    <span className="font-semibold text-gray-900">₦{effectiveFee.toLocaleString()}</span>
                  ) : (
                    <span className="text-xs font-bold text-green-600">Free</span>
                  )}
                </div>
                <div className="flex justify-between font-black text-gray-900 pt-1 border-t border-gray-100">
                  <span>Total</span>
                  <span>₦{total.toLocaleString()}</span>
                </div>
                {payMethod === 'on_delivery' && (
                  <p className="text-[11px] text-gray-500 pt-1">Pay ₦{total.toLocaleString()} to the delivery agent on arrival.</p>
                )}
              </div>

              {/* Mobile submit */}
              <button type="button" onClick={handleSubmit} disabled={loading || items.length === 0}
                className="lg:hidden w-full mt-4 bg-[#FFAA14] hover:bg-amber-500 active:scale-[0.98] text-white font-black py-4 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Placing order…</>
                  : payMethod === 'on_delivery' ? 'Place Order' : 'Continue to Payment →'}
              </button>

              <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1.5 mt-4">
                <ShieldCheck size={12} className="text-[#FFAA14]" /> Secure checkout
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
