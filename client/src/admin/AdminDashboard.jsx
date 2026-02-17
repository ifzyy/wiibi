import { useState, useEffect, useRef } from "react";
import { setAuthToken, PAGES } from "./utils/api.js";
import { LoginScreen } from "./pages/Login.jsx";
import { Sidebar } from "./components/Sidebar.jsx";
import { TopBar } from "./components/TopBar.jsx";
import ProductCatalogPage from "./pages/ProductCatalog.jsx";
import { BlogManagerPage } from "./pages/BlogManager.jsx";
import { SettingsPage } from "./pages/Settings.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import HomePageEditor from "./pages/HomepageEditor.jsx";
import ContactPageEditor from "./pages/ContactPageEditor.jsx";
import AboutPageEditor from "./pages/AboutPageEditor.jsx";
import ProjectsManager from "./pages/ProjectsManager.jsx";
import FAQsManager from "./pages/FAQsManager.jsx";

export default function AdminDashboard() {
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "");
  const [activeNav, setActiveNav] = useState("pages");
  const [activePageId, setActivePageId] = useState("page-home");

  // Track unsaved changes per page
  const [pageChanges, setPageChanges] = useState({});
  const saveRef = useRef(null);

  const hasChanges = !!pageChanges[activePageId];

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const handleLogin = (newToken) => {
    setToken(newToken);
    setAuthToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    setToken("");
    setAuthToken("");
  };

  const handleHasChanges = (changed) => {
    setPageChanges((prev) => ({ ...prev, [activePageId]: changed }));
  };

  const handleSave = () => {
    if (saveRef.current) saveRef.current();
  };

  const handlePreview = () => {
    const page = PAGES.find((p) => p.id === activePageId);
    if (page) window.open(`${window.location.origin}/${page.slug}`, "_blank");
  };

  if (!token) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div
      className="h-screen flex bg-slate-50 overflow-hidden"
      style={{ fontFamily: "'Inter', 'DM Sans', sans-serif" }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&display=swap"
        rel="stylesheet"
      />

      {/* Sidebar - Fixed, full height */}
      <Sidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        activePageId={activePageId}
        setActivePageId={setActivePageId}
        pageChanges={pageChanges}
        onLogout={logout}
        onPreview={handlePreview}
      />

      {/* Main content area - Fixed container with scrollable content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TopBar - Fixed */}
        <TopBar
          activeNav={activeNav}
          activePageId={activePageId}
          hasChanges={hasChanges}
          saving={false}
          onSave={handleSave}
          onPreview={handlePreview}
        />

        {/* Main scrollable content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50">
          <div className="max-w-[1600px] mx-auto p-8">
            {activeNav === "pages" && (
              <>
                {activePageId === "page-home" && (
                  <HomePageEditor
                    onHasChanges={handleHasChanges}
                    onSaveRef={saveRef}
                    token={token}
                    key="home"
                  />
                )}
                {activePageId === "page-about" && (
                  <AboutPageEditor
                    onHasChanges={handleHasChanges}
                    onSaveRef={saveRef}
                    token={token}
                    key="about"
                  />
                )}
                {activePageId === "page-contact" && (
                  <ContactPageEditor
                    onHasChanges={handleHasChanges}
                    onSaveRef={saveRef}
                    token={token}
                    key="contact"
                  />
                )}
              </>
            )}
            {activeNav === "products" && <ProductCatalogPage token={token} />}
            {activeNav === "projects" && (
              <ProjectsManager
                activePageId={activePageId}
                onHasChanges={handleHasChanges}
                onSaveRef={saveRef}
                token={token}
              />
            )}
            {activeNav === "faqs" && (
              <FAQsManager
                activePageId={activePageId}
                onHasChanges={handleHasChanges}
                onSaveRef={saveRef}
                token={token}
              />
            )}
            {activeNav === "blog" && <BlogManagerPage />}
            {activeNav === "settings" && <SettingsPage />}
          </div>
        </main>
      </div>

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        toastStyle={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "13px",
          fontWeight: 600,
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
        }}
        closeButton={false}
      />
    </div>
  );
}