import React, { useState, useEffect } from "react";
import axios from "axios";
import { ChevronDown, SlidersHorizontal, Search } from "lucide-react";

const StorePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState(10000000);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Calling your local API endpoint
        const res = await axios.get(
          "http://localhost:5000/api/public/products",
        );
        setProducts(res.data.products || []);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading)
    return (
      <div className="p-20 text-center font-black animate-pulse text-[#FFAA14 ] -300">
        LOADING STORE...
      </div>
    );

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-10 flex gap-12 bg-white">
      {/* --- SIDEBAR FILTERS --- */}
      <aside className="w-64 flex-shrink-0 space-y-8">
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[#FFAA14 ]  ">Filters</h2>
            <button className="text-xs font-bold text-[#FFAA14 ] -400 underline uppercase tracking-widest">
              Clear Filters
            </button>
          </div>

          {/* Categories */}
          <div className="border-t  border-stone-50 -100 py-6">
            <div className="flex justify-between items-center mb-4 cursor-pointer">
              <span className="text-sm font-bold text-[#FFAA14 ]  ">
                Categories
              </span>
              <ChevronDown size={16} />
            </div>
            <div className="space-y-4">
              {[
                "Accessories",
                "Battery",
                "Packages",
                "Charge controller",
                "Power Station",
              ].map((cat) => (
                <label
                  key={cat}
                  className="flex items-center gap-3 group cursor-pointer"
                >
                  <div
                    className={`w-5 h-5 rounded border ${cat === "Accessories" ? "bg-amber-500 border-amber-500" : " border-stone-50 -200 group-hover: border-stone-50 -400"}`}
                  />
                  <span
                    className={`text-sm font-bold ${cat === "Accessories" ? "text-[#FFAA14 ]  " : "text-[#FFAA14 ] -500"}`}
                  >
                    {cat}
                  </span>
                  <ChevronDown
                    size={14}
                    className="ml-auto text-[#FFAA14 ] -300"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Brands */}
          <div className="border-t border-[#FFAA14] -100 py-6">
            <div className="flex justify-between items-center mb-4 cursor-pointer">
              <span className="text-sm font-bold text-[#FFAA14 ]  ">
                Brands
              </span>
              <ChevronDown size={16} />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="w-5 h-5 rounded border  border-stone-50 -200" />
              <span className="text-sm font-bold text-[#FFAA14 ] -500">
                Ghos Smart Home
              </span>
            </label>
          </div>

          {/* Price Slider */}
          <div className="border-t  border-stone-50 -100 py-6">
            <div className="flex justify-between items-center mb-4 cursor-pointer">
              <span className="text-sm font-bold text-[#FFAA14 ]  ">Price</span>
              <ChevronDown size={16} />
            </div>
            <input
              type="range"
              min="100000"
              max="10000000"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="w-full h-1.5 bg-[#FFAA14 ] -100 rounded-lg appearance-none cursor-pointer accent-[#FFAA14 ]  "
            />
            <div className="flex justify-between mt-4 text-[11px] font-black text-[#FFAA14 ]   uppercase tracking-widest">
              <span>₦100,000</span>
              <span>₦10,000,000</span>
            </div>
          </div>

          <button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-lg shadow-lg shadow-amber-200 transition-all active:scale-95">
            Apply Filters
          </button>
        </div>

        {/* Skeleton Ad Placeholder from Reference */}
        <div className="bg-[#FFAA14 ] -50 rounded-2xl h-64 border  border-stone-50 -100 relative overflow-hidden">
          <div className="absolute top-6 left-6 w-24 h-4 bg-white rounded" />
          <div className="absolute bottom-6 left-6 w-32 h-6 bg-white rounded" />
        </div>
      </aside>

      {/* --- PRODUCT GRID --- */}
      <main className="flex-1">
        <div className="flex justify-between items-end mb-10">
          <h1 className="text-2xl font-black text-[#FFAA14 ]  ">
            Accessories{" "}
            <span className="text-[#FFAA14 ] -300 ml-2 font-medium">
              {products.length}
            </span>
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {products.map((product) => (
            <div key={product.id} className="group cursor-pointer">
              {/* Product Image Area */}
              <div className="aspect-square bg-[#FFAA14 ] -50 rounded-xl overflow-hidden mb-5 relative border border-stone-100">
                <img
                  src={product.featured_image_url}
                  alt={product.name}
                  className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Tags Area */}
              <div className="flex gap-2 mb-3">
                <span className="text-[9px] font-black uppercase tracking-tighter bg-red-50 text-red-500 px-2 py-0.5 rounded">
                  Hot
                </span>
                <span className="text-[9px] font-black uppercase tracking-tighter bg-[#FFAA14 ] -100 text-[#FFAA14 ] -500 px-2 py-0.5 rounded">
                  Remote Work
                </span>
                <span className="text-[9px] font-black uppercase tracking-tighter bg-[#FFAA14 ] -100 text-[#FFAA14 ] -500 px-2 py-0.5 rounded">
                  Cost Effective
                </span>
              </div>

              {/* Text Info */}
              <h3 className="font-bold text-[#FFAA14 ]   text-sm leading-tight mb-1 group-hover:text-amber-600 transition-colors">
                {product.name}
              </h3>
              <p className="text-[10px] font-medium text-[#FFAA14 ] -400 mb-2">
                256Wh · 5.3 hr charge
              </p>

              <div className="text-lg font-black text-[#FFAA14 ]   tracking-tight">
                ₦{Number(product.price).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default StorePage;
