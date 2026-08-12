import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Headphones,
  ShoppingCart,
  UserRound,
  UserCircle,
  LogOut,
  PackagePlus,
  ShieldCheck,
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

  // Search text
  const [searchText, setSearchText] = useState("");

  // Account menu
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close account menu when clicking outside
  useEffect(() => {
    const onClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      onClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        onClickOutside
      );
    };
  }, []);

  // Search products
  const handleSearch = (e) => {
    e.preventDefault();

    const query = searchText.trim();

    // Do nothing when search is empty
    if (!query) {
      return;
    }

    // Go to products page with search text
    navigate(
      `/products?search=${encodeURIComponent(query)}`
    );

    // Optional: clear the search box
    // setSearchText("");
  };

  // Sign out
  const handleSignOut = () => {
    logout();
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <header className="nav">
      <div className="nav-topbar" />

      {/* =========================
          TOP ROW
      ========================= */}

      <div className="nav-row-top">

        {/* Logo and location */}

        <div className="nav-left">
          <Link
            to="/"
            className="brand"
          >
            <span className="brand-mark">
              JCS
            </span>

            <span className="brand-word">
              Global
            </span>
          </Link>

          <LocationPicker />
        </div>

        {/* =========================
            WORKING SEARCH BAR
        ========================= */}

        <div className="nav-search-wrap">

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

        {/* Language and account */}

        <div className="nav-right">

          <LanguagePicker />

          <div className="nav-account">

            {user ? (

              <Link to="/account">

                <small>
                  Welcome
                </small>

                <strong>
                  {user.email}
                </strong>

              </Link>

            ) : (

              <Link
                to="/login"
                className="btn btn-primary nav-btn"
              >
                Sign in
              </Link>

            )}

          </div>

        </div>

      </div>

      {/* =========================
          BOTTOM ROW
      ========================= */}

      <div className="nav-row-bottom">

        {/* Sell button */}

        <Link
          to="/sell"
          className="sell-pill"
        >
          <PackagePlus size={16} />

          Sell to JCSGlobal

        </Link>

        {/* Navbar icons */}

        <div className="nav-actions">

          {/* Support */}

          <Link
            to="/support"
            className="icon-btn"
            aria-label="Help and support"
          >
            <Headphones size={22} />
          </Link>

          {/* Cart */}

          <Link
            to="/cart"
            className="icon-btn cart-icon-btn"
            aria-label="Cart"
          >
            <ShoppingCart size={22} />

            {count > 0 && (
              <span className="cart-count">
                {count}
              </span>
            )}

          </Link>

          {/* Logged-in account */}

          {user ? (

            <div
              className="account-menu-wrap"
              ref={menuRef}
            >

              <button
                type="button"
                className="icon-btn"
                aria-label="Account menu"
                onClick={() =>
                  setMenuOpen((value) => !value)
                }
              >
                <UserRound size={22} />
              </button>

              {menuOpen && (

                <div className="account-menu">

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

                  {user?.role === "admin" && (

                    <Link
                      to="/admin"
                      className="account-menu-item"
                      onClick={() =>
                        setMenuOpen(false)
                      }
                    >
                      <ShieldCheck size={18} />

                      Admin

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

            <Link
              to="/login"
              className="icon-btn"
              aria-label="Sign in"
            >
              <UserRound size={22} />
            </Link>

          )}

        </div>

      </div>

    </header>
  );
}