import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./Nav";
import HomePage from "./pages/HomePage";
import Footer from "./Footer";
import AdminDashboard from "./admin/AdminDashboard";
import AboutPage from "./pages/AboutPage";
import ServicesPage from "./pages/ServicesPage";
import ContactPage from "./pages/ContactPage";
import BlogPage from "./pages/BlogPage";
import StorePage from "./pages/StorePage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import OrderManagement from "./admin/pages/OrderManagement";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes – full layout with Nav + Footer */}
        <Route
          path="/*"
          element={
            <div className="min-h-screen flex flex-col">
              <Navigation />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/store" element={<StorePage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route
                    path="/project/detail"
                    element={<ProjectDetailPage />}
                  />
                  {/* All other public pages go here when ready */}
                  {/* <Route path="/:slug" element={<DynamicPage />} /> */}
                  {/* <Route path="/store" element={<StorePage />} /> */}
                  {/* ... */}
                </Routes>
              </main>
              <Footer />
            </div>
          }
        />

        {/* Admin route – isolated, no Nav or Footer */}
        <Route path="/admin" element={<AdminDashboard />} />
<Route path="/order" element={<OrderManagement />} />
        {/* Optional: 404 for unmatched routes */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
