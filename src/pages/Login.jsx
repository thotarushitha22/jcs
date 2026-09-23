import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const justRegistered = location.state?.justRegistered;
  const initialRole = location.state?.accountType || "customer";

  const [selectedRole, setSelectedRole] = useState(
    initialRole === "merchant" || initialRole === "seller" ? "merchant" : "customer"
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const roleConfig = {
    customer: {
      title: "Welcome Back!",
      subtitle: "Access wholesale pricing as a verified retailer.",
      placeholder: "you@business.com",
      buttonText: "Login as Customer",
    },
    merchant: {
      title: "Merchant Portal",
      subtitle: "Login to manage your JCSGlobal store",
      placeholder: "merchant@jcsglobal.com",
      buttonText: "Login as Merchant",
    },
  };

  const currentConfig = roleConfig[selectedRole];

  const validate = () => {
    if (!email.trim()) return "Please enter your email address.";
    if (!EMAIL_RE.test(email.trim())) return "That doesn't look like a valid email address.";
    if (!password) return "Please enter your password.";
    return null;
  };

  const switchRole = (role) => {
    setSelectedRole(role);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const res = await login({ email: email.trim(), password });
      const loggedInUser =
        res?.user ||
        res?.data?.user ||
        res ||
        JSON.parse(localStorage.getItem("user") || "{}");

      const userRole = String(loggedInUser?.role || "").toLowerCase();
      const userEmail = String(loggedInUser?.email || email).toLowerCase();

      const isMerchant = ["merchant", "seller", "vendor", "business", "store"].includes(userRole);
      const isAdmin = userEmail === "thotarushitha22@gmail.com" || userRole === "admin";

      if (selectedRole === "customer") {
        if (isAdmin) {
          logout();
          throw new Error("Admin accounts cannot log in through the customer portal.");
        }
        if (isMerchant) {
          logout();
          throw new Error("You have a Merchant account. Please use the Merchant tab to log in.");
        }
      }

      if (selectedRole === "merchant") {
        if (isAdmin) {
          logout();
          throw new Error("Admin accounts cannot log in through the merchant portal.");
        }
        if (!isMerchant) {
          logout();
          throw new Error("This account is not registered as a merchant. Please use the Customer tab.");
        }
      }

      if (selectedRole === "merchant") {
        navigate("/merchant");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Login error:", err);
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
    <div className="auth-split-container">
      {/* LEFT SIDE: Vibrant Blue Branding Panel */}
      <div className="auth-left-pane">
        <div className="brand-header-area">
          <span className="brand-logo-icon">▲</span>
          <span className="brand-logo-text">JCS GLOBAL</span>
        </div>

        <div className="brand-center-area">
          <span className="brand-eyebrow">Access Made Effortless</span>
          <h1 className="brand-title">Secure Access.<br />Smarter Control.</h1>
          <div className="brand-divider"></div>
          <p className="brand-desc">
            Your trusted partner for global wholesale trade, electronics, and bulk distribution.
          </p>
        </div>

        <div className="floating-arrow-bubble">
          <span>→</span>
        </div>
      </div>

      {/* RIGHT SIDE: Modern Clean Form Panel */}
      <div className="auth-right-pane">
        <div className="auth-card-wrapper">
          <div className="auth-top-nav">
            <span className="portal-tag">SECURE PORTAL</span>
            <Link to="/" className="back-home-link">← Back to store</Link>
          </div>

          <form className="auth-card-form" onSubmit={handleSubmit} noValidate>
            <div className="role-switcher-container">
              <span className="role-label-text">Login as</span>
              <div className="role-buttons-group">
                <button
                  type="button"
                  onClick={() => switchRole("customer")}
                  className={`role-btn ${selectedRole === "customer" ? "active" : ""}`}
                >
                  👤 Customer
                </button>
                <button
                  type="button"
                  onClick={() => switchRole("merchant")}
                  className={`role-btn ${selectedRole === "merchant" ? "active" : ""}`}
                >
                  🏪 Merchant
                </button>
              </div>
            </div>

            <h2 className="form-main-heading">{currentConfig.title}</h2>
            <p className="form-sub-heading">{currentConfig.subtitle}</p>

            {justRegistered && !error && (
              <p className="auth-success-alert">Account created successfully! Please sign in.</p>
            )}

            {error && <p className="auth-error-alert">{error}</p>}

            <div className="field-block">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={currentConfig.placeholder}
                autoComplete="email"
              />
            </div>

            <div className="field-block">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn-primary-action" disabled={loading}>
              {loading ? "Signing in…" : currentConfig.buttonText}
            </button>

            <p className="auth-switch-prompt">
              {selectedRole === "merchant" ? (
                <>Don't have a merchant account? <Link to="/register" state={{ defaultRole: "merchant" }}>Register as Merchant</Link></>
              ) : (
                <>New to JCSGlobal? <Link to="/register" state={{ defaultRole: "buyer" }}>Create an account</Link></>
              )}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}