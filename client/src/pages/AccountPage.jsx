import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  User, ShoppingBag, Lock, LogOut, ChevronRight, Package,
  ArrowLeft, Calculator, MapPin, Bookmark, CreditCard,
  Cookie, ChevronLeft, Edit2, Shield, LifeBuoy
} from 'lucide-react';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import AccountManagement from './settings/AccountManageMent.jsx';
import AccountDetailsTab from './settings/AccountDetails.jsx';
import SolarHistoryTab from './settings/Solarhistory.jsx';
import TrackOrderTab from './settings/TrackOrderTab.jsx';
import SavedCartTab from './settings/SavedCart.jsx';
import OrderDetail from './settings/OrderDetail.jsx';
import PaymentSettings from './settings/PaymentSettings.jsx';
import CookieSettings from './settings/CookieSettings.jsx';
import SupportTickets from './settings/SupportTickets.jsx';
import SupportTicketDetail from './settings/SupportTicketDetail.jsx';
// ── Shared input style ────────────────────────────────────────────────────────
const inputCls = 'w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all';

// ── Status badge ──────────────────────────────────────────────────────────────
const statusColors = {
  pending:    'bg-yellow-50 text-yellow-600',
  processing: 'bg-blue-50 text-blue-600',
  shipped:    'bg-purple-50 text-purple-600',
  delivered:  'bg-green-50 text-green-600',
  cancelled:  'bg-red-50 text-red-500',
};
const StatusBadge = ({ status }) => (
  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-500'}`}>
    {status}
  </span>
);


// ══════════════════════════════════════════════════════════════════════════════
// Root AccountPage — matches the screenshot's sidebar layout
// ══════════════════════════════════════════════════════════════════════════════
const AccountPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Active check helper
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const profileLinks = [
    { icon: User,       label: 'Account Details',          href: '/account'                 },
    { icon: Calculator, label: 'Solar Calculator History',  href: '/account/solar-history'   },
    { icon: Package,    label: 'Track Order',               href: '/account/orders'          },
    { icon: Bookmark,   label: 'Saved Cart',                href: '/account/saved-cart'      },
    { icon: LifeBuoy,   label: 'Support',                   href: '/account/support'         },
  ];

  const managementLinks = [
    { label: 'Account Management', href: '/account/security'   },
    { label: 'Payment settings',   href: '/account/payment'    },
    { label: 'Cookie Preference',  href: '/account/cookies'    },
  ];

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] min-h-screen">

          {/* ── Sidebar ────────────────────────────────────────────────────── */}
          <aside className="border-r border-gray-100 px-6 pt-8 pb-10 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto flex flex-col">

            {/* Back */}
            <button onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm font-medium mb-6 transition-colors w-fit">
              <ChevronLeft size={15} /> Back
            </button>

            <h1 className="text-xl font-bold text-gray-900 mb-6">Account Overview</h1>

            {/* Profile section */}
            <div className="mb-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">Profile</p>
              <nav className="space-y-0.5">
                {profileLinks.map(({ icon: Icon, label, href }) => {
                  const active = href === '/account' ? location.pathname === '/account' : isActive(href);
                  return (
                    <button key={href} onClick={() => navigate(href)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                        active
                          ? 'text-[#FFAA14] bg-amber-50'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}>
                      <Icon size={16} className={active ? 'text-[#FFAA14]' : 'text-gray-400'} />
                      {label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Management section */}
            <div className="mt-6">
              <nav className="space-y-0.5">
                {managementLinks.map(({ label, href }) => {
                  const active = isActive(href);
                  return (
                    <button key={href} onClick={() => navigate(href)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                        active
                          ? 'text-[#FFAA14] bg-amber-50'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`}>
                      {label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Logout at bottom */}
            <div className="mt-auto pt-8">
              <button onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-red-400 hover:text-red-600 transition-colors">
                <LogOut size={15} /> Log Out
              </button>
            </div>
          </aside>

          {/* ── Content ────────────────────────────────────────────────────── */}
          <main className="px-8 pt-8 pb-12">
            {/* Thin top border line matching screenshot */}
            <div className="border border-gray-100 rounded-xl p-6 min-h-[400px]">
              <Routes>
                <Route index                       element={<AccountDetailsTab />}  />
                <Route path="solar-history"        element={<SolarHistoryTab />}    />
                <Route path="orders"               element={<TrackOrderTab />}      />
                <Route path="orders/:orderId"      element={<OrderDetail />}        />
                <Route path="support"              element={<SupportTickets />}     />
                <Route path="support/:ticketNumber" element={<SupportTicketDetail />} />
                <Route path="saved-cart"           element={<SavedCartTab />}       />
                <Route path="security"             element={<AccountManagement />}        />
                <Route path="payment"              element={<PaymentSettings />}        />
                <Route path="cookies"              element={<CookieSettings />}        />
              </Routes>
            </div>
          </main>

        </div>
      </div>
    </div>
  );
};

export default AccountPage;