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

  const [selectedRole, setSelectedRole] = useState("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const roleConfig = {
    customer: {
      title: "Customer Login",
      subtitle: "Access wholesale pricing as a verified retailer.",
      placeholder: "you@business.com",
      buttonText: "Login as Customer",
    },
    merchant: {
      title: "Merchant Login",
      subtitle: "Login to manage your JCSGlobal store",
      placeholder: "merchant@jcsglobal.com",
      buttonText: "Login as Merchant",
    },
    admin: {
      title: "Admin Login",
      subtitle: "Login to access the administrative dashboard",
      placeholder: "admin@jcsglobal.com",
      buttonText: "Login as Admin",
    }
  };

  const currentConfig = roleConfig[selectedRole];

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
      const res = await login({ email: email.trim(), password });
      
      const loggedInUser = res?.user || JSON.parse(localStorage.getItem('user') || '{}');
      const userRole = loggedInUser?.role ? String(loggedInUser.role).toLowerCase() : 'customer';
      const userEmail = loggedInUser?.email ? String(loggedInUser.email).toLowerCase() : email.trim().toLowerCase();

      // ==========================================
      // STRICT ROLE & PORTAL RESTRICTION GUARDS
      // ==========================================
      
      // 1. If trying to log in through the CUSTOMER tab:
      if (selectedRole === "customer") {
        if (userRole === "admin" || userEmail === "thotarushitha22@gmail.com") {
          throw new Error("Admins cannot log in here. Please use the Admin tab.");
        }
        if (userRole === "merchant") {
          throw new Error("Merchants cannot log in here. Please use the Merchant tab.");
        }
      }

      // 2. Specific Admin restriction check
      if (userEmail === "thotarushitha22@gmail.com" && selectedRole !== "admin") {
        throw new Error("This email is restricted to Admin Login only.");
      }

      if (selectedRole === "admin" && userRole !== "admin") {
        throw new Error("Access denied. You do not have administrator permissions.");
      }

      if (selectedRole === "merchant" && userRole !== "merchant" && userRole !== "admin") {
        throw new Error("This account is not registered as a merchant.");
      }

      // Successful routing based on portal selection
      if (selectedRole === "admin") {
        navigate("/admin");
      } else if (selectedRole === "merchant") {
        navigate("/merchant");
      } else {
        navigate("/");
      }

    } catch (err) {
      // Clean handling for 401 Unauthorized or custom security errors thrown above
      if (err.response?.status === 401) {
        setError("Invalid email or password. Please check your details or create an account.");
      } else {
        setError(err.message || err.response?.data?.message || "Something went wrong signing in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page container auth">
      <form className="card auth-card" onSubmit={handleSubmit} noValidate>
        
        {/* Role Switcher Tabs */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <span style={{ fontSize: "14px", color: "#666", display: "block", marginBottom: "8px" }}>Login as</span>
          <div style={{ display: "inline-flex", background: "#f1f3f5", padding: "4px", borderRadius: "8px", gap: "4px" }}>
            <button
              type="button"
              onClick={() => setSelectedRole("customer")}
              style={{
                padding: "6px 12px",
                border: "none",
                background: selectedRole === "customer" ? "#fff" : "transparent",
                boxShadow: selectedRole === "customer" ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: selectedRole === "customer" ? "600" : "400",
                fontSize: "13px"
              }}
            >
              👤 Customer
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole("merchant")}
              style={{
                padding: "6px 12px",
                border: "none",
                background: selectedRole === "merchant" ? "#fff" : "transparent",
                boxShadow: selectedRole === "merchant" ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: selectedRole === "merchant" ? "600" : "400",
                fontSize: "13px"
              }}
            >
              🏪 Merchant
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole("admin")}
              style={{
                padding: "6px 12px",
                border: "none",
                background: selectedRole === "admin" ? "#fff" : "transparent",
                boxShadow: selectedRole === "admin" ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: selectedRole === "admin" ? "600" : "400",
                fontSize: "13px"
              }}
            >
              🛡️ Admin
            </button>
          </div>
        </div>

        <h1>{currentConfig.title}</h1>
        <p className="auth-sub">{currentConfig.subtitle}</p>

        {justRegistered && !error && (
          <p className="auth-success">Account created — sign in to continue.</p>
        )}
        {error && <p className="auth-error">{error}</p>}

        <div className="field">
          <label>Email *</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder={currentConfig.placeholder} 
          />
        </div>
        
        <div className="field">
          <label>Password *</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
        </div>

        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Signing in…" : currentConfig.buttonText}
        </button>

        <p className="auth-switch">
          {selectedRole === 'merchant' && (
            <>Don't have a merchant account? <Link to="/register" state={{ defaultRole: 'merchant' }}>Register as Merchant</Link></>
          )}
          {selectedRole === 'customer' && (
            <>New to JCSGlobal? <Link to="/register" state={{ defaultRole: 'customer' }}>Create an account</Link></>
          )}
          {selectedRole === 'admin' && (
            <>Admin access is restricted. <Link to="/register" state={{ defaultRole: 'admin' }}>Request access</Link></>
          )}
        </p>
      </form>
    </div>
  );
}