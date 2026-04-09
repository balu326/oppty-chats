import React, { useMemo, useState } from "react";
import AppLoader from "../../components/common/AppLoader";
import companyLogo from "../../assets/opptylogo.png";
import "./EmployeeLogin.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const FORGOT_STEPS = { EMAIL: "EMAIL", OTP: "OTP", RESET: "RESET", SUCCESS: "SUCCESS" };

export default function EmployeeLogin() {
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showForgotPopup, setShowForgotPopup] = useState(false);
  const [forgotStep, setForgotStep] = useState(FORGOT_STEPS.EMAIL);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [resetForm, setResetForm] = useState({ password: "", confirmPassword: "" });

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
    setLoginError("");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    const attempt = async () => {
      return fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginForm.email, password: loginForm.password }),
        signal: AbortSignal.timeout(30000),
      });
    };

    try {
      let response;
      try {
        response = await attempt();
      } catch (err) {
        if (err instanceof TypeError || err.name === "TimeoutError") {
          setLoginError("Server is waking up, retrying...");
          await new Promise((r) => setTimeout(r, 5000));
          setLoginError("");
          response = await attempt();
        } else throw err;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");

      localStorage.setItem("employeeAuth", JSON.stringify({
        isAuthenticated: true,
        token: data.token,
        employeeId: data.employee.id,
        email: data.employee.email,
        name: data.employee.name,
        role: data.employee.role,
        canCreateGroups: data.employee.canCreateGroups,
      }));

      setTimeout(() => { window.location.href = "/chats"; }, 1500);
    } catch (error) {
      setLoginError(
        error instanceof TypeError || error.name === "TimeoutError"
          ? "Unable to connect. Please try again."
          : error.message || "Login failed. Please try again."
      );
      setIsLoggingIn(false);
    }
  };

  const resetForgot = () => {
    setForgotStep(FORGOT_STEPS.EMAIL);
    setForgotEmail(""); setForgotError(""); setForgotSuccessMsg("");
    setOtpValue(""); setResetForm({ password: "", confirmPassword: "" });
  };

  const openForgotPopup = () => { setShowForgotPopup(true); resetForgot(); };
  const closeForgotPopup = () => { setShowForgotPopup(false); resetForgot(); };

  const handleVerifyEmail = async () => {
    if (!forgotEmail.trim()) return setForgotError("Please enter your email.");
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");
      setForgotError(""); setForgotSuccessMsg(data.message);
      setForgotStep(FORGOT_STEPS.OTP);
    } catch (err) { setForgotError(err.message); setForgotSuccessMsg(""); }
  };

  const handleResendOtp = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setForgotError(""); setForgotSuccessMsg(data.message); setOtpValue("");
    } catch (err) { setForgotError(err.message); }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue.trim()) return setForgotError("Please enter OTP.");
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp: otpValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid OTP");
      setForgotError(""); setForgotStep(FORGOT_STEPS.RESET);
    } catch (err) { setForgotError(err.message); }
  };

  const handleResetPassword = async () => {
    if (!resetForm.password || !resetForm.confirmPassword) return setForgotError("Please fill all fields.");
    if (resetForm.password.length < 6) return setForgotError("Password must be at least 6 characters.");
    if (resetForm.password !== resetForm.confirmPassword) return setForgotError("Passwords do not match.");
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, newPassword: resetForm.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setForgotError(""); setForgotStep(FORGOT_STEPS.SUCCESS);
    } catch (err) { setForgotError(err.message); }
  };

  return (
    <>
      <div className="login-page">

        {/* Left branding panel */}
        <div className="login-left">
          <div className="login-brand">
            <img src={companyLogo} alt="Oppty" className="login-brand-logo" />
            <h2>Oppty Connect</h2>
            <p>Your team's communication hub — fast, simple, and always in sync.</p>
            <div className="login-brand-dots">
              <span /><span /><span />
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="login-right">
          <div className="login-card">
            <div className="login-header">
              <h1>Welcome back 👋</h1>
              <p>Sign in to your account to continue</p>
            </div>

            <form className="login-form" onSubmit={handleLoginSubmit}>
            <div className="field">
              <label>Email</label>
              <input type="email" name="email" value={loginForm.email}
                onChange={handleLoginChange} placeholder="Enter your email" />
            </div>

            <div className="field">
              <label>Password</label>
              <input type="password" name="password" value={loginForm.password}
                onChange={handleLoginChange} placeholder="Enter your password" />
            </div>

            {loginError && <div className="error-msg">{loginError}</div>}

            <button type="submit" className="btn-primary" disabled={isLoggingIn}>
              {isLoggingIn ? "Signing in..." : "Login"}
            </button>

            <button type="button" className="btn-forgot" onClick={openForgotPopup} disabled={isLoggingIn}>
              Forgot Password?
            </button>
          </form>
          </div>
        </div>

        {showForgotPopup && (
          <div className="popup-overlay" onClick={closeForgotPopup}>
            <div className="popup-card" onClick={(e) => e.stopPropagation()}>
              <div className="popup-top">
                <h2>Forgot Password</h2>
                <button className="btn-close" onClick={closeForgotPopup}>✕</button>
              </div>

              {forgotStep === FORGOT_STEPS.EMAIL && (
                <div className="popup-body">
                  <p className="popup-desc">Enter your email to receive a reset OTP.</p>
                  <div className="field">
                    <label>Email</label>
                    <input type="email" value={forgotEmail}
                      onChange={(e) => { setForgotEmail(e.target.value); setForgotError(""); }}
                      placeholder="Enter registered email" />
                  </div>
                  {forgotError && <div className="error-msg">{forgotError}</div>}
                  {forgotSuccessMsg && <div className="success-msg">{forgotSuccessMsg}</div>}
                  <div className="popup-actions">
                    <button className="btn-secondary" onClick={closeForgotPopup}>Cancel</button>
                    <button className="btn-primary" onClick={handleVerifyEmail}>Send OTP</button>
                  </div>
                </div>
              )}

              {forgotStep === FORGOT_STEPS.OTP && (
                <div className="popup-body">
                  <p className="popup-desc">OTP sent to <strong>{forgotEmail}</strong></p>
                  <div className="field">
                    <label>OTP</label>
                    <input type="text" maxLength={6} value={otpValue}
                      onChange={(e) => { setOtpValue(e.target.value); setForgotError(""); }}
                      placeholder="Enter 6-digit OTP" />
                  </div>
                  <button className="btn-link" onClick={handleResendOtp}>Resend OTP</button>
                  {forgotError && <div className="error-msg">{forgotError}</div>}
                  {forgotSuccessMsg && <div className="success-msg">{forgotSuccessMsg}</div>}
                  <div className="popup-actions">
                    <button className="btn-secondary" onClick={() => { setForgotStep(FORGOT_STEPS.EMAIL); setForgotError(""); }}>Back</button>
                    <button className="btn-primary" onClick={handleVerifyOtp}>Verify OTP</button>
                  </div>
                </div>
              )}

              {forgotStep === FORGOT_STEPS.RESET && (
                <div className="popup-body">
                  <p className="popup-desc">Set a new password for your account.</p>
                  <div className="field">
                    <label>New Password</label>
                    <input type="password" value={resetForm.password}
                      onChange={(e) => { setResetForm(p => ({ ...p, password: e.target.value })); setForgotError(""); }}
                      placeholder="New password" />
                  </div>
                  <div className="field">
                    <label>Confirm Password</label>
                    <input type="password" value={resetForm.confirmPassword}
                      onChange={(e) => { setResetForm(p => ({ ...p, confirmPassword: e.target.value })); setForgotError(""); }}
                      placeholder="Confirm password" />
                  </div>
                  {forgotError && <div className="error-msg">{forgotError}</div>}
                  <div className="popup-actions">
                    <button className="btn-secondary" onClick={() => { setForgotStep(FORGOT_STEPS.OTP); setForgotError(""); }}>Back</button>
                    <button className="btn-primary" onClick={handleResetPassword}>Set Password</button>
                  </div>
                </div>
              )}

              {forgotStep === FORGOT_STEPS.SUCCESS && (
                <div className="popup-body popup-success">
                  <div className="success-icon">✓</div>
                  <h3>Password Updated</h3>
                  <p>Your password has been reset. Please login again.</p>
                  <button className="btn-primary" onClick={closeForgotPopup}>Back to Login</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isLoggingIn && <AppLoader title="Signing you in..." subtitle="Preparing your dashboard" />}
    </>
  );
}
