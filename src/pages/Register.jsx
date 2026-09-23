import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z][Z][0-9A-Z]$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export default function Register() {
  const { register, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const defaultRole = location.state?.accountType || location.state?.defaultRole || "buyer";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: defaultRole === "merchant" || defaultRole === "seller" ? "merchant" : "buyer",
    gstNumber: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (location.state?.accountType || location.state?.defaultRole) {
      const incomingRole = location.state.accountType || location.state.defaultRole;
      setForm((f) => ({
        ...f,
        role: incomingRole === "merchant" || incomingRole === "seller" ? "merchant" : "buyer",
      }));
    }
  }, [location.state]);

  const update = (key) => (e) => {
    let value = e.target.value;
    if (key === "gstNumber") value = value.toUpperCase();
    setForm((f) => ({ ...f, [key]: value }));
    if (error) setError(null);
  };

  const setRoleTab = (selectedRole) => {
    setForm((f) => ({
      ...f,
      role: selectedRole,
      gstNumber: selectedRole === "buyer" ? "" : f.gstNumber,
    }));
    setError(null);
  };

  const validate = () => {
    if (!form.name.trim()) {
      return form.role === "merchant" ? "Please enter the merchant/business name." : "Please enter your name.";
    }
    if (!form.email.trim()) return "Please enter your email.";
    if (!EMAIL_RE.test(form.email.trim())) return "That doesn't look like a valid email address.";
    if (!form.password) return "Please choose a password.";
    if (!PASSWORD_RE.test(form.password)) {
      return "Password must be at least 8 characters and include 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.";
    }
    if (!form.confirmPassword) return "Please confirm your password.";
    if (form.password !== form.confirmPassword) return "Passwords don't match.";
    if (form.role === "merchant" && !form.gstNumber.trim()) return "GSTIN is required for a merchant account.";
    if (form.gstNumber.trim() && !GSTIN_RE.test(form.gstNumber.trim().toUpperCase())) {
      return "That GSTIN doesn't look valid. Example: 27ABCDE1234F1Z5";
    }
    return null;
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
      const { confirmPassword, ...payload } = form;
      await register({
        ...payload,
        name: payload.name.trim(),
        email: payload.email.trim(),
        gstNumber: payload.gstNumber.trim().toUpperCase(),
      });
      logout();
      navigate("/login", {
        state: { justRegistered: true, accountType: form.role },
      });
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Something went wrong creating your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const isMerchant = form.role === "merchant";

  return (
    <div className="auth-split-container">
      {/* LEFT SIDE: Vibrant Blue Branding Panel */}
      <div className="auth-left-pane">
        <div className="brand-header-area">
          <span className="brand-logo-icon">▲</span>
          <span className="brand-logo-text">JCS GLOBAL</span>
        </div>

        <div className="brand-center-area">
          <span className="brand-eyebrow">Join Our Network</span>
          <h1 className="brand-title">Create Account.<br />Expand Globally.</h1>
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
              <span className="role-label-text">Register as</span>
              <div className="role-buttons-group">
                <button
                  type="button"
                  onClick={() => setRoleTab("buyer")}
                  className={`role-btn ${form.role === "buyer" ? "active" : ""}`}
                >
                  👤 Customer
                </button>
                <button
                  type="button"
                  onClick={() => setRoleTab("merchant")}
                  className={`role-btn ${form.role === "merchant" ? "active" : ""}`}
                >
                  🏪 Merchant
                </button>
              </div>
            </div>

            <h2 className="form-main-heading">Create Account</h2>
            <p className="form-sub-heading">
              Create a buyer or merchant account to use JCSGlobal.
            </p>

            {error && <p className="auth-error-alert">{error}</p>}

            <div className="field-block">
              <label>
                {isMerchant ? "Merchant Name" : "Customer / User Name"} *
              </label>
              <input
                value={form.name}
                onChange={update("name")}
                placeholder={isMerchant ? "Enter merchant/business name" : "ABC Retail Pvt Ltd"}
                autoComplete="name"
              />
            </div>

            <div className="field-block">
              <label>Email Address *</label>
              <input
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder="you@business.com"
                autoComplete="email"
              />
            </div>

            <div className="field-block">
              <label>Password *</label>
              <input
                type="password"
                value={form.password}
                onChange={update("password")}
                placeholder="Enter a strong password"
                autoComplete="new-password"
              />
              <small className="helper-hint">
                Minimum 8 characters: 1 uppercase, 1 lowercase, 1 number, and 1 special character.
              </small>
            </div>

            <div className="field-block">
              <label>Confirm Password *</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={update("confirmPassword")}
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
            </div>

            {isMerchant && (
              <div className="field-block">
                <label>GSTIN *</label>
                <input
                  value={form.gstNumber}
                  onChange={update("gstNumber")}
                  placeholder="Enter your business GSTIN"
                  maxLength={15}
                />
                <small className="helper-hint">GSTIN is required for merchant accounts.</small>
              </div>
            )}

            <button type="submit" className="btn-primary-action" disabled={loading}>
              {loading
                ? "Creating account..."
                : isMerchant
                ? "Create Merchant Account"
                : "Create Customer Account"}
            </button>

            <p className="auth-switch-prompt">
              Already registered? <Link to="/login">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}