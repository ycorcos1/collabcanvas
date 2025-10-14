import React from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/Auth/AuthProvider";
import "../components/Auth/Login.css";

export const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, error, isLoading, user } = useAuth();
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    displayName: "",
  });
  const [localError, setLocalError] = React.useState<string | null>(null);

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    try {
      if (!formData.displayName.trim()) {
        setLocalError("Display name is required");
        return;
      }
      await signUp(formData.email, formData.password, formData.displayName);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setLocalError(err.message || "Authentication failed");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">CollabCanvas</h1>
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

          <div className="form-group">
            <label htmlFor="displayName">Display Name</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              placeholder="Enter your display name"
            />
          </div>

          {(error || localError) && (
            <div className="error-message">{error || localError}</div>
          )}

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? "Loading..." : "Sign Up"}
          </button>
        </form>

        <div className="auth-toggle">
          Already have an account?
          <Link to="/signin" className="toggle-button">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
