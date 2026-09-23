
import { useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

import "../assets/css/login.css";


function Login() {

  const navigate = useNavigate();

  const {
    login,
  } = useAuth();


  const [contact, setContact] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  /* =====================================================
     LOGIN
  ===================================================== */

  const handleSubmit =
    async (event) => {

      event.preventDefault();

      setError("");

      const cleanContact =
        contact.trim();


      if (!cleanContact) {

        setError(
          "Please enter your email or phone number."
        );

        return;
      }


      setLoading(true);


      try {

        await login(
          cleanContact
        );


        navigate(
          "/",
          {
            replace: true,
          }
        );


      } catch (error) {

        console.error(
          "LOGIN ERROR:",
          error
        );


        setError(
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Unable to login. Please check your email or phone number."
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


        {/* =================================================
           LOGO
        ================================================= */}

        <div className="auth-logo">
          ♪
        </div>


        <h1>
          KEERTHANA
        </h1>


        <p className="auth-subtitle">
          Christian Music
        </p>


        <h2>
          Welcome Back
        </h2>


        {/* =================================================
           ERROR
        ================================================= */}

        {error && (

          <div className="auth-error">
            {error}
          </div>

        )}


        {/* =================================================
           LOGIN FORM
        ================================================= */}

        <form
          onSubmit={
            handleSubmit
          }
        >

          <label>
            Email or Phone Number
          </label>


          <input
            type="text"

            value={contact}

            onChange={(event) =>
              setContact(
                event.target.value
              )
            }

            placeholder="Enter your email or phone number"

            autoComplete="username"

            required
          />


          <button
            type="submit"

            className="auth-submit"

            disabled={loading}
          >

            {loading
              ? "Logging in..."
              : "Login"}

          </button>


        </form>


        {/* =================================================
           REGISTER
        ================================================= */}

        <p className="auth-switch">

          New to KEERTHANA?

          {" "}

          <Link to="/register">
            Create Account
          </Link>

        </p>


      </div>

    </div>

  );

}


export default Login;

