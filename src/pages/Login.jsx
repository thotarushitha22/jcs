import { useState } from "react";
import {
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { login, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const justRegistered =
    location.state?.justRegistered;

  const initialRole =
    location.state?.accountType ||
    "customer";

  const [selectedRole, setSelectedRole] =
    useState(
      initialRole === "merchant" ||
        initialRole === "seller"
        ? "merchant"
        : "customer"
    );

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState(null);

  const roleConfig = {
    customer: {
      title: "Customer Login",

      subtitle:
        "Access wholesale pricing as a verified retailer.",

      placeholder:
        "you@business.com",

      buttonText:
        "Login as Customer",
    },

    merchant: {
      title: "Merchant Login",

      subtitle:
        "Login to manage your JCSGlobal store",

      placeholder:
        "merchant@jcsglobal.com",

      buttonText:
        "Login as Merchant",
    },
  };

  const currentConfig =
    roleConfig[selectedRole];

  const validate = () => {
    if (!email.trim()) {
      return "Please enter your email address.";
    }

    if (!EMAIL_RE.test(email.trim())) {
      return "That doesn't look like a valid email address.";
    }

    if (!password) {
      return "Please enter your password.";
    }

    return null;
  };

  const switchRole = (role) => {
    setSelectedRole(role);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);

    const validationError =
      validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const res = await login({
        email: email.trim(),
        password,
      });

      /*
       * Support the different response structures
       * that your AuthContext may return.
       */
      const loggedInUser =
        res?.user ||
        res?.data?.user ||
        res ||
        JSON.parse(
          localStorage.getItem("user") ||
            "{}"
        );

      const userRole = String(
        loggedInUser?.role || ""
      ).toLowerCase();

      const userEmail = String(
        loggedInUser?.email || email
      ).toLowerCase();

      /*
       * Merchant / Seller role detection
       */
      const isMerchant = [
        "merchant",
        "seller",
        "vendor",
        "business",
        "store",
      ].includes(userRole);

      /*
       * Admin detection
       */
      const isAdmin =
        userEmail ===
          "thotarushitha22@gmail.com" ||
        userRole === "admin";

      /*
       * CUSTOMER LOGIN
       */
      if (selectedRole === "customer") {
        if (isAdmin) {
          logout();

          throw new Error(
            "Admin accounts cannot log in through the customer portal."
          );
        }

        if (isMerchant) {
          logout();

          throw new Error(
            "You have a Merchant account. Please use the Merchant tab to log in."
          );
        }
      }

      /*
       * MERCHANT LOGIN
       */
      if (selectedRole === "merchant") {
        if (isAdmin) {
          logout();

          throw new Error(
            "Admin accounts cannot log in through the merchant portal."
          );
        }

        if (!isMerchant) {
          logout();

          throw new Error(
            "This account is not registered as a merchant. Please use the Customer tab."
          );
        }
      }

      /*
       * Successful login navigation
       */
      if (selectedRole === "merchant") {
        navigate("/merchant");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error(
        "Login error:",
        err
      );

      logout();

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Something went wrong signing in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-container">

      {/* LEFT SIDE */}
      <div className="login-left-pane">
        <div className="login-brand-overlay">
          <h2>JCS Global</h2>

          <p>
            Your trusted partner for global
            wholesale trade, electronics, and
            bulk distribution.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="login-right-pane">
        <div className="login-card-wrapper">

          {/* Top Navigation */}
          <div className="login-top-nav">

            <span className="login-brand-tag">
              Secure Portal
            </span>

            <Link
              to="/"
              className="back-home-link"
            >
              ← Back to store
            </Link>
          </div>

          {/* Login Form */}
          <form
            className="auth-card"
            onSubmit={handleSubmit}
            noValidate
          >

            {/* Role Switcher */}
            <div
              style={{
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  color: "#666",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Login as
              </span>

              <div
                style={{
                  display: "inline-flex",
                  background: "#f1f3f5",
                  padding: "4px",
                  borderRadius: "8px",
                  gap: "4px",
                }}
              >

                {/* Customer */}
                <button
                  type="button"
                  onClick={() =>
                    switchRole("customer")
                  }
                  style={{
                    padding:
                      "6px 16px",
                    border: "none",
                    background:
                      selectedRole ===
                      "customer"
                        ? "#fff"
                        : "transparent",
                    boxShadow:
                      selectedRole ===
                      "customer"
                        ? "0 2px 4px rgba(0,0,0,0.1)"
                        : "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight:
                      selectedRole ===
                      "customer"
                        ? "600"
                        : "400",
                    fontSize: "13px",
                  }}
                >
                  👤 Customer
                </button>

                {/* Merchant */}
                <button
                  type="button"
                  onClick={() =>
                    switchRole("merchant")
                  }
                  style={{
                    padding:
                      "6px 16px",
                    border: "none",
                    background:
                      selectedRole ===
                      "merchant"
                        ? "#fff"
                        : "transparent",
                    boxShadow:
                      selectedRole ===
                      "merchant"
                        ? "0 2px 4px rgba(0,0,0,0.1)"
                        : "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight:
                      selectedRole ===
                      "merchant"
                        ? "600"
                        : "400",
                    fontSize: "13px",
                  }}
                >
                  🏪 Merchant
                </button>

              </div>
            </div>

            {/* Heading */}
            <h1>
              {currentConfig.title}
            </h1>

            <p className="auth-sub">
              {currentConfig.subtitle}
            </p>

            {/* Registration Success */}
            {justRegistered &&
              !error && (
                <p
                  className="auth-success"
                  style={{
                    color: "green",
                    marginBottom: "15px",
                    fontSize: "14px",
                  }}
                >
                  Account created
                  successfully! Please sign
                  in.
                </p>
              )}

            {/* Error */}
            {error && (
              <p className="auth-error">
                {error}
              </p>
            )}

            {/* Email */}
            <div className="field">
              <label>
                Email *
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                placeholder={
                  currentConfig.placeholder
                }
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="field">
              <label>
                Password *
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading
                ? "Signing in…"
                : currentConfig.buttonText}
            </button>

            {/* Register Link */}
            <p className="auth-switch">

              {selectedRole ===
                "merchant" && (
                <>
                  Don't have a merchant
                  account?{" "}

                  <Link
                    to="/register"
                    state={{
                      defaultRole:
                        "merchant",
                    }}
                  >
                    Register as Merchant
                  </Link>
                </>
              )}

              {selectedRole ===
                "customer" && (
                <>
                  New to JCSGlobal?{" "}

                  <Link
                    to="/register"
                    state={{
                      defaultRole:
                        "buyer",
                    }}
                  >
                    Create an account
                  </Link>
                </>
              )}

            </p>

          </form>
        </div>
      </div>
    </div>
  );
}