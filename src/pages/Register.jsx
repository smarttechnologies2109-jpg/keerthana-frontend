import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

import "../assets/css/register.css";

const LANGUAGES = [
  { value: "Telugu", label: "తెలుగు" },
  { value: "Hindi", label: "हिन्दी" },
  { value: "English", label: "English" },
  { value: "Malayalam", label: "മലയാളം" },
  { value: "Kannada", label: "ಕನ್ನಡ" },
  { value: "Tamil", label: "தமிழ்" },
];

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { setSelectedLanguage } = useLanguage();

  const submittingRef = useRef(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [language, setLanguage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submittingRef.current) return;

    const cleanName = name.trim();
    const cleanContact = contact.trim();

    if (!cleanName || !cleanContact || !language) {
      setError("Please enter your name, email or phone number, and preferred language.");
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    setError("");

    try {
      await register(cleanName, cleanContact, language);
      // Keep the new account's selected language as the active app language.
      setSelectedLanguage(language);
      navigate("/", { replace: true });
    } catch (registrationError) {
      setError(
        registrationError?.response?.data?.message ||
        registrationError?.message ||
        "Registration failed. Please try again."
      );
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="register-title">
        <div className="auth-logo" aria-hidden="true">♪</div>
        <p className="auth-eyebrow">YOUR MUSIC. YOUR LANGUAGE. YOUR COMMUNITY.</p>
        <h1>KEERTHANA</h1>
        <p className="auth-subtitle">Christian Music</p>

        <h2 id="register-title">Create your account</h2>
        <p className="auth-description">
          Join KEERTHANA and discover uplifting Christian music in the language you love.
        </p>

        {error && (
          <div className="auth-error" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="register-name">Your name</label>
          <input
            id="register-name"
            type="text"
            value={name}
            onChange={(event) => { setName(event.target.value); setError(""); }}
            placeholder="Enter your full name"
            autoComplete="name"
            required
            disabled={loading}
          />

          <label htmlFor="register-contact">Email or mobile number</label>
          <input
            id="register-contact"
            type="text"
            inputMode="text"
            value={contact}
            onChange={(event) => { setContact(event.target.value); setError(""); }}
            placeholder="Enter your email or phone number"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            disabled={loading}
          />

          <label htmlFor="register-language">Preferred language</label>
          <select
            id="register-language"
            value={language}
            onChange={(event) => { setLanguage(event.target.value); setError(""); }}
            required
            disabled={loading}
          >
            <option value="">Choose your language</option>
            {LANGUAGES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Creating your account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          Already part of KEERTHANA? <Link to="/login">Log in</Link>
        </p>
        <p className="auth-legal">By continuing, you agree to use KEERTHANA respectfully and responsibly.</p>
      </section>
    </main>
  );
}
