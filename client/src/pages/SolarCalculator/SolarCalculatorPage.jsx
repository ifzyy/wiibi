import React, { useState, useEffect, useMemo, useCallback } from "react";
import heroImage from "../../assets/cta.png";
import heroFlower from "../../assets/hero-flower.svg";
import axios from "axios";
import { X, ChevronDown, ChevronRight } from "lucide-react";
import CalculatorModal from "./CalculatorModal.jsx";

// --- Main Page ---
const SolarCalculatorPage = () => {
  const [amount, setAmount] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state

  const handleAmountChange = useCallback((e) => {
    setAmount(e.target.value);
  }, []);

  const isActive = useMemo(() => amount.length > 0, [amount]);

  // Handler for arrow button click
  const handleCalculateClick = () => {
    if (isActive) {
      setIsModalOpen(true);
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetchPage = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:5000/api/public/pages/home");
        if (!mounted) return;
        setData(response.data);
      } catch (err) {
        if (!mounted) return;
        setError("Failed to load page content");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchPage();
    return () => { mounted = false; };
  }, []);

  const hero = useMemo(() => {
    if (!data?.sections) return null;
    return data.sections.find((s) => s.type === "hero") || null;
  }, [data]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-medium">Loading...</div>;
  if (!hero?.content) return null;

  return (
    <>
      <section className="bg-white font-sans relative">
        {/* Main Hero Section (Layout preserved) */}
        <div className="min-h-[85vh] flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-screen-2xl mx-auto flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-[0.9] lg:pr-12">
              <p className="text-[#FFAA14] font-semibold uppercase tracking-wider text-sm mb-6">{hero.content.subtitle}</p>
              <h1 className="text-[#1A1102] text-5xl xl:text-7xl font-bold leading-tight mb-8">{hero.content.title}</h1>
              <p className="text-[#606060] text-lg xl:text-xl font-medium max-w-xl mb-10 leading-relaxed">{hero.content.main_support_text}</p>
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button className="bg-[#1A1102] px-8 py-4 text-white font-bold rounded-md hover:bg-black transition-colors">View our packages</button>
              </div>
              <img src={heroFlower} className="w-8 h-8" alt="" />
              <p className="font-light text-[#606060] text-[17px] max-w-[260px]">{hero.content.second_support_text}</p>
            </div>

            <div className="flex-[1.1] w-full aspect-[4/3] rounded-sm overflow-hidden">
              <img src={heroImage} className="w-full h-auto object-cover" alt="Solar" />
            </div>
          </div>
        </div>

        {/* Bottom Calculator Bar */}
        <div className="w-full border-t border-gray-200 flex flex-col md:flex-row h-auto md:h-32">
          <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-100">
            <div className="flex items-center gap-4 mb-2">
              <h3 className="text-xl font-bold uppercase tracking-tighter">{hero.content.question_text}</h3>
              <div className="flex gap-1 text-[#FFAA14]">
                <span className="font-bold">›</span><span className="font-bold">›</span><span className="font-bold opacity-50">›</span>
              </div>
            </div>
            <p className="text-gray-500 font-medium">{hero.content.confidence_text}</p>
          </div>

          <div className="flex-1 p-6 lg:px-12 flex items-center justify-between bg-white">
            <div className="flex flex-col w-full mr-4">
              <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">Solar Calculator</span>
              <div className="flex items-center gap-1">
                <span className="text-3xl lg:text-4xl font-bold text-gray-300">₦</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={handleAmountChange}
                  className="text-3xl lg:text-4xl font-bold text-[#1A1102] outline-none w-full placeholder:text-gray-200"
                />
              </div>
            </div>

            {/* Monthly Toggler */}
            <div className="flex items-center gap-2 border border-gray-100 rounded-lg p-1">
              <button className="text-[#FFAA14] px-2 text-xl">‹</button>
              <span className="bg-gray-50 px-3 py-1.5 rounded text-[11px] font-black uppercase tracking-tighter text-gray-600">Monthly</span>
              <button className="text-[#FFAA14] px-2 text-xl">›</button>
            </div>
          </div>

          {/* Trigger Button */}
          <div
            onClick={handleCalculateClick}
            className={`w-full md:w-[100px] flex items-center justify-center cursor-pointer transition-all duration-300 ${
              isActive ? "bg-[#FFAA14] hover:bg-[#e69912]" : "bg-[#E5E5E5] cursor-not-allowed"
            }`}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </div>
      </section>

      {/* The Modal */}
      <CalculatorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default SolarCalculatorPage;