import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import "./Login.css";

export const Login: React.FC = () => {
  const { signIn, signUp, error, isLoading } = useAuth();
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Check if redirected due to verification needed
      const needsVerification = sessionStorage.getItem("auth:needsVerification");
      if (needsVerification === "true") {
        setInfo(
          "Email verification required. Please verify your email to access protected content."
        );
        sessionStorage.removeItem("auth:needsVerification");
      } else if (sessionStorage.getItem("auth:verificationSent") === "true") {
        setInfo(
          "Verification email sent! Please check your inbox (including spam folder). The link expires in 1 hour."
        );
        sessionStorage.removeItem("auth:verificationSent");
      }
      
      // Check location state for verification flag
      const locationState = location.state as any;
      if (locationState?.needsVerification) {
        setInfo(
          "Email verification required. Please verify your email to continue."
        );
      }
    } catch {}
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Errors are handled by AuthProvider and set in the error state
    // No need to catch here - just call the auth functions
    if (isSignUp) {
      if (!formData.displayName.trim()) {
        setLocalError("Display name is required");
        return;
      }
      await signUp(formData.email, formData.password, formData.displayName);
    } else {
      await signIn(formData.email, formData.password);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">HØRIZON</h1>
        <p className="login-subtitle">Real-time collaborative canvas</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              placeholder="Enter your password"
              minLength={6}
            />
          </div>

          {isSignUp && (
            <div className="form-group">
              <label htmlFor="displayName">Display Name</label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                required={isSignUp}
                disabled={isLoading}
                placeholder="Enter your display name"
              />
            </div>
          )}

          <div className="auth-message-slot">
            {info && <div className="info-message">{info}</div>}
            {(error || localError) && (
              <div className="error-message">
                {error || localError}
                {(error || localError)
                  ?.toLowerCase()
                  ?.includes("no account") && (
                  <div style={{ marginTop: "8px" }}>
                    <span style={{ fontSize: "0.85rem" }}>
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setIsSignUp(true)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#667eea",
                          textDecoration: "underline",
                          cursor: "pointer",
                          padding: 0,
                          font: "inherit",
                        }}
                      >
                        Sign up here
                      </button>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          {error?.toLowerCase()?.includes("verify") && (
            <div className="info-message">
              Didn’t receive the email? Check spam or try again in a minute.
            </div>
          )}

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <div className="auth-toggle">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
          <button
            type="button"
            className="toggle-button"
            onClick={() => setIsSignUp(!isSignUp)}
            disabled={isLoading}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};
