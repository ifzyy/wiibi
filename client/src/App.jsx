// ─────────────────────────────────────────────────────────────────────────────
// App.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { CalculatorModalProvider } from "./context/CalculatorModalContext.jsx";
import Navigation from "./Nav";
import Footer from "./Footer";
import CartDrawer from "./components/CartDrawer.jsx";
import FloatingSupport from "./components/FloatingSupport.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
// Public pages
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ServicesPage from "./pages/ServicesPage";
import ContactPage from "./pages/ContactPage";
import BlogPage from "./pages/BlogPage";
import BlogDetailPage from "./pages/BlogDetailPage";
import SupportPage from "./pages/SupportPage.jsx";
import StorePage from "./pages/StorePage";
import ProductDetailPage from "./pages/ProductDetailPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import OrderDetail from "./pages/settings/OrderDetail.jsx";
import AccountPage from "./pages/AccountPage.jsx";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import SolarCalculatorPage from "./pages/SolarCalculator/SolarCalculatorPage";
import GoogleCallbackPage from "./pages/GoogleCallbackPage.jsx";
import OneTapProvider from "./components/OneTapProvider.jsx";
import usePageTracking from "./hooks/usePageTracking.js";
import { useEffect } from "react";
import { useAuth } from "./context/AuthContext.jsx";
import { hydrateConsent } from "./utils/cookieConsent.js";
// Admin — completely isolated from public context, and lazy-loaded so the
// entire dashboard (rich-text editor, drag-and-drop, admin pages) stays out
// of the public bundle. Public visitors never download it.
const AdminDashboard = lazy(() => import("./admin/AdminDashboard"));
// Records public page views for admin analytics. Must live inside
// BrowserRouter; renders nothing. Also mirrors a logged-in user's saved
// cookie consent into localStorage so site-wide gating reflects their choice.
const PageTracker = () => {
  const { user } = useAuth();
  useEffect(() => {
    if (user?.cookieConsent) hydrateConsent(user.cookieConsent);
  }, [user?.cookieConsent]);
  usePageTracking();
  return null;
};

// Option A admin subdomain: the same build is served on admin.wiibienergy.com.
// When we're on an "admin." host, send every non-/admin path straight to the
// dashboard so the subdomain behaves as an admin-only entrypoint. On the public
// host (and localhost) this is a no-op.
const isAdminHost =
  typeof window !== "undefined" && window.location.hostname.startsWith("admin.");

const AdminHostRedirect = () => {
  const { pathname } = useLocation();
  if (isAdminHost && !pathname.startsWith("/admin")) {
    return <Navigate to="/admin" replace />;
  }
  return null;
};

const PublicLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col">
    <Navigation />
    <main className="flex-grow">{children}</main>
    <Footer />
    <CartDrawer />
    <FloatingSupport />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <CalculatorModalProvider>
          <OneTapProvider />
          <PageTracker />
          <AdminHostRedirect />
          <Routes>
            {/* ── Public site ─────────────────────────────────────────────── */}
            <Route
              path="/*"
              element={
                <PublicLayout>
                
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/support" element={<SupportPage />} />
                    <Route path="/blog" element={<BlogPage />} />
                    <Route path="/blog/:slug" element={<BlogDetailPage />} />
                    <Route path="/projects" element={<ProjectsPage />} />
                      <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
                    <Route
                      path="/projects/:slug"
                      element={<ProjectDetailPage />}
                    />
                    <Route
                      path="/calculator"
                      element={<SolarCalculatorPage />}
                    />
                    <Route path="/store" element={<StorePage />} />
                    <Route
                      path="/store/:slug"
                      element={<ProductDetailPage />}
                    />
                    <Route path="/cart" element={<CartPage />} />

                    {/*
                    Checkout + Payment: guests are allowed.
                    ProtectedRoute with allowGuest shows the page for everyone;
                    the backend enforces ownership via X-Guest-Token or JWT.
                  */}
                    <Route
                      path="/checkout"
                      element={
                        <ProtectedRoute allowGuest>
                          <CheckoutPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/payment"
                      element={
                        <ProtectedRoute allowGuest>
                          <PaymentPage />
                        </ProtectedRoute>
                      }
                    />

                    {/*
                    Single order view: accessible to the order owner.
                    Logged-in user: JWT proves ownership.
                    Guest: X-Guest-Token in localStorage proves ownership.
                    Neither: backend returns 404 and the page shows an error.
                    No ProtectedRoute wrapper — the page handles its own error state.
                  */}
                    <Route path="/orders/:orderId" element={<OrderDetail />} />

                    {/* Account — auth required, modal fires in-place */}
                    <Route
                      path="/account/*"
                      element={
                        <ProtectedRoute>
                          <AccountPage />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </PublicLayout>
              }
            />
            <Route
              path="/admin/*"
              element={
                <AdminRoute>
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-gray-500">Loading dashboard…</div>}>
                    <AdminDashboard />
                  </Suspense>
                </AdminRoute>
              }
            />
          </Routes>
          </CalculatorModalProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
