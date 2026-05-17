import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, User, ChevronDown, LogOut,
  Package, Calculator, Bookmark, Menu, X
} from 'lucide-react';
import PromoHeader from './PromoHeader';
import WiibiLogo from './assets/wiibi-logo.svg';
import AuthModal from './Auth/AuthModal';
import { useAuth } from './context/AuthContext.jsx';
import { useCart } from './context/CartContext.jsx';

const Navigation = () => {
  const { user, isLoggedIn, logout, loading: authLoading } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  // ── Mega menu ────────────────────────────────────────────────────────────
  const [hoveredDropdown, setHoveredDropdown] = useState(null);
  const openTimeoutRef  = useRef(null);
  const closeTimeoutRef = useRef(null);
  const currentPath = window.location.pathname;

  const handleMouseEnter = (label) => {
    clearTimeout(closeTimeoutRef.current);
    openTimeoutRef.current = setTimeout(() => setHoveredDropdown(label), 300);
  };
  const handleMouseLeave = () => {
    clearTimeout(openTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => setHoveredDropdown(null), 150);
  };
  const handleLinkClick = () => {
    clearTimeout(openTimeoutRef.current);
    clearTimeout(closeTimeoutRef.current);
    setHoveredDropdown(null);
    setMobileOpen(false);
  };
  useEffect(() => () => {
    clearTimeout(openTimeoutRef.current);
    clearTimeout(closeTimeoutRef.current);
  }, []);

  // ── Auth modal ────────────────────────────────────────────────────────────
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authView, setAuthView] = useState('signin');
  const openAuth = (view) => {
    setAuthView(view);
    setIsAuthOpen(true);
    setHoveredDropdown(null);
    setMobileOpen(false);
  };

  // ── Profile dropdown ──────────────────────────────────────────────────────
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  useEffect(() => {
    if (!profileOpen) return;
    const h = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [profileOpen]);

  // ── Mobile menu ───────────────────────────────────────────────────────────
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // ── Force-logout listener ─────────────────────────────────────────────────
  useEffect(() => {
    const h = () => { setProfileOpen(false); setMobileOpen(false); };
    window.addEventListener('auth:logout', h);
    return () => window.removeEventListener('auth:logout', h);
  }, []);

  const handleLogout = async () => {
    setProfileOpen(false);
    setMobileOpen(false);
    await logout();
    navigate('/');
  };

  // ── Updated menu — Store is the only item with a dropdown.
  // Projects is standalone. GHOS Ecosystem added. Get a Quote removed.
  // Our Services content moves into the About Us page.
  const menuItems = [
    { label: 'Store',            href: '/store',          hasDropdown: true  },
    { label: 'Projects',         href: '/projects',       hasDropdown: false },
    { label: 'Solar Calculator', href: '/calculator',     hasDropdown: false },
    { label: 'GHOS Ecosystem',   href: '/ghos-ecosystem', hasDropdown: false },
    { label: 'Blog',             href: '/blog',           hasDropdown: false },
    { label: 'Contact Us',       href: '/contact',        hasDropdown: false },
    { label: 'About Us',         href: '/about',          hasDropdown: false },
  ];

  const profileLinks = [
    { icon: User,       label: 'My Account',              href: '/account'               },
    { icon: Calculator, label: 'Solar Calculator History', href: '/account/solar-history' },
    { icon: Package,    label: 'Track Order',              href: '/account/orders'        },
    { icon: Bookmark,   label: 'Saved Cart',               href: '/account/saved-cart'    },
  ];

  return (
    <>
      {/* Mega-menu backdrop */}
      <div className={`fixed inset-0 bg-black/5 backdrop-blur-sm z-40 transition-opacity duration-300 pointer-events-none ${
        hoveredDropdown || isAuthOpen ? 'opacity-100' : 'opacity-0'
      }`} />

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} view={authView} setView={setAuthView} />

      {/* ── Mobile full-screen overlay ──────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col lg:hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <a href="/" className="flex items-center gap-2">
              <img src={WiibiLogo} alt="Wiibi" className="w-7 h-7" />
              <span className="font-bold text-base text-[#1A1102]">Wiibi Energy</span>
            </a>
            <button onClick={() => setMobileOpen(false)} className="p-2 text-gray-400 hover:text-gray-900">
              <X size={22} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-6 py-5">
            {menuItems.map((item) => (
              <a key={item.label} href={item.href} onClick={handleLinkClick}
                className="flex items-center justify-between py-3.5 text-sm font-semibold text-gray-700 hover:text-[#FFAA14] border-b border-gray-50 transition-colors">
                {item.label} <span className="text-gray-300 text-xs">→</span>
              </a>
            ))}
          </nav>
          <div className="px-6 py-5 border-t border-gray-100 space-y-2">
            <button onClick={() => { setMobileOpen(false); navigate('/cart'); }}
              className="w-full flex items-center justify-between py-3 text-sm font-bold text-gray-700 border-b border-gray-50 pb-4 mb-1">
              <span className="flex items-center gap-3"><ShoppingCart size={17} className="text-[#FFAA14]" />Cart</span>
              {itemCount > 0 && <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{itemCount}</span>}
            </button>
            {isLoggedIn ? (
              <>
                {profileLinks.map(({ icon: Icon, label, href }) => (
                  <button key={href} onClick={() => { navigate(href); setMobileOpen(false); }}
                    className="w-full text-left py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-3 transition-colors">
                    <Icon size={14} className="text-gray-400" />{label}
                  </button>
                ))}
                <button onClick={handleLogout}
                  className="w-full text-left py-3 text-sm font-bold text-red-400 flex items-center gap-2 mt-1">
                  <LogOut size={14} />Log Out
                </button>
              </>
            ) : (
              <>
                <button onClick={() => openAuth('signin')}
                  className="w-full py-3 text-sm font-bold text-white bg-[#FFAA14] rounded-xl hover:bg-amber-500 transition-colors">Sign In</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Main sticky header ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white">
        <PromoHeader />
        <nav className="border-b border-gray-100 relative bg-white">
          <div className="container mx-auto px-6">
            <div className="flex justify-between items-center h-16">

              {/* Logo */}
              <a href="/" onClick={handleLinkClick} className="flex items-center gap-2 shrink-0">
                <img src={WiibiLogo} alt="Wiibi Logo" className="w-7 h-7" />
                <span className="font-bold text-base text-[#1A1102]">Wiibi Energy</span>
              </a>

              {/* Desktop nav links */}
              <ul className="hidden lg:flex items-center gap-7">
                {menuItems.map((item) => {
                  const isActive  = currentPath === item.href || currentPath.startsWith(`${item.href}/`);
                  const isHovered = hoveredDropdown === item.label;
                  return (
                    <li key={item.label}
                      onMouseEnter={() => item.hasDropdown && handleMouseEnter(item.label)}
                      onMouseLeave={item.hasDropdown ? handleMouseLeave : undefined}
                      className="relative py-6">
                      <a href={item.href} onClick={handleLinkClick}
                        className={`flex items-center gap-1 text-sm font-semibold transition-colors ${
                          isActive || isHovered ? 'text-[#FFAA14]' : 'text-gray-500 hover:text-[#FFAA14]'
                        }`}>
                        {item.label}
                        {item.hasDropdown && (
                          <span className={`text-[9px] ml-0.5 transition-transform ${isHovered ? 'rotate-180' : ''}`}>
                            {isHovered ? '▲' : '▼'}
                          </span>
                        )}
                      </a>
                      {isActive && (
                        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[#FFAA14] text-[9px]">▲</div>
                      )}
                    </li>
                  );
                })}
              </ul>

              {/* Desktop right: Cart + Profile */}
              <div className="hidden lg:flex items-center gap-1">
                <button onClick={() => navigate('/cart')}
                  className="relative flex items-center gap-2 px-3 py-2 text-sm font-bold text-gray-700 hover:text-[#FFAA14] hover:bg-gray-50 rounded-lg transition-all">
                  <div className="relative">
                    <ShoppingCart size={18} />
                    {itemCount > 0 && (
                      <span className="absolute -top-2 -right-2 min-w-[17px] h-[17px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 leading-none">
                        {itemCount > 99 ? '99+' : itemCount}
                      </span>
                    )}
                  </div>
                  <span>Cart</span>
                </button>

                {authLoading ? (
                  <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse ml-1" />
                ) : isLoggedIn ? (
                  <div className="relative ml-1" ref={profileRef}>
                    <button onClick={() => setProfileOpen((o) => !o)}
                      className="flex items-center gap-1 p-1.5 rounded-xl hover:bg-gray-50 transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-amber-50 transition-colors">
                        <User size={15} className="text-gray-500 group-hover:text-[#FFAA14] transition-colors" />
                      </div>
                      <ChevronDown size={13} className={`text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {profileOpen && (
                      <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Profile</span>
                          <button onClick={() => { navigate('/account'); setProfileOpen(false); }}
                            className="text-[10px] font-bold text-gray-400 hover:text-[#FFAA14] transition-colors">
                            See All
                          </button>
                        </div>
                        <div className="py-1">
                          {profileLinks.map(({ icon: Icon, label, href }) => (
                            <button key={href}
                              onClick={() => { navigate(href); setProfileOpen(false); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left">
                              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                <Icon size={13} className="text-gray-500" />
                              </div>
                              {label}
                            </button>
                          ))}
                        </div>
                        <div className="px-4 py-3 border-t border-gray-50">
                          <button onClick={handleLogout}
                            className="w-full text-center text-sm font-bold text-red-400 hover:text-red-600 transition-colors">
                            Log Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <button onClick={() => openAuth('signin')}
                      className="text-sm font-bold text-white bg-[#FFAA14] px-4 py-2 rounded-lg hover:bg-[#e59912] transition-colors">
                      Sign In
                    </button>
                  </>
                )}
              </div>

              {/* Mobile: cart + hamburger */}
              <div className="flex lg:hidden items-center gap-1">
                <button onClick={() => navigate('/cart')} className="relative p-2.5 text-gray-500 hover:text-[#FFAA14]">
                  <ShoppingCart size={20} />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </button>
                <button onClick={() => setMobileOpen(true)} className="p-2.5 text-gray-500 hover:text-gray-900">
                  <Menu size={22} />
                </button>
              </div>
            </div>
          </div>

          {/* ── Store-only mega menu ──────────────────────────────────────── */}
          <div className={`absolute top-full left-0 w-full bg-[#F9F9F9] border-b border-gray-200 shadow-xl transition-all duration-300 ease-out overflow-hidden ${
            hoveredDropdown ? 'max-h-[85vh] opacity-100 visible' : 'max-h-0 opacity-0 invisible'
          }`}
            onMouseEnter={() => handleMouseEnter(hoveredDropdown)}
            onMouseLeave={handleMouseLeave}>
            <div className="container mx-auto px-12 py-16 overflow-y-auto">
              {hoveredDropdown === 'Store' && (
                <div className="flex gap-20">
                  <div className="w-1/4 border-r border-gray-200 pr-12">
                    <h4 className="font-bold mb-8">Our Packages</h4>
                    <ul className="space-y-6">
                      {['Home', 'Business', 'Reserved'].map((pkg) => (
                        <li key={pkg}>
                          <a href={`/store#${pkg.toLowerCase()}`} onClick={handleLinkClick}
                            className="flex justify-between items-center text-gray-500 hover:text-[#ffaa14] font-medium group">
                            Wiibi {pkg} <span className="opacity-0 group-hover:opacity-100">↗</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="w-1/4">
                    <h4 className="font-bold mb-8">All Products</h4>
                    <ul className="space-y-6">
                      {['Solar', 'Backup Power', 'Security', 'Smart Device', 'Smart locks', 'EV-related Items'].map((p) => (
                        <li key={p}>
                          <a href={`/store#${p.toLowerCase().replace(/\s+/g, '-')}`} onClick={handleLinkClick}
                            className="flex justify-between items-center text-gray-500 font-medium hover:text-[#ffaa14] group">
                            {p} <span className="opacity-0 group-hover:opacity-100">↗</span>
                          </a>
                        </li>
                      ))}
                    </ul>
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