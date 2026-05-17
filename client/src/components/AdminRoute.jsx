import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export const AdminRoute = ({ children }) => {
  const { isLoggedIn, user, loading } = useAuth();

  // 🔄 While checking auth → show loader
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F9]">
        <div className="w-7 h-7 border-2 border-[#FFAA14] border-t-transparent rounded-full animate-spin" />
        <p className="ml-3 text-sm text-gray-600">Checking access...</p>
      </div>
    );
  }

  // ❌ CASE 1: User is logged in BUT not admin → block
  if (isLoggedIn && user && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // ✅ CASE 2: Not logged in → allow (admin might be logging in)
  if (!isLoggedIn || !user) {
    return children;
  }

  // ✅ CASE 3: Admin → allow
  if (user.role === "admin") {
    return children;
  }

  return null;
};

export default AdminRoute;