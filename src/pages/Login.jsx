
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

    const serverMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      "";

    const message = String(serverMessage).toLowerCase();

    // Account does not exist
    if (
      status === 404 ||
      message.includes("user not found") ||
      message.includes("account not found") ||
      message.includes("no account") ||
      message.includes("user does not exist") ||
      message.includes("not registered")
    ) {
      return "Account not found. Please create a KEERTHANA account first to continue.";
    }

    // Incorrect password
    if (
      message.includes("incorrect password") ||
      message.includes("invalid password") ||
      message.includes("wrong password")
    ) {
      return "The password you entered is incorrect. Please try again.";
    }

    // Account already exists
    if (
      message.includes("already exists") ||
      message.includes("already registered")
    ) {
      return "An account with these details already exists. Please log in instead.";
    }

    // Network issue
    if (
      !navigator.onLine ||
      error.code === "ERR_NETWORK" ||
      error.message === "Network Error"
    ) {
      return "Your internet connection seems unavailable. Please check your connection and try again.";
    }

    // Timeout
    if (
      error.code === "ETIMEDOUT" ||
      error.code === "ECONNABORTED" ||
      message.includes("timeout")
    ) {
      return "The connection is taking too long. Please try again.";
    }

    // Invalid login
    if (status === 401) {
      return "Your login details could not be verified. Please check your details and try again.";
    }

    if (status === 400) {
      return "Please check your email or mobile number and try again.";
    }

    // Too many attempts
    if (status === 429) {
      return "You've tried too many times. Please wait a moment and try again.";
    }

    // Server error
    if (status >= 500) {
      return "We're temporarily unable to process your request. Please try again in a few minutes.";
    }

    return "We couldn't complete your login. Please try again. If the problem continues, contact KEERTHANA support.";
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

    const isEmail =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanContact);

    if (!isEmail) {
      const digitsOnly = cleanContact.replace(/\D/g, "");

      if (
        !/^\d+$/.test(cleanContact) ||
        digitsOnly.length !== 10
      ) {
        setError("Please enter a valid 10-digit mobile number.");
        return;
      }
    }

    if (!navigator.onLine) {
      setError(
        "You're currently offline. Please connect to the internet and try again."
      );
      return;
    }

    setLoading(true);

    try {
      await login(cleanContact);

      navigate("/", { replace: true });

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
