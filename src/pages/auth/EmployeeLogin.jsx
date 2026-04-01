import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLoader from "../../components/common/AppLoader";
import companyLogo from "../../assets/opptylogo.png";
import "./EmployeeLogin.css";

// API Base URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const FORGOT_STEPS = {
  EMAIL: "EMAIL",
  OTP: "OTP",
  RESET: "RESET",
  SUCCESS: "SUCCESS",
};

export default function EmployeeLogin() {
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showForgotPopup, setShowForgotPopup] = useState(false);

  const [forgotStep, setForgotStep] = useState(FORGOT_STEPS.EMAIL);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [resetForm, setResetForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const foundEmployee = useMemo(() => {
    // For email validation check only (will be validated on backend)
    return forgotEmail.trim() ? { email: forgotEmail.trim() } : null;
  }, [forgotEmail]);

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setLoginError("");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Store auth token and employee info
      localStorage.setItem(
        "employeeAuth",
        JSON.stringify({
          isAuthenticated: true,
          token: data.token,
          employeeId: data.employee.id,
          email: data.employee.email,
          name: data.employee.name,
          role: data.employee.role
        })
      );

      setTimeout(() => {
        window.location.href = "/chats";
      }, 1800);
    } catch (error) {
      console.error("Login error:", error);
      setLoginError(error.message || "Login failed. Please try again.");
      setIsLoggingIn(false);
    }
  };

  const openForgotPopup = () => {
    setShowForgotPopup(true);
    setForgotStep(FORGOT_STEPS.EMAIL);
    setForgotEmail("");
    setForgotError("");
    setForgotSuccessMsg("");
    setOtpValue("");
    setGeneratedOtp("");
    setResetForm({
      password: "",
      confirmPassword: "",
    });
  };

  const closeForgotPopup = () => {
    setShowForgotPopup(false);
    setForgotStep(FORGOT_STEPS.EMAIL);
    setForgotEmail("");
    setForgotError("");
    setForgotSuccessMsg("");
    setOtpValue("");
    setGeneratedOtp("");
    setResetForm({
      password: "",
      confirmPassword: "",
    });
  };

  const generateOtp = () => {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(otp);
  };

  const handleVerifyEmail = async () => {
    if (!forgotEmail.trim()) {
      setForgotError("Please enter your email.");
      setForgotSuccessMsg("");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: forgotEmail })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      setForgotError("");
      setForgotSuccessMsg(data.message);
      setForgotStep(FORGOT_STEPS.OTP);
    } catch (error) {
      console.error("Verify email error:", error);
      setForgotError(error.message);
      setForgotSuccessMsg("");
    }
  };

  const handleResendOtp = async () => {
    if (!forgotEmail.trim()) {
      setForgotError("Please enter your email.");
      setForgotSuccessMsg("");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: forgotEmail })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend OTP");
      }

      setForgotError("");
      setForgotSuccessMsg(data.message);
      setOtpValue("");
    } catch (error) {
      console.error("Resend OTP error:", error);
      setForgotError(error.message);
      setForgotSuccessMsg("");
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue.trim()) {
      setForgotError("Please enter OTP.");
      setForgotSuccessMsg("");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: forgotEmail,
          otp: otpValue
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid OTP");
      }

      setForgotError("");
      setForgotSuccessMsg("");
      setForgotStep(FORGOT_STEPS.RESET);
    } catch (error) {
      console.error("Verify OTP error:", error);
      setForgotError(error.message);
      setForgotSuccessMsg("");
    }
  };

  const handleResetPassword = async () => {
    if (!resetForm.password || !resetForm.confirmPassword) {
      setForgotError("Please fill all password fields.");
      return;
    }

    if (resetForm.password.length < 6) {
      setForgotError("Password must be at least 6 characters.");
      return;
    }

    if (resetForm.password !== resetForm.confirmPassword) {
      setForgotError("Password and confirm password do not match.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: forgotEmail,
          newPassword: resetForm.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setForgotError("");
      setForgotSuccessMsg("");
      setForgotStep(FORGOT_STEPS.SUCCESS);
    } catch (error) {
      console.error("Reset password error:", error);
      setForgotError(error.message);
    }
  };

  return (
    <>
      <div className="employee-login-page">
        <div className="employee-login-card">
          <div className="employee-login-header">
            <img src={companyLogo} alt="Company Logo" className="company-login-logo" />
            <h1>Oppty Connect</h1>
            <p>Login to access your chat dashboard</p>
          </div>

          <form className="employee-login-form" onSubmit={handleLoginSubmit}>
            <div className="auth-input-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={loginForm.email}
                onChange={handleLoginChange}
                placeholder="Enter your email"
              />
            </div>

            <div className="auth-input-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                placeholder="Enter your password"
              />
            </div>

            {loginError && <div className="auth-error-msg">{loginError}</div>}

            <button type="submit" className="auth-primary-btn" disabled={isLoggingIn}>
              Login
            </button>

            <button
              type="button"
              className="forgot-password-btn"
              onClick={openForgotPopup}
              disabled={isLoggingIn}
            >
              Forgot Password?
            </button>
          </form>
        </div>

        {showForgotPopup && (
          <div className="auth-popup-overlay" onClick={closeForgotPopup}>
            <div
              className="auth-popup-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="auth-popup-top">
                <h2>Forgot Password</h2>
                <button
                  type="button"
                  className="auth-close-btn"
                  onClick={closeForgotPopup}
                >
                  ✕
                </button>
              </div>

              {forgotStep === FORGOT_STEPS.EMAIL && (
                <div className="auth-popup-body">
                  <p className="auth-popup-desc">
                    Enter your employee email to verify your account.
                  </p>

                  <div className="auth-input-group">
                    <label>Email Verification</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        setForgotError("");
                        setForgotSuccessMsg("");
                      }}
                      placeholder="Enter registered email"
                    />
                  </div>

                  {forgotError && <div className="auth-error-msg">{forgotError}</div>}
                  {forgotSuccessMsg && <div className="auth-success-msg">{forgotSuccessMsg}</div>}

                  <div className="auth-popup-actions">
                    <button
                      type="button"
                      className="auth-secondary-btn"
                      onClick={closeForgotPopup}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="auth-primary-btn"
                      onClick={handleVerifyEmail}
                    >
                      Verify Email
                    </button>
                  </div>
                </div>
              )}

              {forgotStep === FORGOT_STEPS.OTP && (
                <div className="auth-popup-body">
                  <p className="auth-popup-desc">
                    Enter the OTP sent to <strong>{forgotEmail}</strong>
                  </p>

                  <div className="auth-input-group">
                    <label>OTP Verification</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpValue}
                      onChange={(e) => {
                        setOtpValue(e.target.value);
                        setForgotError("");
                        setForgotSuccessMsg("");
                      }}
                      placeholder="Enter 6-digit OTP"
                    />
                  </div>

                  <button
                    type="button"
                    className="resend-otp-btn"
                    onClick={handleResendOtp}
                  >
                    Resend OTP
                  </button>

                  {forgotError && <div className="auth-error-msg">{forgotError}</div>}
                  {forgotSuccessMsg && <div className="auth-success-msg">{forgotSuccessMsg}</div>}

                  <div className="auth-popup-actions">
                    <button
                      type="button"
                      className="auth-secondary-btn"
                      onClick={() => {
                        setForgotStep(FORGOT_STEPS.EMAIL);
                        setForgotError("");
                        setForgotSuccessMsg("");
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className="auth-primary-btn"
                      onClick={handleVerifyOtp}
                    >
                      Verify OTP
                    </button>
                  </div>
                </div>
              )}

              {forgotStep === FORGOT_STEPS.RESET && (
                <div className="auth-popup-body">
                  <p className="auth-popup-desc">
                    Set a new password for your account.
                  </p>

                  <div className="auth-input-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={resetForm.password}
                      onChange={(e) => {
                        setResetForm((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }));
                        setForgotError("");
                      }}
                      placeholder="Enter new password"
                    />
                  </div>

                  <div className="auth-input-group">
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      value={resetForm.confirmPassword}
                      onChange={(e) => {
                        setResetForm((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }));
                        setForgotError("");
                      }}
                      placeholder="Confirm new password"
                    />
                  </div>

                  {forgotError && <div className="auth-error-msg">{forgotError}</div>}

                  <div className="auth-popup-actions">
                    <button
                      type="button"
                      className="auth-secondary-btn"
                      onClick={() => {
                        setForgotStep(FORGOT_STEPS.OTP);
                        setForgotError("");
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className="auth-primary-btn"
                      onClick={handleResetPassword}
                    >
                      Set Password
                    </button>
                  </div>
                </div>
              )}

              {forgotStep === FORGOT_STEPS.SUCCESS && (
                <div className="auth-popup-body auth-success-body">
                  <div className="auth-success-icon">✓</div>
                  <h3>Password Updated Successfully</h3>
                  <p>Your password has been reset. Please login again.</p>

                  <div className="auth-popup-actions auth-popup-actions-center">
                    <button
                      type="button"
                      className="auth-primary-btn"
                      onClick={closeForgotPopup}
                    >
                      Back to Login
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isLoggingIn && (
  <AppLoader
    title="Signing you in..."
    subtitle="Preparing your dashboard securely"
  />
)}
    </>
  );
}