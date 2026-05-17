import { X, ShoppingBag, Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useNavigate } from 'react-router-dom';

const CartDrawer = () => {
  const { cart, drawerOpen, setDrawerOpen, updateItem, removeItem, loading } = useCart();
  const navigate = useNavigate();

  if (!drawerOpen) return null;

  const items = cart.items || [];

  const handleCheckout = () => {
    setDrawerOpen(false);
    navigate('/checkout');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={() => setDrawerOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-white shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} className="text-[#FFAA14]" />
            <span className="font-black text-gray-900 text-lg">Your Cart</span>
            {items.length > 0 && (
              <span className="bg-[#FFAA14] text-white text-xs font-black px-2 py-0.5 rounded-full">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm animate-pulse">
              Updating cart…
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="flex flex-col items-center justify-center h-60 text-center">
              <ShoppingBag size={40} className="text-gray-200 mb-4" />
              <p className="font-bold text-gray-400 text-sm">Your cart is empty</p>
              <button
                onClick={() => { setDrawerOpen(false); navigate('/store'); }}
                className="mt-4 text-[#FFAA14] text-sm font-bold hover:underline"
              >
                Browse products →
              </button>
            </div>
          )}

          {!loading && items.map((item) => {
            const product = item.product || {};
            return (
              <div key={item.id} className="flex gap-4 py-4 border-b border-gray-50 last:border-0">
                {/* Image */}
                <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100">
                  {product.featured_image_url ? (
                    <img
                      src={product.featured_image_url}
                      alt={product.name}
                      className="w-full h-full object-cover mix-blend-multiply"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm leading-tight mb-1 truncate">
                    {product.name || item.productName}
                  </p>
                  <p className="text-[#FFAA14] font-black text-sm mb-3">
                    ₦{Number(item.unitPrice).toLocaleString()}
                  </p>

                  <div className="flex items-center justify-between">
                    {/* Qty stepper */}
                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
                      <button
                        onClick={() => item.quantity > 1 ? updateItem(item.id, item.quantity - 1) : removeItem(item.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all text-gray-600"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="font-black text-sm w-6 text-center text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all text-gray-600"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-gray-100 bg-white">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500 font-medium text-sm">Subtotal</span>
              <span className="font-black text-gray-900 text-lg">
                ₦{Number(cart.total).toLocaleString()}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-[#FFAA14] hover:bg-amber-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg text-sm"
            >
              Checkout →
            </button>
            <button
              onClick={() => { setDrawerOpen(false); navigate('/store'); }}
              className="w-full mt-3 text-gray-400 hover:text-gray-700 text-xs font-medium transition-colors"
            >
              Continue shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;