import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

import "../assets/css/register.css";

const LANGUAGES = [
  { value: "Telugu", label: "తెలుగు (Telugu)" },
  { value: "Hindi", label: "हिन्दी (Hindi)" },
  { value: "English", label: "English (English)" },
  { value: "Malayalam", label: "മലയാളം (Malayalam)" },
  { value: "Kannada", label: "ಕನ್ನಡ (Kannada)" },
  { value: "Tamil", label: "தமிழ் (Tamil)" },
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
      <div className="auth-shell">
        <aside className="auth-brand-panel">
          <div className="auth-brand-top">
            <div className="auth-brand-mark"><img src="/keerthana-logo.webp" alt="KEERTHANA" /></div>
            <div className="auth-brand-name">KEERTHANA</div>
            <div className="auth-brand-rule" />
          </div>
          <div className="auth-brand-copy">
            <h1>Every Song.<br />Every Prayer.<br /><em>One Place.</em></h1>
            <p>Experience the beauty of Telugu Christian music, praise and worship. Let every melody bring you closer to God.</p>
            <div className="auth-brand-tags">
              <span>♪ Praise</span><span>✦ Worship</span><span>♫ Christian Music</span>
            </div>
          </div>
          <div className="auth-brand-footer"><span>MADE FOR WORSHIP</span><b>✦</b><span>MADE WITH LOVE</span></div>
        </aside>

        <section className="auth-main-panel">
          <div className="auth-card" aria-labelledby="register-title">
            <p className="auth-eyebrow">JOIN THE COMMUNITY</p>
            <h2 id="register-title">Create your KEERTHANA account</h2>
            <p className="auth-description">Your worship journey starts here. Choose your language and join us.</p>

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
        <div className="auth-divider"><span>YOUR WORSHIP JOURNEY</span></div>
        <p className="auth-legal">✦ &nbsp; Made for worship. Made with love.</p>
          </div>
          <footer className="auth-form-footer">© 2026 KEERTHANA MUSIC. ALL RIGHTS RESERVED.</footer>
        </section>
      </div>
    </main>
  );
}
