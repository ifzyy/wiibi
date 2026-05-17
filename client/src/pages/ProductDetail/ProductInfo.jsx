import { ShoppingCart } from 'lucide-react';
import { MOCK_POWERED_DEVICES, MOCK_TRUST_BADGES } from './mockData.js';
import { normalizePoweredDevices } from '../../utils/poweredDevices.js';

const ProductInfo = ({ product, adding, onAddToCart, onBuy }) => {
  const inStock = product.stock > 0;
  const sku     = product.sku || "wii 345567";
  const tags    = Array.isArray(product.tags) ? product.tags : [];

  const getTagClasses = (tag) => {
    const normalized = String(tag).toLowerCase();
    if (normalized === 'hot') return 'text-[11px] font-bold border  text-red-600 px-3 py-1 ';
    if (normalized === 'new') return 'text-[11px] font-bold border border-emerald-200 bg-emerald-50 text-emerald-600 px-3 py-1 ';
    return 'text-[11px] font-semibold  bg-gray-100 text-gray-600 px-3 py-1 ';
  };

  // Use real powered_devices if backend returns them, else fallback to mock.
  // Normalize labels to frontend icon components so we don't depend on backend icon shape.
  const poweredDevices = normalizePoweredDevices(product.powered_devices ?? MOCK_POWERED_DEVICES);
  const trustBadges    = product.trust_badges    || MOCK_TRUST_BADGES;

  return (
    <div className="flex flex-col">
      {/* Tags */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {tags.map((tag) => (
          <span key={tag} className={getTagClasses(tag)}>{tag}</span>
        ))}

        {!inStock && (
          <span className="text-[11px] font-bold border border-red-200 text-red-400 px-3 py-1 rounded">
            Out of stock
          </span>
        )}
      </div>

      {/* Name */}
      <h1 className="text-3xl font-black text-gray-900 leading-tight mb-2">{product.name}</h1>

      {/* SKU */}
      <p className="text-sm text-gray-400 mb-5">SKU : {sku}</p>

{/* "To Power" box */}
{product.listing_type === 'package' && poweredDevices.length > 0 && (
  <div className="mb-6">
    <p className="text-xs font-semibold text-gray-500 mb-3">To Power</p>

    <div className="inline-grid grid-cols-2 gap-x-6 gap-y-3 bg-[#f9f9f9] p-4 rounded-lg">
      {poweredDevices.map(({ label, icon: Icon }) => (
        <div
          key={label}
          className="flex items-center gap-2 text-sm text-gray-700 font-medium"
        >
          {Icon && <Icon size={16} className="text-gray-400" />}
          {label}
        </div>
      ))}
    </div>
  </div>
)}

      {/* Price */}
      <div className="flex items-baseline gap-3 mb-5">
        <span className="text-4xl font-black text-gray-900">
          ₦{Number(product.price).toLocaleString()}
        </span>
        {product.sale_price && (
          <span className="text-xl text-gray-400 line-through">
            ₦{Number(product.sale_price).toLocaleString()}
          </span>
        )}
      </div>

      {/* Trust badges */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-7">
        {trustBadges.map(({ icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <span>{icon}</span> {label}
          </div>
        ))}
      </div>
{/* CTA buttons */}
<div className="flex gap-3">
  <button
    onClick={onBuy}
    disabled={!inStock || adding}
    className="flex-1 bg-[#FFAA14] hover:bg-amber-500 text-white font-black py-4 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
  >
    {adding ? (
      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    ) : (
      "Buy"
    )}
  </button>

  <button
    onClick={onAddToCart}
    disabled={!inStock || adding}
    className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-bold py-4 px-6 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 text-sm"
  >
    <ShoppingCart size={16} />
    {inStock ? "Add to Cart" : "Out of Stock"}
  </button>
</div>

      {inStock && (
        <p className="text-xs text-gray-400 mt-3">
          {product.stock} unit{product.stock !== 1 ? 's' : ''} available
        </p>
      )}
    </div>
  );
};

export default ProductInfo;
