import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z][Z][0-9A-Z]$/;

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
    role: defaultRole === "seller" ? "merchant" : defaultRole,
    gstNumber: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (location.state?.accountType || location.state?.defaultRole) {
      const incomingRole = location.state.accountType || location.state.defaultRole;
      setForm((f) => ({
        ...f,
        role: incomingRole === "seller" ? "merchant" : incomingRole,
      }));
    }
  }, [location.state]);

  const update = (key) => (e) => {
    setForm((f) => ({
      ...f,
      [key]: e.target.value,
    }));

    if (error) {
      setError(null);
    }
  };

  const setRoleTab = (selectedRole) => {
    setForm((f) => ({
      ...f,
      role: selectedRole,
      gstNumber: selectedRole === "buyer" ? "" : f.gstNumber,
    }));
    if (error) setError(null);
  };

  const validate = () => {
    if (!form.name.trim()) return "Please enter your business name.";
    if (!form.email.trim()) return "Please enter your email.";
    if (!EMAIL_RE.test(form.email.trim())) return "That doesn't look like a valid email address.";
    if (!form.password) return "Please choose a password.";
    if (form.password.length < 6) return "Password must be at least 6 characters.";
    if (form.password !== form.confirmPassword) return "Passwords don't match.";

    if (form.role === "merchant" && !form.gstNumber.trim()) {
      return "GSTIN is required for a merchant account.";
    }

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
        email: payload.email.trim(),
        name: payload.name.trim(),
        gstNumber: payload.gstNumber.trim() ? payload.gstNumber.trim().toUpperCase() : "",
      });

      logout();

      navigate("/login", {
        state: {
          justRegistered: true,
          accountType: form.role,
        },
      });
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err.response?.data?.message || "Something went wrong creating your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page container auth">
      <form className="card auth-card" onSubmit={handleSubmit} noValidate>
        
        {/* Role Switcher Tabs */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <span style={{ fontSize: "14px", color: "#666", display: "block", marginBottom: "8px" }}>
            Register as
          </span>
          <div style={{ display: "inline-flex", background: "#f1f3f5", padding: "4px", borderRadius: "8px", gap: "4px" }}>
            <button
              type="button"
              onClick={() => setRoleTab("buyer")}
              style={{
                padding: "6px 14px",
                border: "none",
                background: form.role === "buyer" ? "#fff" : "transparent",
                boxShadow: form.role === "buyer" ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: form.role === "buyer" ? "600" : "400",
                fontSize: "13px"
              }}
            >
              👤 Buyer / Customer
            </button>
            <button
              type="button"
              onClick={() => setRoleTab("merchant")}
              style={{
                padding: "6px 14px",
                border: "none",
                background: form.role === "merchant" ? "#fff" : "transparent",
                boxShadow: form.role === "merchant" ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: form.role === "merchant" ? "600" : "400",
                fontSize: "13px"
              }}
            >
              🏪 Merchant
            </button>
          </div>
        </div>

        <h1>Create your account</h1>
        <p className="auth-sub">Create a buyer or merchant account to use JCSGlobal.</p>

        {error && <p className="auth-error">{error}</p>}

        <div className="field">
          <label>Business name <span className="required">*</span></label>
          <input
            value={form.name}
            onChange={update("name")}
            placeholder="ABC Retail Pvt Ltd"
          />
        </div>

        <div className="field">
          <label>Email <span className="required">*</span></label>
          <input
            type="email"
            value={form.email}
            onChange={update("email")}
            placeholder="you@business.com"
          />
        </div>

        <div className="field">
          <label>Password <span className="required">*</span></label>
          <input
            type="password"
            value={form.password}
            onChange={update("password")}
            placeholder="At least 6 characters"
          />
        </div>

        <div className="field">
          <label>Confirm password <span className="required">*</span></label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={update("confirmPassword")}
            placeholder="Re-enter your password"
          />
        </div>

        {form.role === "merchant" && (
          <div className="field">
            <label>GSTIN <span className="required">*</span></label>
            <input
              value={form.gstNumber}
              onChange={update("gstNumber")}
              placeholder="Enter your business GSTIN"
            />
            <small>GSTIN is required for merchant accounts.</small>
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading
            ? "Creating account..."
            : form.role === "merchant"
            ? "Create Merchant Account"
            : "Create Buyer Account"}
        </button>

        <p className="auth-switch">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}