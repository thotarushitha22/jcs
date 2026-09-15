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

  const [searchText, setSearchText] = useState(
    searchParams.get("search") || ""
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // STRICT SESSION CHECK
  const token = localStorage.getItem("token");

  const currentUser = token
    ? user || JSON.parse(localStorage.getItem("user") || "{}")
    : null;

  const userRole = String(currentUser?.role || "").toLowerCase();
  const userEmail = String(currentUser?.email || "").toLowerCase();

  const isMerchant =
    userRole === "merchant" || userRole === "seller";

  // STRICT ADMIN CHECK
  const isAdmin =
    token &&
    userEmail === "thotarushitha22@gmail.com" &&
    userRole === "admin";

  useEffect(() => {
    const onClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        onClickOutside
      );
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();

    const query = searchText.trim();

    if (query) {
      navigate(
        `/?search=${encodeURIComponent(query)}`
      );
    } else {
      navigate("/");
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

      {/* ================= TOP NAVBAR ================= */}
      <div className="nav-row-top">

        {/* BRAND + LOCATION */}
        <div className="nav-left">
          <Link to="/" className="brand">
            <span className="brand-mark">JCS</span>
            <span className="brand-word">Global</span>
          </Link>

          <LocationPicker />
        </div>

        {/* SEARCH */}
        <div
          className="nav-search-wrap"
          data-tour="search"
        >
          <form
            className="nav-search"
            onSubmit={handleSearch}
          >
            <Search size={20} />

            <input
              type="search"
              value={searchText}
              onChange={(e) =>
                setSearchText(e.target.value)
              }
              placeholder="Search by product name, brand, or SKU"
              aria-label="Search products"
            />
          </form>
        </div>

        {/* LANGUAGE + ACCOUNT */}
        <div className="nav-right">
          <LanguagePicker />

          <div className="nav-account">

            {currentUser?.email ? (
              <Link
                to="/account"
                data-tour="account"
              >
                <small>Welcome</small>

                <strong>
                  {currentUser.email}
                </strong>
              </Link>
            ) : (
              <Link
                to="/login"
                className="btn btn-primary nav-btn"
                data-tour="account"
              >
                Sign in
              </Link>
            )}

          </div>
        </div>
      </div>

      {/* ================= BOTTOM NAVBAR ================= */}
      <div className="nav-row-bottom">

        {/* SELL / MERCHANT / ADMIN */}
        <Link
          to={
            isMerchant
              ? "/merchant"
              : isAdmin
              ? "/admin"
              : "/sell"
          }
          className="sell-pill"
          data-tour="merchant"
        >
          <PackagePlus size={16} />

          {isMerchant
            ? "Merchant Dashboard"
            : isAdmin
            ? "Admin Control"
            : "Sell to JCSGlobal"}
        </Link>

        {/* NAV ACTIONS */}
        <div className="nav-actions">

          {/* SUPPORT */}
          <Link
            to="/support"
            className="icon-btn"
            aria-label="Help and support"
          >
            <Headphones size={22} />
          </Link>

          {/* CART */}
          <Link
            to="/cart"
            className="icon-btn cart-icon-btn"
            aria-label="Cart"
            data-tour="cart"
          >
            <ShoppingCart size={22} />

            {count > 0 && (
              <span className="cart-count">
                {count}
              </span>
            )}
          </Link>

          {/* ACCOUNT MENU */}
          {currentUser?.email ? (
            <div
              className="account-menu-wrap"
              ref={menuRef}
            >
              <button
                type="button"
                className="icon-btn"
                aria-label="Account menu"
                onClick={() =>
                  setMenuOpen((prev) => !prev)
                }
                data-tour="account"
              >
                <UserRound size={22} />
              </button>

              {menuOpen && (
                <div className="account-menu">

                  {/* MY ACCOUNT */}
                  <Link
                    to="/account"
                    className="account-menu-item"
                    onClick={() =>
                      setMenuOpen(false)
                    }
                  >
                    <UserCircle size={18} />
                    My Account
                  </Link>

                  {/* MERCHANT */}
                  {isMerchant && (
                    <Link
                      to="/merchant"
                      className="account-menu-item"
                      onClick={() =>
                        setMenuOpen(false)
                      }
                    >
                      <Store size={18} />
                      Merchant Dashboard
                    </Link>
                  )}

                  {/* ADMIN */}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="account-menu-item"
                      onClick={() =>
                        setMenuOpen(false)
                      }
                    >
                      <ShieldCheck size={18} />
                      Admin Dashboard
                    </Link>
                  )}

                  {/* SIGN OUT */}
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
            <Link
              to="/login"
              className="icon-btn"
              aria-label="Sign in"
              data-tour="account"
            >
              <UserRound size={22} />
            </Link>
          )}

        </div>
      </div>
    </header>
  );
}