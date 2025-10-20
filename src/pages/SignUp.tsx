import React from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/Auth/AuthProvider";
import { Input, Button } from "../components/shared";

export const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, error, isLoading, user } = useAuth();
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    confirmPassword: "",
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

      if (formData.password !== formData.confirmPassword) {
        setLocalError("Passwords do not match");
        return;
      }

      if (formData.password.length < 6) {
        setLocalError("Password must be at least 6 characters");
        return;
      }

      await signUp(formData.email, formData.password, formData.displayName);
      // Redirect to Sign In with a verification banner
      navigate("/signin", { replace: true });
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
          <h2 className="auth-title">Create your account</h2>
          <p className="auth-subtitle">Join HØRIZON and start collaborating</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="Display Name"
            type="text"
            value={formData.displayName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, displayName: e.target.value }))
            }
            placeholder="Enter your display name"
            disabled={isLoading}
            error={
              localError && localError.includes("Display name is required")
                ? localError
                : undefined
            }
            fullWidth
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="Enter your email"
            disabled={isLoading}
            error={error && !localError ? error : undefined}
            fullWidth
          />

          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, password: e.target.value }))
            }
            placeholder="Enter your password (min 6 characters)"
            disabled={isLoading}
            error={
              localError &&
              localError.includes("Password must be at least 6 characters")
                ? localError
                : undefined
            }
            fullWidth
          />

          <Input
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                confirmPassword: e.target.value,
              }))
            }
            placeholder="Confirm your password"
            disabled={isLoading}
            error={
              localError && localError.includes("Passwords do not match")
                ? localError
                : undefined
            }
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
            Create Account
          </Button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <Link to="/signin" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
