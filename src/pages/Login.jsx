
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
     LOGIN
  ===================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const cleanContact = contact.trim();

    if (!cleanContact) {
      setError("Please enter your email or 10-digit mobile number.");
      return;
    }

    // Check whether the input is an email address.
    const isEmail =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanContact);

    // If it is not an email, validate it as a mobile number.
    if (!isEmail) {
      const digitsOnly = cleanContact.replace(/\D/g, "");

      if (!/^\d+$/.test(cleanContact) || digitsOnly.length !== 10) {
        setError("Please enter a valid 10-digit mobile number.");
        return;
      }
    }

    setLoading(true);

    try {
      await login(cleanContact);

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Unable to login. Please check your email or mobile number."
      );
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

        {/* ERROR */}
        {error && (
          <div className="auth-error" role="alert">
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
            placeholder="Enter email or 10-digit mobile number"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
          />

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
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
