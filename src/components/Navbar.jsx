import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Headphones,
  ShoppingCart,
  UserRound,
  UserCircle,
  LogOut,
  PackagePlus,
  ShieldCheck,
  Store,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import LocationPicker from "./LocationPicker";
import LanguagePicker from "./LanguagePicker";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Initialize input state from URL search parameter so it persists when typing/reloading
  const [searchText, setSearchText] = useState(searchParams.get("search") || "");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUser = user || storedUser;
  const userRole = String(currentUser?.role || "").toLowerCase();
  const userEmail = String(currentUser?.email || "").toLowerCase();
  
  const isMerchant = userRole === "merchant" || userRole === "seller";
  
  // STRICT OVERRIDE: Only thotarushitha22@gmail.com can ever be admin
  const isAdmin = userEmail === "thotarushitha22@gmail.com";

  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchText.trim();
    // Navigate to the home page with the search query parameter
    if (query) {
      navigate(`/?search=${encodeURIComponent(query)}`);
    } else {
      navigate(`/`);
    }
  };

  const handleSignOut = () => {
    logout();
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <header className="nav">
      <div className="nav-topbar" />

      <div className="nav-row-top">
        <div className="nav-left">
          <Link to="/" className="brand">
            <span className="brand-mark">JCS</span>
            <span className="brand-word">Global</span>
          </Link>
          <LocationPicker />
        </div>

        <div className="nav-search-wrap">
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

        <div className="nav-right">
          <LanguagePicker />
          <div className="nav-account">
            {currentUser?.email ? (
              <Link to="/account">
                <small>Welcome</small>
                <strong>{currentUser.email}</strong>
              </Link>
            ) : (
              <Link to="/login" className="btn btn-primary nav-btn">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="nav-row-bottom">
        <Link
          to={isMerchant ? "/merchant" : isAdmin ? "/admin" : "/sell"}
          className="sell-pill"
        >
          <PackagePlus size={16} />
          {isMerchant
            ? "Merchant Dashboard"
            : isAdmin
            ? "Admin Control"
            : "Sell to JCSGlobal"}
        </Link>

        <div className="nav-actions">
          <Link to="/support" className="icon-btn" aria-label="Help and support">
            <Headphones size={22} />
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
                aria-label="Account menu"
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                <UserRound size={22} />
              </button>

              {menuOpen && (
                <div className="account-menu">
                  <Link
                    to="/account"
                    className="account-menu-item"
                    onClick={() => setMenuOpen(false)}
                  >
                    <UserCircle size={18} />
                    My Account
                  </Link>

                  {isMerchant && (
                    <Link
                      to="/merchant"
                      className="account-menu-item"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Store size={18} />
                      Merchant Dashboard
                    </Link>
                  )}

                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="account-menu-item"
                      onClick={() => setMenuOpen(false)}
                    >
                      <ShieldCheck size={18} />
                      Admin Dashboard
                    </Link>
                  )}

                  <button
                    type="button"
                    className="account-menu-item"
                    onClick={handleSignOut}
                  >
                    <LogOut size={18} />
                    Sign Out
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