// ─────────────────────────────────────────────────────────────────────────────
// admin/AdminDashboard.jsx  — drop-in replacement
//
// Fixes:
//  1. Reload issue: onLogin now re-verifies /users/me before setting authed=true
//     so the UI never briefly shows the wrong state after sign-in.
//  2. auth:logout event clears authed immediately — no reload needed on logout.
//  3. Removed external AdminRoute wrapper dependency — dashboard owns its auth.
//  4. Added orders nav item wired to OMS.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from "react";
import { api }              from "../utils/api.js";
import { PAGES }            from "./utils/api.js";
import { LoginScreen }      from "./pages/Login.jsx";
import { Sidebar }          from "./components/Sidebar.jsx";
import ProductCatalogPage   from "./pages/ProductCatalog/ProductCatalog.jsx";
import BlogManager          from "./pages/BlogManagerPage/BlogManager.jsx";
import { SettingsPage }     from "./pages/Settings.jsx";
import { ToastContainer }   from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import HomePageEditor       from "./pages/HomePageEditor/HomePageEditor.jsx";
import ContactPageEditor    from "./pages/ContactPageEditor/ContactPageEditor.jsx";
import AboutPageEditor      from "./pages/AboutPageEditor/AboutPageEditor.jsx";
import ProjectsManager      from "./pages/ProjectsManager.jsx";
import FAQsManager          from "./pages/FAQsManager.jsx";
import ServicesPageEditor   from "./pages/ServicesPageEditor/ServicePageEditor.jsx";
import BlogPageEditor       from "./pages/BlogPageEditor/BlogPageEditor.jsx";
import Header               from "./components/Header.jsx";
import ProjectEditorPage    from "./pages/ProjectEditor/ProjectEditorPage.jsx";
import StorePageEditor      from "./pages/StorePageEditor/StorePage.jsx";
import { Topbar }           from "./components/TopBar.jsx";
import OMS                  from "./pages/OrderManagementSystem/index.jsx";
import RefundReturnsPage from "./RefundsReturnPage.jsx";
import DynamicRequestForm from "./pages/RequestForm/components/DynamicRequestForm.jsx";
import RequestForm from "./pages/RequestForm/RequestForm.jsx";
const PAGE_LABELS = {
  products: "Inventory",
  orders:   "Orders",
  blog:     "Blog",
  projects: "Projects",
  faqs:     "FAQs",
  settings: "Settings",
  pages:    "Page Editor",
};

/* ── verify helper — shared by mount check and post-login confirm ─────────── */
const verifyAdmin = async (signal) => {
  const res = await api.get("/users/me", { signal });
  const user = res.data?.data ?? res.data;
  if (user?.role !== "admin") throw new Error("Not an admin");
  return user;
};

export default function AdminDashboard() {
  const [authed,    setAuthed]    = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [activeNav,    setActiveNav]    = useState("products");
  const [activePageId, setActivePageId] = useState("page-home");
  const [pageChanges,  setPageChanges]  = useState({});
  const saveRef    = useRef(null);
  const hasChanges = !!pageChanges[activePageId];

  /* ── Initial auth check on mount ─────────────────────────────────────────── */
  useEffect(() => {
    const ctrl = new AbortController();
    verifyAdmin(ctrl.signal)
      .then(()  => setAuthed(true))
      .catch((err) => { if (err.name !== "CanceledError") setAuthed(false); })
      .finally(() => setVerifying(false));
    return () => ctrl.abort();
  }, []);

  /* ── Listen for logout events fired by the axios interceptor ─────────────── */
  useEffect(() => {
    const handler = () => setAuthed(false);
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, []);

  /* ── handleLogin — called by LoginScreen AFTER the login POST succeeds.
   *
   *  The reload problem: LoginScreen calls onLogin() right after POST /auth/login
   *  resolves. At that point the Set-Cookie header has been processed, but if we
   *  immediately set authed=true in React the component re-renders before the
   *  browser has committed the cookie. Then the next API call (e.g. loading OMS
   *  data) fires, the cookie isn't there yet, and we get a 401.
   *
   *  Fix: re-verify /users/me here. This forces one round-trip that can only
   *  succeed AFTER the cookie is committed, so by the time authed flips to true
   *  every subsequent request will have the cookie available.
   * ──────────────────────────────────────────────────────────────────────────── */
  const handleLogin = useCallback(async () => {
    try {
      await verifyAdmin();   // no signal needed — user just logged in
      setAuthed(true);
    } catch {
      // Login POST succeeded but /me failed — cookie not set correctly.
      // Keep LoginScreen visible so the user can try again.
      setAuthed(false);
    }
  }, []);

  /* ── Logout ───────────────────────────────────────────────────────────────── */
  const handleLogout = async () => {
    try { await api.post("/auth/logout-all"); } catch {}
    setAuthed(false);
  };

  /* ── Page editor helpers ──────────────────────────────────────────────────── */
  const handleHasChanges = (changed) =>
    setPageChanges(prev => ({ ...prev, [activePageId]: changed }));

  const handleSave    = () => { if (saveRef.current) saveRef.current(); };

  const handlePreview = () => {
    const page = PAGES?.find(p => p.id === activePageId);
    if (page) window.open(`${window.location.origin}/${page.slug}`, "_blank");
  };

  /* ── Loading spinner (initial verify in flight) ───────────────────────────── */
  if (verifying) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F5F5F3" }}>
      <div style={{ width: 28, height: 28, border: "3px solid #FFAA14", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const breadcrumb = PAGE_LABELS[activeNav] ?? "Dashboard";

  /* ── Shell ────────────────────────────────────────────────────────────────── */
  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
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
          activePageId={activePageId}
          setActivePageId={setActivePageId}
          pageChanges={pageChanges}
          onLogout={handleLogout}
          onPreview={handlePreview}
        />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

          {activeNav === "pages" && (
            <Topbar
              activePageId={activePageId}
              setActivePageId={setActivePageId}
              pageChanges={pageChanges}
            />
          )}

          <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden", minWidth: 0, background: "#F5F5F3" }}>

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

            {/* ── Other sections ── */}
            {activeNav === "products"       && <ProductCatalogPage />}
            {activeNav === "orders"         && <OMS />}
            {activeNav === "refunds" && <RefundReturnsPage />}
            {activeNav === "project-editor" && <ProjectEditorPage onBack={() => setActiveNav("projects")} onHasChanges={handleHasChanges} onSaveRef={saveRef} />}
            {activeNav === "projects"       && <ProjectsManager activePageId={activePageId} onHasChanges={handleHasChanges} onSaveRef={saveRef} />}
            {activeNav === "faqs"           && <FAQsManager     activePageId={activePageId} onHasChanges={handleHasChanges} onSaveRef={saveRef} />}
            {activeNav === "blog"           && <BlogManager />}
            {activeNav === "forms"          && <RequestForm />}
            {activeNav === "settings"       && <SettingsPage />}

          </main>
        </div>
      </div>

      {/* Login overlay — rendered over everything when not authed */}
      {!authed && <LoginScreen onLogin={handleLogin} />}

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        closeButton={false}
        toastStyle={{
          fontFamily: "'DM Sans', 'Inter', sans-serif",
          fontSize: "13px",
          fontWeight: 600,
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
        }}
      />
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// App.jsx  — updated admin routes section only
//
// Since AdminDashboard owns its own auth (LoginScreen overlay),
// no external AdminRoute wrapper is needed.
// Both /admin and /admin/* point to the same dashboard — it handles
// internal navigation via activeNav state.
// ─────────────────────────────────────────────────────────────────────────────

/*
  Replace your admin route block in App.jsx with this:

  <Route path="/admin"   element={<AdminDashboard />} />
  <Route path="/admin/*" element={<AdminDashboard />} />

  Remove:
  - import AdminRoute from './components/AdminRoute.jsx'
  - <Route path="/order" element={<OMS />} />   ← was unprotected, now inside dashboard
*/