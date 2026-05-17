import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { usePublicProduct } from '../hooks/queries';
import { useEffect } from 'react';
import ProductDetailSkeleton from './ProductDetail/ProductDetailSkeleton.jsx';
import ProductImages          from './ProductDetail/ProductImages.jsx';
import ProductInfo            from './ProductDetail/ProductInfo.jsx';
import TabDescription         from './ProductDetail/TabDescription.jsx';
import TabSpecification       from './ProductDetail/TabSpecification.jsx';
import TabReviews             from './ProductDetail/TabReviews.jsx';
import { scrollToTop } from '../utils/scrollToTop.js';
const TABS = ["Description", "System Specification", "Reviews"];

const ProductDetailPage = () => {
  const { slug }      = useParams();
  const navigate      = useNavigate();
  const { addToCart } = useCart();

  const [activeImg, setActiveImg] = useState(0);
  const [activeTab, setActiveTab] = useState("Description");
  const [adding,    setAdding]    = useState(false);
useEffect(() => { scrollToTop(); }, []);
  const { data: product, isLoading, isError } = usePublicProduct(slug);
console.log(product)
  if (isLoading) return <ProductDetailSkeleton />;

  if (isError || !product) {
    navigate('/store', { replace: true });
    return null;
  }

  const images = [
    product.featured_image_url,
    ...(product.images || []).map((i) => i.url || i),
  ].filter(Boolean);

  const handleCart = async () => {
    setAdding(true);
    try { await addToCart(product.id, 1); }
    catch (err) { console.error(err); }
    finally { setAdding(false); }
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Back */}
        <button
          onClick={() => navigate('/store')}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm font-medium mb-10 transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </button>

        {/* Images + Info */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-16 mb-16">
          <ProductImages
            images={images}
            activeImg={activeImg}
            setActiveImg={setActiveImg}
          />
          <ProductInfo
            product={product}
            adding={adding}
            onAddToCart={handleCart}
            onBuy={handleCart}
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-10">
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-[2px] ${
                  activeTab === tab
                    ? 'border-gray-900 text-gray-900 bg-[#d9d9d9]'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab panels */}
        {activeTab === "Description"         && <TabDescription   product={product} />}
        {activeTab === "System Specification" && <TabSpecification product={product} />}
        {activeTab === "Reviews"             && <TabReviews       product={product} />}

      </div>
    </div>
  );
};

export default ProductDetailPage;
