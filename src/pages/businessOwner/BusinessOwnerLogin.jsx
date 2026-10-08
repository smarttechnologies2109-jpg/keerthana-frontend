
import React, { useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  FaEye,
  FaEyeSlash,
  FaLock,
  FaEnvelope,
} from "react-icons/fa";

import {
  useAuth,
} from "../../context/AuthContext";

import "../../assets/css/businessowner/BusinessOwnerLogin.css";


const BusinessOwnerLogin = () => {

  const navigate =
    useNavigate();


  /* =========================================================
     AUTH CONTEXT
  ========================================================= */

  const {
    ownerLogin,
  } = useAuth();


  /* =========================================================
     FORM STATE
  ========================================================= */

  const [
    formData,
    setFormData,
  ] = useState({
    email: "",
    password: "",
  });


  const [
    showPassword,
    setShowPassword,
  ] = useState(false);


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  /* =========================================================
     HANDLE INPUT CHANGE
  ========================================================= */

  const handleChange = (e) => {

    const {
      name,
      value,
    } = e.target;


    setFormData(
      (prev) => ({
        ...prev,

        [name]:
          value,
      })
    );


    setError("");

  };


  /* =========================================================
     HANDLE LOGIN
  ========================================================= */

  const handleSubmit =
    async (e) => {

      e.preventDefault();


      const email =
        formData.email.trim();


      const password =
        formData.password;


      /* =====================================================
         VALIDATION
      ===================================================== */

      if (
        !email ||
        !password
      ) {

        setError(
          "Please enter email and password."
        );

        return;

      }


      try {

        setLoading(true);

        setError("");


        /* ===================================================
           BUSINESS OWNER LOGIN

           AuthContext handles:

           - API request
           - token validation
           - BUSINESS_OWNER role validation
           - localStorage
           - React user state
        =================================================== */

        const loggedInUser =
          await ownerLogin(
            email,
            password
          );


        console.log(
          "Business owner logged in:",
          {
            id:
              loggedInUser?.id,

            role:
              loggedInUser?.role,

            email:
              loggedInUser?.email,
          }
        );


        /* ===================================================
           FINAL ROLE CHECK
        =================================================== */

        if (
          String(
            loggedInUser?.role ||
            ""
          )
            .trim()
            .toUpperCase() !==
          "BUSINESS_OWNER"
        ) {

          setError(
            "This account is not authorized as a business owner."
          );

          return;

        }


        /* ===================================================
           GO TO OWNER DASHBOARD
        =================================================== */

        navigate(
          "/owner/dashboard",
          {
            replace: true,
          }
        );

      } catch (error) {

        console.error(
          "Owner login error:",
          error
        );


        /* ===================================================
           SERVER RESPONSE ERROR
        =================================================== */

        if (
          error.response
        ) {

          setError(
            error.response.data?.message ||
            "Business owner login failed."
          );

        }


        /* ===================================================
           SERVER NOT REACHABLE
        =================================================== */

        else if (
          error.request
        ) {

          setError(
            "Unable to connect to the server. Please make sure the backend is running."
          );

        }


        /* ===================================================
           AUTH / VALIDATION ERROR
        =================================================== */

        else {

          setError(
            error.message ||
            "Something went wrong. Please try again."
          );

        }

      } finally {

        setLoading(false);

      }

    };


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <div className="owner-login-page">

      <div className="owner-login-card">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="owner-login-header">

          <div className="owner-logo">

            <FaLock />

          </div>


          <h1>
            Business Owner
          </h1>


          <p>
            Sign in to manage your business
          </p>

        </div>


        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={
            handleSubmit
          }
        >


          {/* =================================================
              ERROR
          ================================================= */}

          {error && (

            <div
              className="owner-login-error"
            >
              {error}
            </div>

          )}


          {/* =================================================
              EMAIL
          ================================================= */}

          <div
            className="owner-input-group"
          >

            <label
              htmlFor="owner-email"
            >
              Email Address
            </label>


            <div
              className="owner-input-wrapper"
            >

              <FaEnvelope />


              <input
                id="owner-email"
                type="email"
                name="email"
                placeholder="Enter owner email"
                value={
                  formData.email
                }
                onChange={
                  handleChange
                }
                autoComplete="email"
                disabled={
                  loading
                }
                required
              />

            </div>

          </div>


          {/* =================================================
              PASSWORD
          ================================================= */}

          <div
            className="owner-input-group"
          >

            <label
              htmlFor="owner-password"
            >
              Password
            </label>


            <div
              className="owner-input-wrapper"
            >

              <FaLock
                className="owner-password-lock-icon"
              />


              <input
                id="owner-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                placeholder="Enter password"
                value={
                  formData.password
                }
                onChange={
                  handleChange
                }
                autoComplete="current-password"
                disabled={
                  loading
                }
                required
              />


              <button
                type="button"
                className="owner-password-toggle"
                onClick={() =>
                  setShowPassword(
                    (prev) =>
                      !prev
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                disabled={
                  loading
                }
              >

                {showPassword ? (
                  <FaEyeSlash />
                ) : (
                  <FaEye />
                )}

              </button>

            </div>

          </div>


          {/* =================================================
              FORGOT PASSWORD
          ================================================= */}

          <div
            className="owner-forgot-password"
          >

            <Link
              to="/owner/forgot-password"
            >
              Forgot Password?
            </Link>

          </div>


          {/* =================================================
              LOGIN BUTTON
          ================================================= */}

          <button
            type="submit"
            className="owner-login-button"
            disabled={
              loading
            }
          >

            {loading
              ? "Signing in..."
              : "Sign In"}

          </button>


        </form>


        {/* =================================================
            FOOTER
        ================================================= */}

        <div
          className="owner-login-footer"
        >

          <span>
            Keerthana
          </span>


          <small>
            Business Management
          </small>

        </div>


      </div>

    </div>

  );

};


export default BusinessOwnerLogin;

