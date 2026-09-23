
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import "../assets/css/register.css";

function Register() {
  const navigate = useNavigate();

  const { register } = useAuth();

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

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

    setLoading(true);

    try {
      await register(cleanName, cleanContact);

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
