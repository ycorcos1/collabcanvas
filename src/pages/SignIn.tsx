import React from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/Auth/AuthProvider";
import { Input, Button } from "../components/shared";

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

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <h1 className="logo-text">Ø</h1>
          </div>
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">Sign in to your HØRIZON account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="Enter your email"
            disabled={isLoading}
            error={error || localError || undefined}
            fullWidth
          />

          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, password: e.target.value }))
            }
            placeholder="Enter your password"
            disabled={isLoading}
            fullWidth
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
          >
            Sign In
          </Button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{" "}
            <Link to="/signup" className="auth-link">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};



