import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, ShoppingBag, Trash2, RotateCcw, Plus } from 'lucide-react';
import api from '../../utils/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';

const SavedCartTab = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [savedCarts, setSavedCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [addingItemIds, setAddingItemIds] = useState({});
  const [restoringId, setRestoringId] = useState(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const loadSavedCarts = async () => {
      setLoading(true);
      setError('');
      setActionError('');
      try {
        const res = await api.get('/cart/saved');
        setSavedCarts(res.data.data || []);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login', { state: { returnTo: '/account/saved-cart' } });
          return;
        }
        setError(err.response?.data?.message || 'Unable to load saved carts.');
      } finally {
        setLoading(false);
      }
    };
    loadSavedCarts();
  }, [user, navigate]);

  const handleDelete = async (cartId) => {
    if (!cartId) return;
    setDeletingId(cartId);
    try {
      await api.delete(`/cart/saved/${cartId}`);
      setSavedCarts((prev) => prev.filter((cart) => cart.id !== cartId));
    } catch (err) {
      console.error('Failed to delete saved cart:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddItem = async (item) => {
    const productId = item.product?.id || item.productId;
    if (!productId) return;
    setAddingItemIds((prev) => ({ ...prev, [item.id]: true }));
    setActionError('');
    try {
      await addToCart(productId, item.quantity);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to add item to cart.');
    } finally {
      setAddingItemIds((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const handleRestoreCart = async (cartId, items) => {
    if (!items?.length) return;
    setRestoringId(cartId);
    setActionError('');
    try {
      for (const item of items) {
        const productId = item.product?.id || item.productId;
        if (!productId) continue;
        await addToCart(productId, item.quantity);
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to restore saved cart.');
    } finally {
      setRestoringId(null);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-24">
        <Bookmark size={32} className="text-gray-200 mx-auto mb-4" />
        <h2 className="text-base font-semibold text-gray-900 mb-1">Sign in to view saved carts</h2>
        <p className="text-sm text-gray-400 mb-6">Manage carts you've saved for later.</p>
        <button
          onClick={() => navigate('/login', { state: { returnTo: '/account/saved-cart' } })}
          className="bg-[#FFAA14] text-white px-5 py-2.5 text-sm font-semibold hover:bg-amber-500 transition-colors"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Saved Carts</h2>
          <p className="text-sm text-gray-400 mt-0.5">Restore items into your active cart or browse by product.</p>
        </div>
        <button
          onClick={() => navigate('/store')}
          className="inline-flex items-center gap-2 border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ShoppingBag size={15} />
          Browse products
        </button>
      </div>

      {/* States */}
      {loading ? (
        <div className="text-center py-24 text-sm text-gray-400">Loading saved carts…</div>
      ) : error ? (
        <div className="border border-red-200 bg-red-50 text-red-600 px-4 py-3 text-sm">{error}</div>
      ) : savedCarts.length === 0 ? (
        <div className="text-center py-24">
          <Bookmark size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-400">No saved carts yet</p>
          <button
            onClick={() => navigate('/store')}
            className="mt-4 text-sm font-semibold text-[#FFAA14] hover:underline"
          >
            Browse products →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {actionError && (
            <div className="border border-amber-200 bg-amber-50 text-amber-700 px-4 py-3 text-sm">
              {actionError}
            </div>
          )}

          {savedCarts.map((cart) => {
            const items = cart.items || [];
            const total = items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);

            return (
              <div key={cart.id} className="border border-gray-200 bg-white">
                {/* Cart Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-widest mb-0.5">Saved cart</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-semibold text-gray-900">
                          {items.length} item{items.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-sm text-gray-500">·</span>
                        <span className="text-sm font-semibold text-gray-900">₦{total.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(cart.createdAt).toLocaleDateString('en-NG', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestoreCart(cart.id, items)}
                      disabled={restoringId === cart.id}
                      className="inline-flex items-center gap-2 bg-[#FFAA14] px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RotateCcw size={14} />
                      {restoringId === cart.id ? 'Restoring…' : 'Restore all'}
                    </button>
                    <button
                      onClick={() => handleDelete(cart.id)}
                      disabled={deletingId === cart.id}
                      className="inline-flex items-center gap-2 border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={14} />
                      {deletingId === cart.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-100">
                  {items.map((item) => {
                    const product = item.product;
                    const productSlug = product?.slug;
                    const itemTotal = Number(item.unitPrice) * item.quantity;
                    const isAdding = !!addingItemIds[item.id];

                    return (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4">
                        {/* Product info */}
                        <button
                          type="button"
                          onClick={() => productSlug && navigate(`/store/${productSlug}`)}
                          className="flex items-center gap-4 flex-1 min-w-0 text-left group"
                        >
                          {product?.featured_image_url ? (
                            <img
                              src={product.featured_image_url}
                              alt={product.name}
                              className="h-14 w-14 flex-none object-cover bg-gray-100"
                            />
                          ) : (
                            <div className="h-14 w-14 flex-none bg-gray-100 flex items-center justify-center text-[10px] uppercase text-gray-400 tracking-wider">
                              No img
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[#FFAA14] transition-colors">
                              {product?.name || item.productName || 'Unknown product'}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Qty {item.quantity} · ₦{Number(item.unitPrice).toLocaleString()} each
                            </p>
                            {productSlug && (
                              <p className="text-xs text-gray-400 mt-0.5 group-hover:text-[#FFAA14] transition-colors">
                                View product →
                              </p>
                            )}
                          </div>
                        </button>

                        {/* Price + action */}
                        <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto">
                          <span className="text-sm font-semibold text-gray-900">
                            ₦{itemTotal.toLocaleString()}
                          </span>
                          <button
                            type="button"
                            disabled={!product || isAdding}
                            onClick={(e) => { e.stopPropagation(); handleAddItem(item); }}
                            className="inline-flex items-center gap-1.5 border border-gray-900 bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus size={12} />
                            {isAdding ? 'Adding…' : 'Add to cart'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SavedCartTab;