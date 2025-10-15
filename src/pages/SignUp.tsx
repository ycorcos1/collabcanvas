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


  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Join HØRIZON and start collaborating</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="Display Name"
            type="text"
            value={formData.displayName}
            onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
            placeholder="Enter your display name"
            disabled={isLoading}
            error={localError && localError.includes("Display name") ? localError : undefined}
            fullWidth
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Enter your email"
            disabled={isLoading}
            error={error || (localError && !localError.includes("Display name")) ? (error || localError) || undefined : undefined}
            fullWidth
          />

          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            placeholder="Enter your password (min 6 characters)"
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
