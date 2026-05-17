import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { usePublicProducts } from "../hooks/queries";
import { useCart } from "../context/CartContext.jsx";

function StoreCarousel() {
  const autoplayOptions = { delay: 4000, stopOnInteraction: false };

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center", skipSnaps: false },
    [Autoplay(autoplayOptions)],
  );

  const { data, isLoading, isError, error } = usePublicProducts();
  const products =
    data?.products?.filter((p) => p.is_visible && p.is_featured) || [];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);
  const activeProduct = products[selectedIndex];

  const navigate = useNavigate();
  const { addToCart } = useCart();

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi],
  );

  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi],
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => emblaApi.off("select", onSelect);
  }, [emblaApi, onSelect]);

  const handleAddToCart = async (productId) => {
    if (!productId) return;
    try {
      await addToCart(productId, 1);
    } catch (err) {
      console.error("Add to cart failed:", err);
    }
  };

  const handleBuyNow = async (productId) => {
    if (!productId) return;
    try {
      await addToCart(productId, 1);
      navigate("/checkout");
    } catch (err) {
      console.error("Buy now failed:", err);
    }
  };

  const calculateDiscount = (price, salePrice) => {
    if (!price || !salePrice || salePrice >= price) return null;
    return Math.round(((price - salePrice) / price) * 100);
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-white text-center">
        <p className="text-gray-600 text-lg">Loading products...</p>
      </section>
    );
  }

  if (isError || products.length === 0) {
    return (
      <section className="py-20 bg-white text-center">
        <p className="text-gray-600 text-lg">
          {error?.message || "No products available."}
        </p>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white font-sans">
      <div className="text-center mb-10">
        <span className="text-[#FFAA14] text-sm font-medium uppercase tracking-wider block mb-2">
          Online Store
        </span>

        <h2 className="text-4xl md:text-5xl font-bold text-black mb-3">
          Go Solar
        </h2>

        <p className="text-lg text-gray-600 mb-4">
          Save more energy with our smart products
        </p>

        <a
          href="/store"
          className="inline-flex items-center gap-1 text-gray-500 border-b border-gray-400 pb-0.5 hover:text-black transition-colors text-sm"
        >
          Open Store
        </a>
      </div>

      <div className="relative max-w-6xl mx-auto px-4">
        {/* Navigation */}
        <button
          onClick={scrollPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 shadow-sm"
        >
          ‹
        </button>

        <button
          onClick={scrollNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 shadow-sm"
        >
          ›
        </button>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex touch-pan-y">
            {products.map((product, i) => {
              const isActive = i === selectedIndex;
              const discount = calculateDiscount(
                product.price,
                product.sale_price,
              );

              return (
                <div
                  key={product.id}
                  className="flex-[0_0_100%] sm:flex-[0_0_50%] md:flex-[0_0_40%] lg:flex-[0_0_33.33%] px-4"
                  style={{
                    opacity: isActive ? 1 : 0.45,
                    transition: "opacity 0.4s ease",
                  }}
                >
                  <div className="bg-[#F9FAFB] rounded-2xl p-8 flex flex-col items-center">
                

                    <div className="h-48 flex items-center justify-center mb-6">
                      <img
                        src={
                          product.featured_image_url ||
                          "https://via.placeholder.com/300x300"
                        }
                        alt={product.name}
                        className="max-h-full object-contain"
                      />
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                      {product.name}
                    </h3>

                    <div className="text-2xl font-medium text-gray-900 mb-4">
                      {product.sale_price &&
                      Number(product.sale_price) < Number(product.price) ? (
                        <>
                          <span className="text-2xl font-bold text-gray-900">
                            ₦{Number(product.sale_price).toLocaleString()}
                          </span>
                          <span className="text-sm line-through text-gray-400 ml-2">
                            ₦{Number(product.price).toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <>₦{Number(product.price).toLocaleString()}</>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              type="button"
              onClick={() => handleBuyNow(activeProduct?.id)}
              className=" bg-[#FFAA14] font-semibold py-2.5 px-6 hover:bg-[#e69f12] transition text-sm"
            >
              Buy Now
            </button>

            <button
              type="button"
              onClick={() => handleAddToCart(activeProduct?.id)}
              className="text-gray-800 font-semibold py-2.5 px-5 hover:bg-gray-100 transition text-sm flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.6 8h13.2M7 13L5.4 5M10 21a1 1 0 100-2 1 1 0 000 2zm7 0a1 1 0 100-2 1 1 0 000 2z"
                />
              </svg>
              Add to cart
            </button>
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {scrollSnaps.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-2 rounded-full transition-all ${
                i === selectedIndex ? "bg-gray-800 w-4" : "bg-gray-300 w-2"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default StoreCarousel;
