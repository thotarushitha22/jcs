import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GSTIN_RE =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z][Z][0-9A-Z]$/;

const PASSWORD_RE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export default function Register() {
  const { register, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const defaultRole =
    location.state?.accountType ||
    location.state?.defaultRole ||
    "buyer";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role:
      defaultRole === "merchant" ||
      defaultRole === "seller"
        ? "merchant"
        : "buyer",
    gstNumber: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (
      location.state?.accountType ||
      location.state?.defaultRole
    ) {
      const incomingRole =
        location.state.accountType ||
        location.state.defaultRole;

      setForm((f) => ({
        ...f,
        role:
          incomingRole === "merchant" ||
          incomingRole === "seller"
            ? "merchant"
            : "buyer",
      }));
    }
  }, [location.state]);

  const update = (key) => (e) => {
    let value = e.target.value;

    if (key === "gstNumber") {
      value = value.toUpperCase();
    }

    setForm((f) => ({
      ...f,
      [key]: value,
    }));

    if (error) {
      setError(null);
    }
  };

  const setRoleTab = (selectedRole) => {
    setForm((f) => ({
      ...f,
      role: selectedRole,
      gstNumber:
        selectedRole === "buyer"
          ? ""
          : f.gstNumber,
    }));

    setError(null);
  };

  const validate = () => {
    if (!form.name.trim()) {
      return form.role === "merchant"
        ? "Please enter the merchant/business name."
        : "Please enter your name.";
    }

    if (!form.email.trim()) {
      return "Please enter your email.";
    }

    if (!EMAIL_RE.test(form.email.trim())) {
      return "That doesn't look like a valid email address.";
    }

    if (!form.password) {
      return "Please choose a password.";
    }

    if (!PASSWORD_RE.test(form.password)) {
      return "Password must be at least 8 characters and include 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.";
    }

    if (!form.confirmPassword) {
      return "Please confirm your password.";
    }

    if (form.password !== form.confirmPassword) {
      return "Passwords don't match.";
    }

    if (
      form.role === "merchant" &&
      !form.gstNumber.trim()
    ) {
      return "GSTIN is required for a merchant account.";
    }

    if (
      form.gstNumber.trim() &&
      !GSTIN_RE.test(
        form.gstNumber.trim().toUpperCase()
      )
    ) {
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
      const {
        confirmPassword,
        ...payload
      } = form;

      await register({
        ...payload,
        name: payload.name.trim(),
        email: payload.email.trim(),
        gstNumber: payload.gstNumber
          .trim()
          .toUpperCase(),
      });

      logout();

      navigate("/login", {
        state: {
          justRegistered: true,
          accountType: form.role,
        },
      });
    } catch (err) {
      console.error(
        "Registration error:",
        err
      );

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
    <div className="login-split-container">

      {/* LEFT SIDE - SAME AS LOGIN */}
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

          {/* TOP NAV */}
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

          {/* REGISTER FORM */}
          <form
            className="auth-card"
            onSubmit={handleSubmit}
            noValidate
          >

            {/* ROLE SWITCHER */}
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
                Register as
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

                {/* CUSTOMER */}
                <button
                  type="button"
                  onClick={() =>
                    setRoleTab("buyer")
                  }
                  style={{
                    padding: "6px 16px",
                    border: "none",
                    background:
                      form.role === "buyer"
                        ? "#fff"
                        : "transparent",
                    boxShadow:
                      form.role === "buyer"
                        ? "0 2px 4px rgba(0,0,0,0.1)"
                        : "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight:
                      form.role === "buyer"
                        ? "600"
                        : "400",
                    fontSize: "13px",
                  }}
                >
                  👤 Customer
                </button>

                {/* MERCHANT */}
                <button
                  type="button"
                  onClick={() =>
                    setRoleTab("merchant")
                  }
                  style={{
                    padding: "6px 16px",
                    border: "none",
                    background:
                      form.role === "merchant"
                        ? "#fff"
                        : "transparent",
                    boxShadow:
                      form.role === "merchant"
                        ? "0 2px 4px rgba(0,0,0,0.1)"
                        : "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight:
                      form.role === "merchant"
                        ? "600"
                        : "400",
                    fontSize: "13px",
                  }}
                >
                  🏪 Merchant
                </button>

              </div>
            </div>

            {/* TITLE */}
            <h1>Create your account</h1>

            <p className="auth-sub">
              Create a buyer or merchant
              account to use JCSGlobal.
            </p>

            {/* ERROR */}
            {error && (
              <p className="auth-error">
                {error}
              </p>
            )}

            {/* MERCHANT / CUSTOMER NAME */}
            <div className="field">
              <label>
                {isMerchant
                  ? "Merchant Name"
                  : "Customer / User Name"}

                <span className="required">
                  {" "}*
                </span>
              </label>

              <input
                value={form.name}
                onChange={update("name")}
                placeholder={
                  isMerchant
                    ? "Enter merchant/business name"
                    : "ABC Retail Pvt Ltd"
                }
                autoComplete="name"
              />
            </div>

            {/* EMAIL */}
            <div className="field">
              <label>
                Email
                <span className="required">
                  {" "}*
                </span>
              </label>

              <input
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder="you@business.com"
                autoComplete="email"
              />
            </div>

            {/* PASSWORD */}
            <div className="field">
              <label>
                Password
                <span className="required">
                  {" "}*
                </span>
              </label>

              <input
                type="password"
                value={form.password}
                onChange={update("password")}
                placeholder="Enter a strong password"
                autoComplete="new-password"
              />

              <small
                style={{
                  display: "block",
                  marginTop: "6px",
                  color: "#666",
                  lineHeight: "1.4",
                  fontSize: "12px",
                }}
              >
                Minimum 8 characters:
                1 uppercase, 1 lowercase,
                1 number and 1 special
                character.
              </small>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="field">
              <label>
                Confirm Password
                <span className="required">
                  {" "}*
                </span>
              </label>

              <input
                type="password"
                value={form.confirmPassword}
                onChange={update(
                  "confirmPassword"
                )}
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
            </div>

            {/* GSTIN FOR MERCHANT */}
            {isMerchant && (
              <div className="field">
                <label>
                  GSTIN
                  <span className="required">
                    {" "}*
                  </span>
                </label>

                <input
                  value={form.gstNumber}
                  onChange={update(
                    "gstNumber"
                  )}
                  placeholder="Enter your business GSTIN"
                  maxLength={15}
                />

                <small>
                  GSTIN is required for merchant
                  accounts.
                </small>
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading
                ? "Creating account..."
                : isMerchant
                ? "Create Merchant Account"
                : "Create Customer Account"}
            </button>

            {/* LOGIN LINK */}
            <p className="auth-switch">
              Already registered?{" "}

              <Link to="/login">
                Sign in
              </Link>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}