import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
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
import Admin from "./pages/Admin";
import OrderReports from "./pages/OrderReports";
import AccountInfo from "./pages/AccountInfo";
import KycDocuments from "./pages/KycDocuments";
import MyAddress from "./pages/MyAddress";
import Policies from "./pages/Policies";

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
            <Route path="/admin" element={<Admin />} />
            <Route path="/account/:section" element={<AccountStub />} />
          </Routes>
          <Footer />
          <Toaster position="top-right" />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}