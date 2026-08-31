import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  const token = localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  
  const currentUser = user || storedUser;

  // If no token exists, redirect to login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Check role authorization if roles are required
  if (allowedRoles) {
    const userRole = String(currentUser?.role || "").toLowerCase();
    const isAllowed = allowedRoles.map(r => r.toLowerCase()).includes(userRole);
    
    if (!isAllowed) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}