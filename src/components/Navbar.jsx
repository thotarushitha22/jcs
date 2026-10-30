import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  UserRound,
  UserCircle,
  LogOut,
  ShieldCheck,
  Store,
  Heart,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [searchText, setSearchText] = useState(searchParams.get("search") || "");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const token = localStorage.getItem("token");
  const currentUser = token ? user || JSON.parse(localStorage.getItem("user") || "{}") : null;

  const userRole = String(currentUser?.role || "").toLowerCase();
  const userEmail = String(currentUser?.email || "").toLowerCase();

  const isMerchant = userRole === "merchant" || userRole === "seller";
  const isAdmin = token && userEmail === "thotarushitha22@gmail.com" && userRole === "admin";

  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    setSearchText(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchText.trim();
    if (query) {
      navigate(`/products?search=${encodeURIComponent(query)}`);
    } else {
      navigate("/products");
    }
  };

  const handleSignOut = () => {
    logout();
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <header className="nav">
      <div className="nav-row-top">
        {/* BRAND ONLY (Location Removed) */}
        <div className="nav-left">
          <Link to="/" className="brand">
            <span className="brand-mark">JCS</span>
            <span className="brand-word">Global</span>
          </Link>
        </div>

        {/* SEARCH */}
        <div className="nav-search-wrap" data-tour="search">
          <form className="nav-search" onSubmit={handleSearch}>
            <Search size={20} />
            <input
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by product name, brand, or SKU"
              aria-label="Search products"
            />
          </form>
        </div>

        {/* ICONS */}
        <div className="nav-actions">
          <Link to="/wishlist" className="icon-btn" aria-label="Wishlist">
            <Heart size={22} />
          </Link>

          <Link to="/cart" className="icon-btn cart-icon-btn" aria-label="Cart">
            <ShoppingCart size={22} />
            {count > 0 && <span className="cart-count">{count}</span>}
          </Link>

          {currentUser?.email ? (
            <div className="account-menu-wrap" ref={menuRef}>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                <UserRound size={22} />
              </button>

              {menuOpen && (
                <div className="account-menu">
                  <Link to="/account" className="account-menu-item" onClick={() => setMenuOpen(false)}>
                    <UserCircle size={18} /> My Account
                  </Link>
                  {isMerchant && (
                    <Link to="/merchant" className="account-menu-item" onClick={() => setMenuOpen(false)}>
                      <Store size={18} /> Merchant Dashboard
                    </Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin" className="account-menu-item" onClick={() => setMenuOpen(false)}>
                      <ShieldCheck size={18} /> Admin Dashboard
                    </Link>
                  )}
                  <button type="button" className="account-menu-item" onClick={handleSignOut}>
                    <LogOut size={18} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="icon-btn" aria-label="Sign in">
              <UserRound size={22} />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}