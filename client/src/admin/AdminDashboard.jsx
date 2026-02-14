import { useState, useEffect, useRef } from 'react';
import { setAuthToken, PAGES } from './utils/api.js';
import { LoginScreen } from './pages/Login.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { TopBar } from './components/TopBar.jsx';
import { PageEditor } from './pages/PageEditor.jsx';
import ProductCatalogPage from "./pages/ProductCatalog.jsx"
import { BlogManagerPage } from './pages/BlogManager.jsx';
import { SettingsPage } from './pages/Settings.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AdminDashboard() {
  const [token, setToken]           = useState(localStorage.getItem('adminToken') || '');
  const [activeNav, setActiveNav]   = useState('pages');
  const [activePageId, setActivePageId] = useState('page-home');

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
    localStorage.removeItem('adminToken');
    setToken('');
    setAuthToken('');
  };

  const handleHasChanges = (changed) => {
    setPageChanges(prev => ({ ...prev, [activePageId]: changed }));
  };

  const handleSave = () => {
    if (saveRef.current) saveRef.current();
  };

  const handlePreview = () => {
    const page = PAGES.find(p => p.id === activePageId);
    if (page) window.open(`${window.location.origin}/${page.slug}`, '_blank');
  };

  if (!token) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div
      className="h-screen flex bg-stone-50 overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&family=Instrument+Serif:ital@0;1&display=swap"
        rel="stylesheet"
      />

      {/* Sidebar */}
      <Sidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        activePageId={activePageId}
        setActivePageId={setActivePageId}
        pageChanges={pageChanges}
        onLogout={logout}
        onPreview={handlePreview}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          activeNav={activeNav}
          activePageId={activePageId}
          hasChanges={hasChanges}
          saving={false}
          onSave={handleSave}
          onPreview={handlePreview}
        />

        <main className="flex-1 overflow-hidden">
          {activeNav === 'pages' && (
            <PageEditor
              key={activePageId}
              pageId={activePageId}
              onHasChanges={handleHasChanges}
              onSaveRef={saveRef}
            />
          )}
          {activeNav === 'products' && <ProductCatalogPage token={token}/>}
          {activeNav === 'blog'     && <BlogManagerPage />}
          {activeNav === 'settings' && <SettingsPage />}
        </main>
      </div>

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        toastStyle={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px',
          fontWeight: 600,
          borderRadius: '14px',
          border: '1px solid #e7e5e4',
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
        }}
        closeButton={false}
      />
    </div>
  );
}
