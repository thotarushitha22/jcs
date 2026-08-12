import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = location.state?.justRegistered;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validate = () => {
    if (!email.trim()) return "Please enter your email address.";
    if (!EMAIL_RE.test(email)) return "That doesn't look like a valid email address.";
    if (!password) return "Please enter your password.";
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
      await login({ email: email.trim(), password });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong signing in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page container auth">
      <form className="card auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Sign in</h1>
        <p className="auth-sub">Access wholesale pricing as a verified retailer.</p>

        {justRegistered && !error && (
          <p className="auth-success">Account created — sign in to continue.</p>
        )}
        {error && <p className="auth-error">{error}</p>}

        <div className="field"><label> Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" />
        </div>
        <div className="field"><label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <p className="auth-switch">New to JCSGlobal? <Link to="/register">Create an account</Link></p>
      </form>
    </div>
  );
}