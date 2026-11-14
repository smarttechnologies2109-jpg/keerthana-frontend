
import { useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import "../assets/css/login.css";

function Login() {
  const navigate = useNavigate();

  const { login } = useAuth();

  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =====================================================
     FRIENDLY ERROR MESSAGES
  ===================================================== */

  const getFriendlyError = (error) => {
    const status = error.response?.status;

    // No internet / Network connection issue
    if (
      !navigator.onLine ||
      error.code === "ERR_NETWORK" ||
      error.message === "Network Error" ||
      error.code === "ECONNABORTED"
    ) {
      return "Your internet connection seems to be unavailable. Please check your Wi-Fi or mobile data and try again.";
    }

    // Request timeout
    if (
      error.code === "ETIMEDOUT" ||
      error.message?.toLowerCase().includes("timeout")
    ) {
      return "The connection is taking too long. Please check your internet and try again.";
    }

    // Invalid login details
    if (status === 401 || status === 400) {
      return "We couldn't sign you in. Please check your email or mobile number and try again.";
    }

    // Too many requests
    if (status === 429) {
      return "You've tried too many times. Please wait a little and try again.";
    }

    // Server error
    if (status >= 500) {
      return "We're having a little trouble right now. Please try again in a few minutes.";
    }

    // Other errors
    return "Something went wrong. Please try again. If the problem continues, contact our support team.";
  };

  /* =====================================================
     LOGIN
  ===================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const cleanContact = contact.trim();

    if (!cleanContact) {
      setError("Please enter your email or mobile number.");
      return;
    }

    // Email validation
    const isEmail =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanContact);

    // Mobile number validation
    if (!isEmail) {
      const digitsOnly = cleanContact.replace(/\D/g, "");

      if (
        !/^\d+$/.test(cleanContact) ||
        digitsOnly.length !== 10
      ) {
        setError(
          "Please enter a valid 10-digit mobile number."
        );
        return;
      }
    }

    // Check internet before login
    if (!navigator.onLine) {
      setError(
        "You're currently offline. Please connect to the internet and try again."
      );
      return;
    }

    setLoading(true);

    try {
      await login(cleanContact);

      navigate("/", {
        replace: true,
      });

    } catch (error) {
      console.error("LOGIN ERROR:", error);

      setError(getFriendlyError(error));

    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* LOGO */}
        <div className="auth-logo">♪</div>

        <h1>KEERTHANA</h1>

        <p className="auth-subtitle">
          Christian Music
        </p>

        <h2>Welcome Back</h2>

        {/* FRIENDLY ERROR */}
        {error && (
          <div
            className="auth-error"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit}>

          <label htmlFor="contact">
            Email or Phone Number
          </label>

          <input
            id="contact"
            type="text"
            inputMode="text"
            value={contact}
            onChange={(event) => {
              setContact(event.target.value);
              setError("");
            }}
            placeholder="Enter your email or mobile number"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={!!error}
            required
            disabled={loading}
          />

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Please wait..." : "Login"}
          </button>

        </form>

        {/* REGISTER */}
        <p className="auth-switch">
          New to KEERTHANA?{" "}
          <Link to="/register">
            Create Account
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Login;
