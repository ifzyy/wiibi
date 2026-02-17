import React, { useState, useRef, useEffect } from "react";
import PromoHeader from "./PromoHeader";
import WiibiLogo from "./assets/wiibi-logo.svg";
import AuthModal from "./Auth/AuthModal";
const Navigation = () => {
  const [hoveredDropdown, setHoveredDropdown] = useState(null);
  const openTimeoutRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const currentPath = window.location.pathname;

  // 1. OPEN LOGIC: Detects intent with a 300ms dwell delay
  const handleMouseEnter = (label) => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);

    openTimeoutRef.current = setTimeout(() => {
      setHoveredDropdown(label);
    }, 300);
  };

  // 2. CLOSE LOGIC: Small buffer for mouse movement
  const handleMouseLeave = () => {
    if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);

    closeTimeoutRef.current = setTimeout(() => {
      setHoveredDropdown(null);
    }, 150);
  };

  // 3. CLICK LOGIC: Instant close for better UX on navigation
  const handleLinkClick = () => {
    if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setHoveredDropdown(null);
  };

  useEffect(() => {
    return () => {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);
  // Auth Modal States
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authView, setAuthView] = useState("login"); // 'login' or 'signup'

  const openAuth = (view) => {
    setAuthView(view);
    setIsAuthOpen(true);
    setHoveredDropdown(null); // Close any open mega menus
  };

  const menuItems = [
    { label: "Store", href: "/store", hasDropdown: true },
    { label: "Projects", href: "/projects", hasDropdown: true },
    { label: "Solar Calculator", href: "/calculator" },
    { label: "Blog", href: "/blog" },
    { label: "Contact Us", href: "/contact" },
    { label: "About Us", href: "/about" },
    { label: "Get a Quote", href: "/quote" },
  ];

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/5 backdrop-blur-sm z-40 transition-opacity duration-300 pointer-events-none ${
          hoveredDropdown || isAuthOpen ? "opacity-100" : "opacity-0"
        }`}
      />
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        view={authView}
        setView={setAuthView}
      />
      <header className="sticky top-0 z-50 bg-white">
        <PromoHeader />
        <nav className="border-b border-gray-100 relative bg-white">
          <div className="container mx-auto px-6">
            <div className="flex justify-between items-center h-20">
              <a
                className="flex items-center gap-2"
                href="/"
                onClick={handleLinkClick}
              >
                <img src={WiibiLogo} alt="Wiibi Logo" className="w-8 h-8" />
                <span className="font-bold text-lg text-[#1A1102]">
                  Wiibi Energy
                </span>
              </a>

              <ul className="hidden lg:flex items-center gap-8">
                {menuItems.map((item) => {
                  const isActive =
                    currentPath === item.href ||
                    currentPath.startsWith(`${item.href}/`);
                  const isHovered = hoveredDropdown === item.label;

                  return (
                    <li
                      key={item.label}
                      onMouseEnter={() =>
                        item.hasDropdown && handleMouseEnter(item.label)
                      }
                      onMouseLeave={handleMouseLeave}
                      className="relative py-8"
                    >
                      <a
                        href={item.href}
                        onClick={handleLinkClick}
                        className={`flex items-center gap-1 text-sm font-semibold transition-colors
                          ${isActive || isHovered ? "text-[#FFAA14]" : "text-gray-400 hover:text-[#ffaa14]"}
                        `}
                      >
                        {item.label}
                        {item.hasDropdown && (
                          <span
                            className={`text-[10px] ml-1 transition-transform ${isHovered ? "rotate-180" : ""}`}
                          >
                            {isHovered ? "▲" : "▼"}
                          </span>
                        )}
                      </a>
                      {isActive && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[#FFAA14] text-[10px]">
                          ▲
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="hidden lg:flex items-center gap-3">
                <button
                  onClick={() => openAuth("login")}
                  className="text-sm font-bold px-5 py-2 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => openAuth("signup")}
                  className="text-sm font-bold text-white bg-[#FFAA14] px-5 py-2 rounded-md hover:bg-[#e59912] transition-colors"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>

          <div
            className={`absolute top-full left-0 w-full bg-[#F9F9F9] border-b border-gray-200 shadow-xl transition-all duration-300 ease-out overflow-hidden ${
              hoveredDropdown
                ? "max-h-[85vh] opacity-100 visible"
                : "max-h-0 opacity-0 invisible"
            }`}
            onMouseEnter={() => handleMouseEnter(hoveredDropdown)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="container mx-auto px-12 py-16 overflow-y-auto">
              {/* STORE DROPDOWN */}
              {hoveredDropdown === "Store" && (
                <div className="flex gap-20">
                  <div className="w-1/4 border-r border-gray-200 pr-12">
                    <h4 className="text-gray  font-bold mb-8">Our Packages</h4>
                    <ul className="space-y-6">
                      {["Home", "Business", "Reserved"].map((pkg) => (
                        <li key={pkg}>
                          <a
                            href={`/store#${pkg.toLowerCase()}`}
                            onClick={handleLinkClick}
                            className="flex justify-between items-center text-gray-500 hover:text-[#ffaa14] font-medium group"
                          >
                            Wiibi {pkg}{" "}
                            <span className="opacity-0 group-hover:opacity-100 transition-all">
                              ↗
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="w-1/4">
                    <h4 className="text-gray  font-bold mb-8">All Products</h4>
                    <ul className="space-y-6">
                      {[
                        "Solar",
                        "Backup Power",
                        "Security",
                        "Smart Device",
                        "Smart locks",
                        "EV-related Items",
                      ].map((prod) => (
                        <li key={prod}>
                          <a
                            href={`/store#${prod.toLowerCase().replace(/\s+/g, "-")}`}
                            onClick={handleLinkClick}
                            className="flex justify-between items-center text-gray-500 font-medium hover:text-[#ffaa14] group"
                          >
                            {prod}{" "}
                            <span className="opacity-0 group-hover:opacity-100 transition-all">
                              ↗
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* PROJECTS DROPDOWN - RESTORED STYLING */}
              {hoveredDropdown === "Projects" && (
                <div className="flex gap-16">
                  {/* Left: Our Services Box */}

                  <div className="w-1/4 border-r border-gray-200 pl-4 pr-12">
                    <h4 className="text-gray  font-bold mb-8">Our Services</h4>

                    <div className=" rounded-lg border-[1px] p-4 border-[#f2f2f2] mb-8">
                      <ul className="space-y-5 text-sm font-medium text-gray-500">
                        {[
                          "Site Inspection and checklist",

                          "Personalized design systems",

                          "Professional Installation",

                          "Systems and Commissioning",
                        ].map((s) => (
                          <li
                            key={s}
                            className="hover:text-[#ffaa14] cursor-default text w-[119px] text-[16px]"
                          >
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center gap-6">
                      <a
                        href="/quote"
                        className="bg-[#1A1102] text-white px-5 py-3 text-xs font-bold rounded-md flex items-center gap-2 hover:bg-black transition"
                      >
                        Request Free Quote <span>↗</span>
                      </a>

                      <a
                        href="/services"
                        className="text-gray-400 text-xs font-bold border-b border-gray-300 pb-0.5 hover:text-[#ffaa14] transition flex items-center gap-1"
                      >
                        Learn more <span>↗</span>
                      </a>
                    </div>
                  </div>

                  {/* Right: Business/Residential Grid */}
                  <div className="flex-1">
                    <h4 className="text-gray  font-bold mb-8">
                      Projects and Case Studies
                    </h4>
                    <div className="grid grid-cols-2 gap-20">
                      <div>
                        <span className="text-[16px] text-[#1a1102] font-bold uppercase tracking-widest block mb-8">
                          For Business
                        </span>
                        <div className="space-y-10">
                          {[
                            { n: "Joes Bar", id: "joes-bar", y: "2023" },
                            { n: "Admor Links", id: "admor-links", y: "2025" },
                          ].map((p) => (
                            <a
                              key={p.n}
                              href={`/projects#${p.id}`}
                              onClick={handleLinkClick}
                              className="flex justify-between items-end group"
                            >
                              <div>
                                <p className="font-bold text-gray-600 group-hover:text-[#ffaa14] transition-colors">
                                  {p.n}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {p.y}
                                </p>
                              </div>
                              <span className="text-gray-300 group-hover:text-[#FFAA14] group-hover:-translate-y-1 transition-all">
                                ↗
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-[16px] text-[#1a1102] font-bold uppercase tracking-widest block mb-8">
                          Residential
                        </span>
                        <a
                          href="/projects#joseph-residence"
                          onClick={handleLinkClick}
                          className="flex justify-between items-end group"
                        >
                          <div>
                            <p className="font-bold text-gray-600 group-hover:text-[#ffaa14] transition-colors">
                              Mr Joseph Residence
                            </p>
                            <p className="text-xs text-gray-400 mt-1">2025</p>
                          </div>
                          <span className="text-gray-300 group-hover:text-[#FFAA14] group-hover:-translate-y-1 transition-all">
                            ↗
                          </span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>
    </>
  );
};

export default Navigation;
