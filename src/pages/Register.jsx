import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import "../assets/css/register.css";

function Register() {
  const navigate = useNavigate();

  const { register } = useAuth();

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  const [language, setLanguage] = useState("Telugu");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const cleanName = name.trim();
    const cleanContact = contact.trim();

    if (!cleanName) {
      setError("Please enter your name");
      return;
    }

    if (!cleanContact) {
      setError("Please enter your email or phone number");
      return;
    }

    if (!language) {
      setError("Please select your preferred language");
      return;
    }

    setLoading(true);

    try {
      await register(
        cleanName,
        cleanContact,
        language
      );

      navigate("/");
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Unable to create account"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-logo">
          ♪
        </div>

        <h1>KEERTHANA</h1>

        <p className="auth-subtitle">
          Christian Music
        </p>

        <h2>Create Account</h2>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* NAME */}

          <label>
            Name
          </label>

          <input
            type="text"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="Your name"
            autoComplete="name"
            required
          />


          {/* EMAIL / PHONE */}

          <label>
            Email or Phone Number
          </label>

          <input
            type="text"
            value={contact}
            onChange={(event) =>
              setContact(event.target.value)
            }
            placeholder="Email or phone number"
            autoComplete="email"
            required
          />


          {/* LANGUAGE */}

          <label>
            Preferred Music Language
          </label>

          <select
            value={language}
            onChange={(event) =>
              setLanguage(event.target.value)
            }
            required
          >

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
            {loading
              ? "Creating..."
              : "Create Account"}
          </button>

        </form>

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