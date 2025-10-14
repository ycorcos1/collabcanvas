import React from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/Auth/AuthProvider";
import "../components/Auth/Login.css";

export const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, error, isLoading, user } = useAuth();
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
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
      await signIn(formData.email, formData.password);
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

          {(error || localError) && (
            <div className="error-message">{error || localError}</div>
          )}

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? "Loading..." : "Sign In"}
          </button>
        </form>

        <div className="auth-toggle">
          Don't have an account?
          <Link to="/signup" className="toggle-button">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};
