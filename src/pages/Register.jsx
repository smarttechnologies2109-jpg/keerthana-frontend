import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

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
    <main className="register-page">
      <form className="register-form" onSubmit={handleSubmit}>
        <h1>Create your KEERTHANA account</h1>
        <p>Join KEERTHANA Music and enjoy songs in your preferred language.</p>

        <label htmlFor="register-name">Name</label>
        <input
          id="register-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          required
        />

        <label htmlFor="register-contact">Email or phone number</label>
        <input
          id="register-contact"
          type="text"
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          autoComplete="username"
          required
        />

        <label htmlFor="register-language">Preferred language</label>
        <select
          id="register-language"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          required
        >
          <option value="">Choose your language</option>
          {LANGUAGES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        {error && <p className="register-error" role="alert">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </main>
  );
}
