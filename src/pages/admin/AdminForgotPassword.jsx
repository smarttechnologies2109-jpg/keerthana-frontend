import { useState } from "react";
import { useNavigate } from "react-router-dom";

import API from "../../services/api";
import "../../assets/css/admin/AdminForgotPassword.css";

const AdminForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* =========================================================
     CLEAR MESSAGES
  ========================================================= */

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  /* =========================================================
     SEND OTP
  ========================================================= */

  const handleSendOTP = async (e) => {
    e.preventDefault();

    clearMessages();

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter your admin email.");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post(
        "/auth/admin/forgot-password",
        {
          email: cleanEmail,
        }
      );

      setSuccess(
        response.data?.message ||
          "If an admin account exists for this email, an OTP has been sent."
      );

      setStep(2);

    } catch (err) {
      console.error(
        "Admin forgot password error:",
        err
      );

      if (err.response) {
        setError(
          err.response.data?.message ||
            "Unable to send OTP."
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

  /* =========================================================
     VERIFY OTP
  ========================================================= */

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    clearMessages();

    const cleanEmail = email.trim();
    const cleanOTP = otp.trim();

    if (!cleanOTP) {
      setError("Please enter the OTP.");
      return;
    }

    if (!/^\d{6}$/.test(cleanOTP)) {
      setError("OTP must be a 6-digit number.");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post(
        "/auth/admin/verify-otp",
        {
          email: cleanEmail,
          otp: cleanOTP,
        }
      );

      setSuccess(
        response.data?.message ||
          "OTP verified successfully."
      );

      setStep(3);

    } catch (err) {
      console.error(
        "Admin OTP verification error:",
        err
      );

      if (err.response) {
        setError(
          err.response.data?.message ||
            "Invalid OTP."
        );
      } else if (err.request) {
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

  /* =========================================================
     RESET PASSWORD
  ========================================================= */

  const handleResetPassword = async (e) => {
    e.preventDefault();

    clearMessages();

    const cleanEmail = email.trim();

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

      const response = await API.post(
        "/auth/admin/reset-password",
        {
          email: cleanEmail,
          password,
          confirmPassword,
        }
      );

      setSuccess(
        response.data?.message ||
          "Admin password reset successfully."
      );

      setTimeout(() => {
        navigate("/admin/login");
      }, 1500);

    } catch (err) {
      console.error(
        "Admin password reset error:",
        err
      );

      if (err.response) {
        setError(
          err.response.data?.message ||
            "Unable to reset password."
        );
      } else if (err.request) {
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

  /* =========================================================
     BACK TO LOGIN
  ========================================================= */

  const handleBackToLogin = () => {
    navigate("/admin/login");
  };

  /* =========================================================
     CHANGE EMAIL
  ========================================================= */

  const handleChangeEmail = () => {
    setStep(1);
    setOtp("");
    clearMessages();
  };

  return (
    <div className="admin-forgot-page">

      <div className="admin-forgot-card">

        {/* ===================================================
            HEADER
        ==================================================== */}

        <div className="admin-forgot-header">

          <div className="admin-forgot-logo">
            {step === 1 && "@"}
            {step === 2 && "✓"}
            {step === 3 && "🔒"}
          </div>

          <h1>
            {step === 1 && "Forgot Password"}
            {step === 2 && "Verify OTP"}
            {step === 3 && "Reset Password"}
          </h1>

          <p>
            {step === 1 &&
              "Enter your admin email address"}

            {step === 2 &&
              "Enter the 6-digit OTP sent to your email"}

            {step === 3 &&
              "Create a new password for your admin account"}
          </p>

        </div>


        {/* ===================================================
            STEP INDICATOR
        ==================================================== */}

        <div className="admin-step-indicator">

          <div
            className={`admin-step ${
              step >= 1 ? "active" : ""
            }`}
          >
            <span>1</span>
            <small>Email</small>
          </div>

          <div
            className={`admin-step-line ${
              step >= 2 ? "active" : ""
            }`}
          />

          <div
            className={`admin-step ${
              step >= 2 ? "active" : ""
            }`}
          >
            <span>2</span>
            <small>OTP</small>
          </div>

          <div
            className={`admin-step-line ${
              step >= 3 ? "active" : ""
            }`}
          />

          <div
            className={`admin-step ${
              step >= 3 ? "active" : ""
            }`}
          >
            <span>3</span>
            <small>Password</small>
          </div>

        </div>


        {/* ===================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="admin-forgot-error">
            {error}
          </div>
        )}


        {/* ===================================================
            SUCCESS
        ==================================================== */}

        {success && (
          <div className="admin-forgot-success">
            {success}
          </div>
        )}


        {/* ===================================================
            STEP 1 - EMAIL
        ==================================================== */}

        {step === 1 && (
          <form onSubmit={handleSendOTP}>

            <div className="admin-forgot-input-group">

              <label htmlFor="admin-forgot-email">
                Admin Email Address
              </label>

              <input
                id="admin-forgot-email"
                type="email"
                placeholder="Enter admin email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearMessages();
                }}
                autoComplete="email"
                disabled={loading}
                required
              />

            </div>

            <button
              type="submit"
              className="admin-forgot-button"
              disabled={loading}
            >
              {loading
                ? "Sending OTP..."
                : "Send OTP"}
            </button>

          </form>
        )}


        {/* ===================================================
            STEP 2 - OTP
        ==================================================== */}

        {step === 2 && (
          <form onSubmit={handleVerifyOTP}>

            <div className="admin-forgot-input-group">

              <label htmlFor="admin-forgot-otp">
                Verification OTP
              </label>

              <input
                id="admin-forgot-otp"
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => {
                  const value =
                    e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6);

                  setOtp(value);
                  clearMessages();
                }}
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                disabled={loading}
                required
              />

            </div>

            <button
              type="submit"
              className="admin-forgot-button"
              disabled={loading}
            >
              {loading
                ? "Verifying..."
                : "Verify OTP"}
            </button>

            <button
              type="button"
              className="admin-secondary-button"
              onClick={handleChangeEmail}
              disabled={loading}
            >
              Change Email
            </button>

          </form>
        )}


        {/* ===================================================
            STEP 3 - NEW PASSWORD
        ==================================================== */}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>

            {/* NEW PASSWORD */}

            <div className="admin-forgot-input-group">

              <label htmlFor="admin-new-password">
                New Password
              </label>

              <div className="admin-forgot-password-wrapper">

                <input
                  id="admin-new-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearMessages();
                  }}
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  className="admin-forgot-password-toggle"
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
                  {showPassword ? "◉" : "◌"}
                </button>

              </div>

            </div>


            {/* CONFIRM PASSWORD */}

            <div className="admin-forgot-input-group">

              <label htmlFor="admin-confirm-password">
                Confirm Password
              </label>

              <div className="admin-forgot-password-wrapper">

                <input
                  id="admin-confirm-password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(
                      e.target.value
                    );
                    clearMessages();
                  }}
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  className="admin-forgot-password-toggle"
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
                  {showConfirmPassword
                    ? "◉"
                    : "◌"}
                </button>

              </div>

            </div>


            <button
              type="submit"
              className="admin-forgot-button"
              disabled={loading}
            >
              {loading
                ? "Resetting Password..."
                : "Reset Password"}
            </button>

          </form>
        )}


        {/* ===================================================
            BACK TO LOGIN
        ==================================================== */}

        <button
          type="button"
          className="admin-back-login"
          onClick={handleBackToLogin}
          disabled={loading}
        >
          ← Back to Admin Login
        </button>


        {/* ===================================================
            FOOTER
        ==================================================== */}

        <div className="admin-forgot-footer">

          <span>
            KEERTHANA
          </span>

          <small>
            Admin Panel
          </small>

        </div>

      </div>

    </div>
  );
};

export default AdminForgotPassword;