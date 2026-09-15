import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

import Navbar from "./components/Navbar";
import StockTicker from "./components/StockTicker";
import Footer from "./components/Footer";
import LiveTour from "./components/LiveTour";
import Chatbot from "./components/Chatbot";

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

// --------------------------------------------------
// Protected Route
// --------------------------------------------------
function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  const storedUser = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const currentUser = user || storedUser;
  const token = localStorage.getItem("token");

  // User must be logged in
  if (!token || !currentUser?.email) {
    return <Navigate to="/login" replace />;
  }

  const userRole = currentUser.role
    ? currentUser.role.toLowerCase()
    : "buyer";

  // Strict admin-only protection
  const isStrictAdminOnly =
    allowedRoles.length === 1 &&
    allowedRoles.includes("admin");

  if (isStrictAdminOnly && userRole !== "admin") {
    return <Navigate to="/" replace />;
  }

  // General role protection
  if (
    allowedRoles &&
    !allowedRoles
      .map((role) => role.toLowerCase())
      .includes(userRole)
  ) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// --------------------------------------------------
// Main Store Layout
// --------------------------------------------------
function MainStoreLayout() {
  return (
    <>
      <Navbar />

      <StockTicker />

      <Routes>
        {/* Home */}
        <Route
          path="/"
          element={<Home />}
        />

        {/* Products */}
        <Route
          path="/product/:id"
          element={<ProductDetail />}
        />

        {/* Cart */}
        <Route
          path="/cart"
          element={<Cart />}
        />

        {/* Checkout */}
        <Route
          path="/checkout"
          element={<Checkout />}
        />

        {/* Sell */}
        <Route
          path="/sell"
          element={<Sell />}
        />

        {/* Orders */}
        <Route
          path="/orders"
          element={<Orders />}
        />

        <Route
          path="/orders/:id"
          element={<OrderDetail />}
        />

        {/* Register */}
        <Route
          path="/register"
          element={<Register />}
        />

        {/* Support */}
        <Route
          path="/support"
          element={<Support />}
        />

        {/* Account */}
        <Route
          path="/account"
          element={<Account />}
        />

        <Route
          path="/account/notifications"
          element={<NotificationPreferences />}
        />

        <Route
          path="/account/order-reports"
          element={<OrderReports />}
        />

        <Route
          path="/account/info"
          element={<AccountInfo />}
        />

        <Route
          path="/account/kyc"
          element={<KycDocuments />}
        />

        <Route
          path="/account/address"
          element={<MyAddress />}
        />

        <Route
          path="/account/policies"
          element={<Policies />}
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* Merchant */}
        <Route
          path="/merchant"
          element={
            <ProtectedRoute
              allowedRoles={[
                "merchant",
                "admin",
                "seller",
              ]}
            >
              <MerchantDashboard />
            </ProtectedRoute>
          }
        />

        {/* Merchant Dashboard - alternate URL */}
        <Route
          path="/merchant-Dashboard"
          element={
            <ProtectedRoute
              allowedRoles={[
                "merchant",
                "admin",
                "seller",
              ]}
            >
              <MerchantDashboard />
            </ProtectedRoute>
          }
        />

        {/* Account sub-pages */}
        <Route
          path="/account/:section"
          element={<AccountStub />}
        />
      </Routes>

      <Footer />
    </>
  );
}

// --------------------------------------------------
// Main App
// --------------------------------------------------
export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>

          <Routes>

            {/* Login Page */}
            {/* Navbar and StockTicker are hidden on login */}
            <Route
              path="/login"
              element={<Login />}
            />

            {/* All other store pages */}
            <Route
              path="/*"
              element={<MainStoreLayout />}
            />

          </Routes>

          {/* Toast Notifications */}
          <Toaster position="top-right" />
<LiveTour />
<Chatbot />
         


        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}