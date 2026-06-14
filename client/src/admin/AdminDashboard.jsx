import { useState, useEffect, useRef, useCallback } from "react";
import { io }               from "socket.io-client";
import { toast as toastify } from "react-toastify";
import { api }              from "../utils/api.js";
import { PAGES }            from "./utils/api.js";
import { LoginScreen }      from "./pages/Login.jsx";
import { Sidebar }          from "./components/Sidebar.jsx";
import Header               from "./components/Header.jsx";
import { Topbar }           from "./components/TopBar.jsx";
import { ToastContainer }   from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ── Page components ───────────────────────────────────────────────────────────
import ProductCatalogPage   from "./pages/ProductCatalog/ProductCatalog.jsx";
import BlogManager          from "./pages/BlogManagerPage/BlogManager.jsx";
import { SettingsPage }     from "./pages/Settings.jsx";
import HomePageEditor       from "./pages/HomePageEditor/HomePageEditor.jsx";
import ContactPageEditor    from "./pages/ContactPageEditor/ContactPageEditor.jsx";
import AboutPageEditor      from "./pages/AboutPageEditor/AboutPageEditor.jsx";
import ProjectsManager      from "./pages/ProjectsManager.jsx";
import FAQsManager          from "./pages/FAQsManager.jsx";
import ServicesPageEditor   from "./pages/ServicesPageEditor/ServicePageEditor.jsx";
import BlogPageEditor       from "./pages/BlogPageEditor/BlogPageEditor.jsx";
import ProjectEditorPage    from "./pages/ProjectEditor/ProjectEditorPage.jsx";
import StorePageEditor      from "./pages/StorePageEditor/StorePage.jsx";
import OMS                  from "./pages/OrderManagementSystem/index.jsx";
import RefundReturnsPage    from "./RefundsReturnPage.jsx";
import RequestForm          from "./pages/RequestForm/RequestForm.jsx";
import AnalyticsDashboard   from "./pages/AnalyticsDashboard/index.jsx";
import CustomersCRM         from "./pages/CustomersCRM/index.jsx";
import LeadsCRM             from "./pages/LeadsCRM/index.jsx";
import PaymentsAdmin        from "./pages/PaymentsAdmin/index.jsx";
import Promotions           from "./pages/Promotions/index.jsx";
import SupportDesk          from "./pages/SupportDesk/index.jsx";

// ── Constants ─────────────────────────────────────────────────────────────────
const PAGE_LABELS = {
  analytics: "Analytics",  customers: "Customers",
  leads:     "Leads",
  payments:  "Payments",   support:   "Support",
  products:  "Inventory",  orders:    "Orders",
  refunds:   "Refunds",    promotions: "Promotions",
  blog:      "Blog",
  projects:  "Projects",   faqs:      "FAQs",
  forms:     "Forms",      settings:  "Settings",
  pages:     "Page Editor",
};

// ── Auth states ────────────────────────────────────────────────────────────────
const CHECKING        = "checking";
const ADMIN           = "admin";
const NOT_ADMIN       = "not_admin";
const UNAUTHENTICATED = "unauthenticated";

const verifyAdmin = async (signal) => {
  const res  = await api.get("/users/me", { signal });
  const user = res.data?.data ?? res.data;
  if (!user?.role) throw new Error("no_session");
  if (user.role !== "admin") throw new Error("not_admin");
  return user;
};

// ── Full-screen spinner ───────────────────────────────────────────────────────
const Spinner = () => (
  <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F5F5F3" }}>
    <div style={{ width: 28, height: 28, border: "3px solid #FFAA14", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ── Not-authorised screen ─────────────────────────────────────────────────────
const NotAuthorised = ({ onLogout }) => (
  <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#F5F5F3", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
    <div style={{ fontSize: 36, marginBottom: 16 }}>🔒</div>
    <h1 style={{ fontSize: 18, fontWeight: 700, color: "#1A1102", margin: "0 0 8px" }}>Access denied</h1>
    <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 24px" }}>Your account does not have admin privileges.</p>
    <button
      onClick={onLogout}
      style={{ padding: "8px 20px", background: "#1A1102", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
    >
      Sign out
    </button>
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [authState,    setAuthState]    = useState(CHECKING);
  const [activeNav,    setActiveNav]    = useState("analytics");
  const [activePageId, setActivePageId] = useState("page-home");
  const [pageChanges,  setPageChanges]  = useState({});
  const [badges,       setBadges]       = useState({ orders: 0, support: 0, leads: 0 });
  const saveRef   = useRef(null);
  const socketRef = useRef(null);

  const hasChanges = !!pageChanges[activePageId];

  // ── Initial auth check ──────────────────────────────────────────────────────
  useEffect(() => {
    const ctrl = new AbortController();
    verifyAdmin(ctrl.signal)
      .then(() => setAuthState(ADMIN))
      .catch((e) => {
        if (e.name === "CanceledError") return;
        setAuthState(e.message === "not_admin" ? NOT_ADMIN : UNAUTHENTICATED);
      });
    return () => ctrl.abort();
  }, []);

  // ── Forced logout from interceptor ─────────────────────────────────────────
  useEffect(() => {
    const handler = () => setAuthState(UNAUTHENTICATED);
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, []);

  // ── Badge counts — fetch on mount, refresh every 60s ───────────────────────
  useEffect(() => {
    if (authState !== ADMIN) return;

    const fetchBadges = async () => {
      try {
        const [ordersRes, supportRes, leadsRes] = await Promise.allSettled([
          api.get("/admin/payments/stats"),
          api.get("/admin/support/stats"),
          api.get("/admin/solar/leads", { params: { status: "new", page: 1, limit: 1 } }),
        ]);
        const orderCount   = ordersRes.status   === "fulfilled" ? (ordersRes.value.data?.data?.counts?.unpaid   ?? 0) : 0;
        const supportCount = supportRes.status  === "fulfilled" ? (supportRes.value.data?.data?.byStatus?.open  ?? 0) : 0;
        const leadCount    = leadsRes.status    === "fulfilled" ? (leadsRes.value.data?.pagination?.total       ?? 0) : 0;
        setBadges({ orders: orderCount, support: supportCount, leads: leadCount });
      } catch { /* non-fatal */ }
    };

    fetchBadges();
    const interval = setInterval(fetchBadges, 60_000);
    return () => clearInterval(interval);
  }, [authState]);

  // ── WebSocket ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authState !== ADMIN) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket = io(
      import.meta.env.VITE_WS_URL ?? "http://localhost:5000",
      { withCredentials: true }
    );

    socket.on("connect",       () => socket.emit("join:admin"));
    socket.on("connect_error", () => { /* silent */ });

    socket.on("live:order", (data) => {
      if (data.type === "paid") {
        const amt = parseFloat(data.amount ?? 0).toLocaleString("en-NG");
        toastify.success(`New order paid · ${data.orderNumber} · ₦${amt}`);
        setBadges(b => ({ ...b, orders: b.orders + 1 }));
      }
    });

    socket.on("live:ticket", (data) => {
      if (data.type === "created") {
        toastify.info(`New ticket · ${data.ticketNumber}`);
        setBadges(b => ({ ...b, support: b.support + 1 }));
      }
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [authState]);

  // ── Login handler (called by LoginScreen after POST succeeds) ───────────────
  const handleLogin = useCallback(async () => {
    try {
      await verifyAdmin();
      setAuthState(ADMIN);
    } catch (e) {
      setAuthState(e.message === "not_admin" ? NOT_ADMIN : UNAUTHENTICATED);
    }
  }, []);

  // ── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try { await api.post("/auth/logout-all"); } catch {}
    localStorage.removeItem("isLoggedIn");
    setAuthState(UNAUTHENTICATED);
  };

  // ── Page editor helpers ─────────────────────────────────────────────────────
  const handleHasChanges = (changed) =>
    setPageChanges(prev => ({ ...prev, [activePageId]: changed }));

  const handleSave    = () => { if (saveRef.current) saveRef.current(); };
  const handlePreview = () => {
    const page = PAGES?.find(p => p.id === activePageId);
    if (page) window.open(`${window.location.origin}/${page.slug}`, "_blank");
  };

  // ── Render states ───────────────────────────────────────────────────────────
  if (authState === CHECKING)    return <Spinner />;
  if (authState === NOT_ADMIN)   return <NotAuthorised onLogout={handleLogout} />;

  if (authState === UNAUTHENTICATED) return (
    <>
      <LoginScreen onLogin={handleLogin} />
      <ToastContainer position="bottom-right" autoClose={3000} closeButton={false} />
    </>
  );

  // ADMIN — full shell
  const breadcrumb = PAGE_LABELS[activeNav] ?? "Dashboard";

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      overflow: "hidden",
      fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
      background: "#F5F5F3",
    }}>
      <Header
        breadcrumb={breadcrumb}
        hasChanges={hasChanges}
        onSave={handleSave}
        onPreview={handlePreview}
      />

      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        <Sidebar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          onLogout={handleLogout}
          onPreview={handlePreview}
          badges={badges}
        />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
          {activeNav === "pages" && (
            <Topbar
              activePageId={activePageId}
              setActivePageId={setActivePageId}
              pageChanges={pageChanges}
            />
          )}

          <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden", background: "#F5F5F3" }}>

            {/* ── New dashboard modules ── */}
            {activeNav === "analytics" && <AnalyticsDashboard />}
            {activeNav === "customers" && <CustomersCRM />}
            {activeNav === "leads"     && <LeadsCRM />}
            {activeNav === "payments"  && <PaymentsAdmin />}
            {activeNav === "support"   && <SupportDesk />}

            {/* ── Existing sections ── */}
            {activeNav === "products" && <ProductCatalogPage />}
            {activeNav === "orders"   && <OMS />}
            {activeNav === "refunds"  && <RefundReturnsPage />}
            {activeNav === "promotions" && <Promotions />}
            {activeNav === "blog"     && <BlogManager />}
            {activeNav === "forms"    && <RequestForm />}
            {activeNav === "settings" && <SettingsPage />}
            {activeNav === "faqs"     && <FAQsManager       activePageId={activePageId} onHasChanges={handleHasChanges} onSaveRef={saveRef} />}
            {activeNav === "projects" && <ProjectsManager   activePageId={activePageId} onHasChanges={handleHasChanges} onSaveRef={saveRef} />}
            {activeNav === "project-editor" && <ProjectEditorPage onBack={() => setActiveNav("projects")} onHasChanges={handleHasChanges} onSaveRef={saveRef} />}

            {/* ── Page editors ── */}
            {activeNav === "pages" && (
              <>
                {activePageId === "page-home"     && <HomePageEditor     onHasChanges={handleHasChanges} onSaveRef={saveRef} key="home"     />}
                {activePageId === "page-store"    && <StorePageEditor    onHasChanges={handleHasChanges} onSaveRef={saveRef} key="store"    />}
                {activePageId === "page-about"    && <AboutPageEditor    onHasChanges={handleHasChanges} onSaveRef={saveRef} key="about"    />}
                {activePageId === "page-contact"  && <ContactPageEditor  onHasChanges={handleHasChanges} onSaveRef={saveRef} key="contact"  />}
                {activePageId === "page-services" && <ServicesPageEditor onHasChanges={handleHasChanges} onSaveRef={saveRef} key="services" />}
                {activePageId === "page-blog"     && <BlogPageEditor     onHasChanges={handleHasChanges} onSaveRef={saveRef} key="blog"     />}
              </>
            )}
          </main>
        </div>
      </div>

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        closeButton={false}
        toastStyle={{
          fontFamily: "'DM Sans', 'Inter', sans-serif",
          fontSize: "13px", fontWeight: 600,
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
        }}
      />
    </div>
  );
}
