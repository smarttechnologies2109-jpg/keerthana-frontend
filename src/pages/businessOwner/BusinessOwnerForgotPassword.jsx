import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaEnvelope,
  FaKey,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowLeft,
} from "react-icons/fa";

import API from "../../services/api";
import "../../assets/css/businessowner/BusinessOwnerForgotPassword.css";

const BusinessOwnerForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // ==========================================
  // STEP 1 - SEND OTP
  // ==========================================

  const handleSendOTP = async (e) => {
    e.preventDefault();

    const email = formData.email.trim();

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await API.post(
        "/auth/owner/forgot-password",
        {
          email,
        }
      );

      setSuccess(
        response.data?.message ||
          "If a Business Owner account exists for this email, an OTP has been sent."
      );

      setStep(2);

    } catch (error) {
      console.error(
        "Send Owner OTP Error:",
        error
      );

      if (error.response) {
        setError(
          error.response.data?.message ||
            "Unable to send OTP."
        );
      } else if (error.request) {
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

  // ==========================================
  // STEP 2 - VERIFY OTP
  // ==========================================

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    const email = formData.email.trim();
    const otp = formData.otp.trim();

    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("OTP must be a 6-digit number.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await API.post(
        "/auth/owner/verify-otp",
        {
          email,
          otp,
        }
      );

      setSuccess(
        response.data?.message ||
          "OTP verified successfully."
      );

      setStep(3);

    } catch (error) {
      console.error(
        "Verify Owner OTP Error:",
        error
      );

      if (error.response) {
        setError(
          error.response.data?.message ||
            "Invalid OTP."
        );
      } else if (error.request) {
        setError(
          "Unable to connect to the server."
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

  // ==========================================
  // STEP 3 - RESET PASSWORD
  // ==========================================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    const email = formData.email.trim();
    const password = formData.password;
    const confirmPassword =
      formData.confirmPassword;

    if (!password) {
      setError("Please enter a new password.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (!confirmPassword) {
      setError(
        "Please confirm your new password."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await API.post(
        "/auth/owner/reset-password",
        {
          email,
          password,
          confirmPassword,
        }
      );

      setSuccess(
        response.data?.message ||
          "Password reset successfully."
      );

      setTimeout(() => {
        navigate("/owner/login");
      }, 1500);

    } catch (error) {
      console.error(
        "Reset Owner Password Error:",
        error
      );

      if (error.response) {
        setError(
          error.response.data?.message ||
            "Unable to reset password."
        );
      } else if (error.request) {
        setError(
          "Unable to connect to the server."
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

  // ==========================================
  // BACK TO LOGIN
  // ==========================================

  const handleBackToLogin = () => {
    navigate("/owner/login");
  };

  return (
    <div className="owner-forgot-page">

      <div className="owner-forgot-card">

        {/* HEADER */}
        <div className="owner-forgot-header">

          <div className="owner-forgot-logo">
            {step === 1 && <FaEnvelope />}
            {step === 2 && <FaKey />}
            {step === 3 && <FaLock />}
          </div>

          <h1>
            {step === 1 && "Forgot Password"}
            {step === 2 && "Verify OTP"}
            {step === 3 && "Reset Password"}
          </h1>

          <p>
            {step === 1 &&
              "Enter your Business Owner email address"}

            {step === 2 &&
              "Enter the 6-digit OTP sent to your email"}

            {step === 3 &&
              "Create a new password for your account"}
          </p>

        </div>

        {/* STEP INDICATOR */}
        <div className="owner-step-indicator">

          <div
            className={`owner-step ${
              step >= 1 ? "active" : ""
            }`}
          >
            <span>1</span>
            <small>Email</small>
          </div>

          <div
            className={`owner-step-line ${
              step >= 2 ? "active" : ""
            }`}
          />

          <div
            className={`owner-step ${
              step >= 2 ? "active" : ""
            }`}
          >
            <span>2</span>
            <small>OTP</small>
          </div>

          <div
            className={`owner-step-line ${
              step >= 3 ? "active" : ""
            }`}
          />

          <div
            className={`owner-step ${
              step >= 3 ? "active" : ""
            }`}
          >
            <span>3</span>
            <small>Password</small>
          </div>

        </div>

        {/* ERROR */}
        {error && (
          <div className="owner-forgot-error">
            {error}
          </div>
        )}

        {/* SUCCESS */}
        {success && (
          <div className="owner-forgot-success">
            {success}
          </div>
        )}

        {/* ==========================================
            STEP 1
        ========================================== */}

        {step === 1 && (
          <form onSubmit={handleSendOTP}>

            <div className="owner-forgot-input-group">

              <label htmlFor="forgot-email">
                Email Address
              </label>

              <div className="owner-forgot-input-wrapper">

                <FaEnvelope />

                <input
                  id="forgot-email"
                  type="email"
                  name="email"
                  placeholder="Enter owner email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  disabled={loading}
                  required
                />

              </div>

            </div>

            <button
              type="submit"
              className="owner-forgot-button"
              disabled={loading}
            >
              {loading
                ? "Sending OTP..."
                : "Send OTP"}
            </button>

          </form>
        )}

        {/* ==========================================
            STEP 2
        ========================================== */}

        {step === 2 && (
          <form onSubmit={handleVerifyOTP}>

            <div className="owner-forgot-input-group">

              <label htmlFor="forgot-otp">
                Verification OTP
              </label>

              <div className="owner-forgot-input-wrapper">

                <FaKey />

                <input
                  id="forgot-otp"
                  type="text"
                  name="otp"
                  placeholder="Enter 6-digit OTP"
                  value={formData.otp}
                  onChange={handleChange}
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  disabled={loading}
                  required
                />

              </div>

            </div>

            <button
              type="submit"
              className="owner-forgot-button"
              disabled={loading}
            >
              {loading
                ? "Verifying..."
                : "Verify OTP"}
            </button>

            <button
              type="button"
              className="owner-secondary-button"
              onClick={() => {
                setStep(1);
                setError("");
                setSuccess("");
              }}
              disabled={loading}
            >
              Change Email
            </button>

          </form>
        )}

        {/* ==========================================
            STEP 3
        ========================================== */}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>

            {/* NEW PASSWORD */}

            <div className="owner-forgot-input-group">

              <label htmlFor="forgot-password">
                New Password
              </label>

              <div className="owner-forgot-input-wrapper">

                <FaLock />

                <input
                  id="forgot-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="Enter new password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  className="owner-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (prev) => !prev
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
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

            {/* CONFIRM PASSWORD */}

            <div className="owner-forgot-input-group">

              <label htmlFor="forgot-confirm-password">
                Confirm Password
              </label>

              <div className="owner-forgot-input-wrapper">

                <FaLock />

                <input
                  id="forgot-confirm-password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={
                    formData.confirmPassword
                  }
                  onChange={handleChange}
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  className="owner-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      (prev) => !prev
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <FaEyeSlash />
                  ) : (
                    <FaEye />
                  )}
                </button>

              </div>

            </div>

            <button
              type="submit"
              className="owner-forgot-button"
              disabled={loading}
            >
              {loading
                ? "Resetting Password..."
                : "Reset Password"}
            </button>

          </form>
        )}

        {/* BACK TO LOGIN */}

        <button
          type="button"
          className="owner-back-login"
          onClick={handleBackToLogin}
          disabled={loading}
        >
          <FaArrowLeft />
          Back to Business Owner Login
        </button>

        {/* FOOTER */}

        <div className="owner-forgot-footer">
          <span>Keerthana</span>
          <small>Business Management</small>
        </div>

      </div>

    </div>
  );
};

export default BusinessOwnerForgotPassword;
