import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

import Navbar from "./components/Navbar";
import StockTicker from "./components/StockTicker";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Sell from "./pages/Sell";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Support from "./pages/Support";

import Account from "./pages/Account";
import NotificationPreferences from "./pages/NotificationPreferences";
import AccountStub from "./pages/AccountStub";
import AccountInfo from "./pages/AccountInfo";
import KycDocuments from "./pages/KycDocuments";
import MyAddress from "./pages/MyAddress";
import Policies from "./pages/Policies";
import OrderReports from "./pages/OrderReports";

import Admin from "./pages/Admin";
import MerchantDashboard from "./pages/MerchantDashboard";

// Role-based protection wrapper with console logging for troubleshooting
function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUser = user || storedUser;
  const token = localStorage.getItem('token');

  console.log("ProtectedRoute Check:", {
    tokenExists: !!token,
    userEmail: currentUser?.email,
    userRole: currentUser?.role,
    allowedRoles
  });

  if (!token || !currentUser?.email) {
    console.warn("Blocked: No token or user email found. Redirecting to login.");
    return <Navigate to="/login" replace />;
  }

  const userRole = currentUser.role ? currentUser.role.toLowerCase() : 'buyer';
  if (allowedRoles && !allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
    console.warn(`Blocked: User role '${userRole}' not allowed. Redirecting to home.`);
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Navbar />
          <StockTicker />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/sell" element={<Sell />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/support" element={<Support />} />

            <Route path="/account" element={<Account />} />
            <Route path="/account/notifications" element={<NotificationPreferences />} />
            <Route path="/account/order-reports" element={<OrderReports />} />
            <Route path="/account/info" element={<AccountInfo />} />
            <Route path="/account/kyc" element={<KycDocuments />} />
            <Route path="/account/address" element={<MyAddress />} />
            <Route path="/account/policies" element={<Policies />} />

            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Admin />
                </ProtectedRoute>
              } 
            />

            {/* Added both aliases to completely prevent path mismatch warnings */}
            <Route
              path="/merchant"
              element={
                <ProtectedRoute allowedRoles={['merchant', 'admin', 'seller']}>
                  <MerchantDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/merchant-dashboard"
              element={
                <ProtectedRoute allowedRoles={['merchant', 'admin', 'seller']}>
                  <MerchantDashboard />
                </ProtectedRoute>
              }
            />

            <Route path="/account/:section" element={<AccountStub />} />
          </Routes>

          <Footer />
          <Toaster position="top-right" />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}