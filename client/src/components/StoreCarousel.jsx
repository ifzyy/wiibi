import { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

function StoreCarousel() {
  const autoplayOptions = { delay: 4000, stopOnInteraction: false };

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "center",
      skipSnaps: false,
    },
    [Autoplay(autoplayOptions)],
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real products from public API
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`${API_BASE}/public/products`, {
          params: {
            limit: 10, // show up to 6 featured/visible products
          },
        });

        console.log(response);

        // Use only visible & featured products (admin controls this)
        const featured = response.data.products.filter(
          (p) => p.is_visible && p.is_featured,
        );
        setProducts(
          featured.length > 0 ? featured : response.data.products.slice(0, 6),
        );
      } catch (err) {
        console.error("Failed to load products:", err);
        setError("Unable to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

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

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Loading products...</p>
        </div>
      </section>
    );
  }

  if (error || products.length === 0) {
    return (
      <section className="py-20 bg-white">
        <div className="text-center">
          <p className="text-gray-600 text-lg">
            {error || "No products available at the moment."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white font-sans">
      {/* Header */}
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
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M7 17l10-10M7 7h10v10" />
          </svg>
        </a>
      </div>

      <div className="relative max-w-6xl mx-auto px-4">
        {/* Navigation Arrows */}
        <button
          onClick={scrollPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
          disabled={selectedIndex === 0}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <button
          onClick={scrollNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
          disabled={selectedIndex === scrollSnaps.length - 1}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        {/* Carousel Viewport */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex touch-pan-y">
            {products.map((product, i) => {
              const isActive = i === selectedIndex;
              return (
                <div
                  key={product.id || i}
                  className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] md:flex-[0_0_40%] lg:flex-[0_0_33.33%] px-4 transition-all duration-700 ease-in-out"
                  style={{
                    opacity: isActive ? 1 : 0.4,
                    transform: isActive ? "scale(1)" : "scale(0.95)",
                  }}
                >
                  <div className="bg-[#F9FAFB] rounded-2xl p-8 relative flex flex-col items-center">
                    {/* Stock Badge */}
                    {product.stock <= 5 && (
                      <span className="absolute top-4 right-4 bg-[#FF0000] text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase">
                        {product.stock} left
                      </span>
                    )}

                    <div className="h-48 flex items-center justify-center mb-6">
                      <img
                        src={
                          product.featured_image_url ||
                          "https://via.placeholder.com/300x300?text=No+Image"
                        }
                        alt={product.name}
                        className="max-h-full object-contain"
                        onError={(e) =>
                          (e.target.src =
                            "https://via.placeholder.com/300x300?text=No+Image")
                        }
                      />
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {product.name}
                    </h3>
                    <p className="text-gray-500 text-sm mb-4 max-w-[200px] text-center leading-tight">
                      {product.short_description ||
                        product.description?.substring(0, 80) + "..."}
                    </p>
                    <span className="text-2xl font-semibold text-gray-900 mb-8">
                      ₦
                      {product.sale_price ||
                        product.price?.toLocaleString() ||
                        "N/A"}
                    </span>
                  </div>
                  {/* Action Buttons */}
                  {isActive && (
                    <div className="flex gap-2 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <button className="flex-[1.2] bg-[#FFAA14] text-white py-3 rounded-md font-semibold text-sm hover:bg-yellow-500 transition shadow-sm">
                        Buy Now
                      </button>
                      <button className="flex-1 bg-white border border-gray-200 text-gray-800 py-3 rounded-md font-semibold text-sm hover:bg-gray-50 transition flex items-center justify-center gap-2 shadow-sm">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="9" cy="21" r="1" />
                          <circle cx="20" cy="21" r="1" />
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                        Add to cart
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {scrollSnaps.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi && emblaApi.scrollTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
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
