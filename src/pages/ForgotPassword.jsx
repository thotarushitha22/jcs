import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import "./Login.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");


    if (!email.trim()) {
      setError(
        "Please enter your email address."
      );
      return;
    }


    try {
      setLoading(true);

      const response =
        await api.post(
          "/auth/forgot-password",
          {
            email: email.trim(),
          }
        );


      setSuccess(
        response?.data?.message ||
          "Password reset instructions have been sent to your email."
      );

    } catch (err) {

      console.error(
        "Forgot password error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to process your request. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-split-container">

      {/* =================================================
          LEFT SIDE
      ================================================= */}

      <div className="auth-left-pane">

        <div className="brand-header-area">

          <span className="brand-logo-icon">
            ▲
          </span>

          <span className="brand-logo-text">
            JCS GLOBAL
          </span>

        </div>


        <div className="brand-center-area">

          <span className="brand-eyebrow">
            ACCOUNT RECOVERY
          </span>

          <h1 className="brand-title">
            Reset Access.
            <br />
            Stay Secure.
          </h1>

          <div className="brand-divider"></div>

          <p className="brand-desc">
            Recover your JCS Global account
            securely and get back to your
            wholesale business.
          </p>

        </div>


        <div className="floating-arrow-bubble">
          <span>→</span>
        </div>

      </div>


      {/* =================================================
          RIGHT SIDE
      ================================================= */}

      <div className="auth-right-pane">

        <div className="auth-card-wrapper">

          <div className="auth-top-nav">

            <span className="portal-tag">
              SECURE PORTAL
            </span>

            <Link
              to="/login"
              className="back-home-link"
            >
              ← Back to Login
            </Link>

          </div>


          <form
            className="auth-card-form"
            onSubmit={handleSubmit}
            noValidate
          >

            <h2 className="form-main-heading">
              Forgot Password?
            </h2>

            <p className="form-sub-heading">
              Enter your registered email
              address to reset your password.
            </p>


            {/* ERROR */}

            {error && (
              <p className="auth-error-alert">
                {error}
              </p>
            )}


            {/* SUCCESS */}

            {success && (
              <p className="auth-success-alert">
                {success}
              </p>
            )}


            {/* EMAIL */}

            <div className="field-block">

              <label>
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                placeholder="you@business.com"
                autoComplete="email"
              />

            </div>


            {/* BUTTON */}

            <button
              type="submit"
              className="btn-primary-action"
              disabled={loading}
            >
              {loading
                ? "Sending..."
                : "Send Reset Link"}
            </button>


            {/* LOGIN LINK */}

            <p className="auth-switch-prompt">

              Remember your password?{" "}

              <Link to="/login">
                Login
              </Link>

            </p>

          </form>

        </div>

      </div>

    </div>
  );
}