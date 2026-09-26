import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";
import "../../assets/css/admin/AdminLogin.css";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Please enter admin email");
      return;
    }

    if (!password) {
      setError("Please enter admin password");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post(
        "/auth/admin/login",
        {
          email: email.trim(),
          password,
        }
      );

      const { token, user } = response.data;

      if (!token) {
        setError("Login failed. Authentication token was not received.");
        return;
      }

      if (!user) {
        setError("Login failed. Admin user information was not received.");
        return;
      }

      /*
        Check admin role before saving the token.
      */
      if (user.role !== "ADMIN") {
        setError("Admin access denied");
        return;
      }

      localStorage.setItem(
        "keerthana_token",
        token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      /*
        Refresh AuthContext user information.
      */
      await refreshUser();

      navigate("/admin");

    } catch (err) {
      console.error(
        "Admin login error:",
        err
      );

      if (err.response) {
        setError(
          err.response.data?.message ||
            "Invalid admin email or password"
        );
      } else if (err.request) {
        setError(
          "Unable to connect to the server. Please make sure the backend is running."
        );
      } else {
        setError(
          "Something went wrong. Please try again."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">

      <div className="admin-login-card">

        {/* =====================================================
            BRAND
        ====================================================== */}

        <div className="admin-login-brand">

          <div className="admin-login-logo">
            K
          </div>

          <h1>
            KEERTHANA
          </h1>

          <p>
            Admin Panel
          </p>

        </div>


        {/* =====================================================
            LOGIN FORM
        ====================================================== */}

        <form
          className="admin-login-form"
          onSubmit={handleSubmit}
        >

          {/* ===================================================
              EMAIL
          ==================================================== */}

          <div className="admin-form-group">

            <label htmlFor="admin-email">
              Admin Email
            </label>

            <input
              id="admin-email"
              type="email"
              className="admin-input"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="Enter admin email"
              autoComplete="email"
              disabled={loading}
              required
            />

          </div>


          {/* ===================================================
              PASSWORD
          ==================================================== */}

          <div className="admin-form-group">

            <label htmlFor="admin-password">
              Password
            </label>

            <div className="admin-password-wrapper">

              <input
                id="admin-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                className="admin-input admin-password-input"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter admin password"
                autoComplete="current-password"
                disabled={loading}
                required
              />

              {/* PASSWORD EYE */}

              <button
                type="button"
                className="admin-password-toggle"
                onClick={() =>
                  setShowPassword(
                    (prev) => !prev
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                disabled={loading}
              >

                {showPassword ? (

                  /* =================================================
                     EYE OFF
                  ================================================== */

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >

                    <path
                      d="M3 3L21 21"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />

                    <path
                      d="M10.58 10.58A2 2 0 0013.41 13.41"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />

                    <path
                      d="M9.88 4.24A9.88 9.88 0 0112 4C17 4 20.5 8 21.5 12C21.1 13.6 20.1 15.3 18.7 16.7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    <path
                      d="M6.61 6.61C4.72 7.93 3.5 9.86 2.5 12C3.5 16 7 20 12 20C13.58 20 15.05 19.62 16.37 19"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                  </svg>

                ) : (

                  /* =================================================
                     EYE
                  ================================================== */

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >

                    <path
                      d="M2.5 12C3.5 8 7 4 12 4C17 4 20.5 8 21.5 12C20.5 16 17 20 12 20C7 20 3.5 16 2.5 12Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                      stroke="currentColor"
                      strokeWidth="2"
                    />

                  </svg>

                )}

              </button>

            </div>

          </div>


          {/* ===================================================
              FORGOT PASSWORD
          ==================================================== */}

          <div className="admin-forgot-password">

            <Link to="/admin/forgot-password">
              Forgot Password?
            </Link>

          </div>


          {/* ===================================================
              ERROR
          ==================================================== */}

          {error && (
            <div className="admin-login-error">
              {error}
            </div>
          )}


          {/* ===================================================
              LOGIN BUTTON
          ==================================================== */}

          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >

            {loading
              ? "Signing in..."
              : "Admin Login"}

          </button>

        </form>


        {/* =====================================================
            USER LOGIN
        ====================================================== */}

        {/* <div className="admin-user-login">

          Not an admin?{" "}

          <Link to="/login">
            User Login
          </Link>

        </div> */}


        {/* =====================================================
            SECURITY
        ====================================================== */}

        <div className="admin-security-text">

          Authorized administrators only

        </div>

      </div>

    </div>
  );
};

export default AdminLogin;