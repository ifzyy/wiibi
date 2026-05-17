import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Package } from 'lucide-react';
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

const CheckoutPage = () => {
  const navigate            = useNavigate();
  const { cart, clearCart } = useCart();
  const { user }            = useAuth();
  const keyRef              = useRef(genKey());

  const isGuest = !user;

  const [form, setForm] = useState({
    fullName:     user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
    email:        user?.email || '',
    addressLine1: '',
    addressLine2: '',
    city:         '',
    state:        '',
    postalCode:   '',
    country:      'NG',
    phone:        user?.phoneNumber || '',
  });
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState('');

  const set = (f) => (e) => setForm((v) => ({ ...v, [f]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.fullName.trim())     e.fullName     = 'Required';
    if (!form.email.trim())        e.email        = 'Required for payment';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
                                   e.email        = 'Enter a valid email address';
    if (!form.addressLine1.trim()) e.addressLine1 = 'Required';
    if (!form.city.trim())         e.city         = 'Required';
    if (!form.state.trim())        e.state        = 'Required';
    if (!form.postalCode.trim())   e.postalCode   = 'Required';
    if (!form.phone.trim())        e.phone        = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || items.length === 0) return;
    setLoading(true);
    setApiError('');

    try {
      // FIX: was setting guestEmail twice and never sending guestToken.
      // guestToken is required for the backend to find the guest cart.
      // guestEmail is always sent (even for logged-in users who may have
      // no email on their account) because Paystack requires one.
      const guestToken = isGuest ? localStorage.getItem('guestToken') : null;

      const payload = {
        shippingAddress: {
          fullName:     form.fullName,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2 || null,
          city:         form.city,
          state:        form.state,
          postalCode:   form.postalCode,
          country:      form.country,
          phone:        form.phone,
        },
        currency:       'NGN',
        idempotencyKey: keyRef.current,
        // Always send guestEmail — used for Paystack payment email for everyone
        // (covers logged-in users who created their account with phone only)
        guestEmail:     form.email.trim(),
        // Only send guestToken for actual guests — backend uses it to find the cart
        ...(isGuest && guestToken ? { guestToken } : {}),
      };
console.log('Submitting checkout with payload:', payload);
      const res   = await api.post('/orders/checkout', payload);
      console.log(res)
      const order = res.data.data;

      clearCart();

      navigate('/payment', {
        state: {
          orderId:     order.id,
          orderNumber: order.orderNumber,
          orderTotal:  order.totalAmount ?? cart.total,
          guestEmail:  form.email.trim(),
        },
      });
    } catch (err) {
      console.log(err)
      setApiError(err.response?.data?.message || 'Checkout failed. Please try again.');
      keyRef.current = genKey();
    } finally {
      setLoading(false);
    }
  };

  const items    = cart.items || [];
  const subtotal = items.reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0);
  const total    = Number(cart.total || subtotal);

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-10">

        <button onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-900 text-sm font-medium mb-8 transition-colors">
          <ChevronLeft size={16} /> Back to Cart
        </button>

        <h1 className="text-2xl font-black text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {isGuest && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                <span className="mt-0.5 shrink-0">👤</span>
                <span>
                  You're checking out as a guest.{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login', { state: { returnTo: '/checkout' } })}
                    className="underline font-semibold hover:text-amber-900 transition-colors">
                    Sign in
                  </button>{' '}
                  to save your order history.
                </span>
              </div>
            )}

            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {apiError}
              </div>
            )}

            <div className="flex items-center gap-2 mb-2">
              <MapPin size={16} className="text-[#FFAA14]" />
              <h2 className="font-black text-gray-900">Contact &amp; Shipping</h2>
            </div>

            <Field label="Full Name" error={errors.fullName}>
              <input className={cls} value={form.fullName} onChange={set('fullName')}
                placeholder="Adebayo Johnson" autoComplete="name" />
            </Field>

            <Field label="Email Address" error={errors.email}>
              <input className={cls} type="email" value={form.email} onChange={set('email')}
                placeholder="adebayo@example.com" autoComplete="email" />
              {!isGuest && !user?.email && (
                <p className="text-xs text-amber-600 mt-1">
                  Your account has no email on file — please enter one for order updates and payment.
                </p>
              )}
            </Field>

            <Field label="Phone Number" error={errors.phone}>
              <input className={cls} value={form.phone} onChange={set('phone')}
                placeholder="+2348012345678" autoComplete="tel" />
            </Field>

            <Field label="Address Line 1" error={errors.addressLine1}>
              <input className={cls} value={form.addressLine1} onChange={set('addressLine1')}
                placeholder="5, Bode Thomas Street" autoComplete="address-line1" />
            </Field>

            <Field label="Address Line 2 (optional)">
              <input className={cls} value={form.addressLine2} onChange={set('addressLine2')}
                placeholder="Flat / Suite / Floor" autoComplete="address-line2" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="City" error={errors.city}>
                <input className={cls} value={form.city} onChange={set('city')}
                  placeholder="Lagos" autoComplete="address-level2" />
              </Field>
              <Field label="State" error={errors.state}>
                <input className={cls} value={form.state} onChange={set('state')}
                  placeholder="Lagos" autoComplete="address-level1" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Postal Code" error={errors.postalCode}>
                <input className={cls} value={form.postalCode} onChange={set('postalCode')}
                  placeholder="100001" autoComplete="postal-code" />
              </Field>
              <Field label="Country">
                <select className={cls} value={form.country} onChange={set('country')} autoComplete="country">
                  <option value="NG">Nigeria</option>
                  <option value="GH">Ghana</option>
                  <option value="KE">Kenya</option>
                </select>
              </Field>
            </div>

            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="w-full bg-[#FFAA14] hover:bg-amber-500 active:scale-[0.98] text-white font-black py-4 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-2">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                : 'Continue to Payment →'
              }
            </button>
          </form>

          {/* ── Order summary ── */}
          <div>
            <div className="bg-gray-50 rounded-2xl p-5 sticky top-6">
              <div className="flex items-center gap-2 mb-5">
                <Package size={15} className="text-[#FFAA14]" />
                <h2 className="font-black text-gray-900">Order Summary</h2>
              </div>

              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 items-start">
                    <div className="w-11 h-11 bg-white rounded-lg overflow-hidden border border-gray-100 shrink-0 flex items-center justify-center">
                      {item.product?.featured_image_url && (
                        <img src={item.product.featured_image_url} alt={item.product?.name}
                          className="w-full h-full object-contain mix-blend-multiply" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{item.product?.name || item.productName}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-xs font-black text-gray-900 shrink-0">
                      ₦{(Number(item.unitPrice) * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-3 space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Delivery</span>
                  <span className="text-xs font-medium text-green-600">Calculated at payment</span>
                </div>
                <div className="flex justify-between font-black text-gray-900 pt-1 border-t border-gray-100">
                  <span>Total</span>
                  <span>₦{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;