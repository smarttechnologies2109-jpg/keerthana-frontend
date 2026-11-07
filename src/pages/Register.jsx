
import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import "../assets/css/register.css";

function Register() {
  const navigate = useNavigate();

  const { register } = useAuth();

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  // No default language selected
  const [language, setLanguage] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitLock = useRef(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Prevent multiple registration requests
    if (submitLock.current) return;

    submitLock.current = true;
    setError("");

    const cleanName = name.trim();
    const cleanContact = contact.trim();

    if (!cleanName) {
      setError("Please enter your name");
      submitLock.current = false;
      return;
    }

    if (!cleanContact) {
      setError("Please enter your email or phone number");
      submitLock.current = false;
      return;
    }

    if (!language) {
      setError("Please select your preferred language");
      submitLock.current = false;
      return;
    }

    setLoading(true);

    try {
      await register(cleanName, cleanContact, language);

      // Save selected language
      localStorage.setItem("keerthana_language", language);

      navigate("/", { replace: true });

    } catch (error) {
      console.error("Registration failed:", error);

      setError(
        error.response?.data?.message ||
        "Unable to create account"
      );

    } finally {
      submitLock.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        {/* LOGO */}
        <div className="auth-logo">
          ♪
        </div>

        <h1>KEERTHANA</h1>

        <p className="auth-subtitle">
          Christian Music
        </p>

        <h2>Create Account</h2>

        {/* ERROR */}
        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* NAME */}
          <label htmlFor="name">
            Name
          </label>

          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
            placeholder="Your name"
            autoComplete="name"
            required
          />

          {/* EMAIL / PHONE */}
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
            placeholder="Email or phone number"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
          />

          {/* LANGUAGE */}
          <label htmlFor="language">
            Preferred Music Language
          </label>

          <select
            id="language"
            value={language}
            onChange={(event) => {
              setLanguage(event.target.value);
              setError("");
            }}
            required
          >
            <option value="" disabled>
              Select Language / భాషను ఎంచుకోండి
            </option>

            <option value="Telugu">తెలుగు</option>

            <option value="Hindi">हिन्दी</option>

            <option value="English">English</option>

            <option value="Malayalam">മലയാളം</option>

            <option value="Kannada">ಕನ್ನಡ</option>

            <option value="Tamil">தமிழ்</option>

          </select>

          {/* REGISTER */}
          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Account"}
          </button>

        </form>

        {/* LOGIN */}
        <p className="auth-switch">
          Already have an account?{" "}

          <Link to="/login">
            Login
          </Link>
        </p>

      </div>

    </div>
  );
}

export default Register;
