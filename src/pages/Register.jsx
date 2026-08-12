import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z][Z][0-9A-Z]$/;

export default function Register() {
  const { register, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    Email: "",
    password: "",
    confirmPassword: "",
    role: "buyer",
    gstNumber: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = (key) => (e) =>
    setForm((f) => ({
      ...f,
      [key]: e.target.value,
    }));

  const validate = () => {
    if (!form.name.trim()) return "Please enter your business name.";
    if (!form.email.trim()) return "Please enter your Email.";
    if (!EMAIL_RE.test(form.Email))
      return "That doesn't look like a valid email address.";
    if (!form.password) return "Please choose a password.";
    if (form.password.length < 6)
      return "Password must be at least 6 characters.";
    if (form.password !== form.confirmPassword)
      return "Passwords don't match.";

    if (
      form.gstNumber.trim() &&
      !GSTIN_RE.test(form.gstNumber.trim().toUpperCase())
    ) {
      return "That GSTIN doesn't look valid — check the format (e.g. 27ABCDE1234F1Z5), or leave it blank.";
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
        gstNumber: payload.gstNumber.trim()
          ? payload.gstNumber.trim().toUpperCase()
          : "",
      });

      logout();

      navigate("/login", {
        state: {
          justRegistered: true,
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong creating your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page container auth">
      <form
        className="card auth-card"
        onSubmit={handleSubmit}
        noValidate
      >
        <h1>Create your account</h1>

        <p className="auth-sub">
          Retailer accounts are verified against GST before wholesale pricing
          unlocks.
        </p>

        {error && <p className="auth-error">{error}</p>}

        <div className="field">
          <label>
            Business name <span className="required">*</span>
          </label>

          <input
            value={form.name}
            onChange={update("name")}
            placeholder="ABC Retail Pvt Ltd"
          />
        </div>

        <div className="field">
          <label>
            Email <span className="required">*</span>
          </label>

          <input
            type="email"
            value={form.email}
            onChange={update("email")}
            placeholder="you@business.com"
          />
        </div>

        <div className="field">
          <label>
            Password <span className="required">*</span>
          </label>

          <input
            type="password"
            value={form.password}
            onChange={update("password")}
            placeholder="At least 6 characters"
          />
        </div>

        <div className="field">
          <label>
            Confirm password <span className="required">*</span>
          </label>

          <input
            type="password"
            value={form.confirmPassword}
            onChange={update("confirmPassword")}
          />
        </div>

        <div className="field">
          <label>
            GSTIN <span className="field-optional">(optional)</span>
          </label>

          <input
            value={form.gstNumber}
            onChange={update("gstNumber")}
            placeholder="27ABCDE1234F1Z5 — leave blank if you don't have one yet"
          />
        </div>

        <div className="field">
          <label>I want to</label>

          <select
            value={form.role}
            onChange={update("role")}
          >
            <option value="buyer">
              Buy wholesale stock
            </option>

            <option value="seller">
              Sell stock to JCSGlobal
            </option>
          </select>
        </div>

        <button
          className="btn btn-primary btn-block"
          disabled={loading}
        >
          {loading
            ? "Creating account…"
            : "Create account"}
        </button>

        <p className="auth-switch">
          Already registered?{" "}
          <Link to="/login">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}