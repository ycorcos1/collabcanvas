import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../components/Auth/AuthProvider";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protected Route component that requires authentication
 *
 * Features:
 * - Redirects unauthenticated users to sign-in
 * - Preserves intended destination for post-login redirect
 * - Shows loading state during auth check
 * - Handles incomplete user data gracefully
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Checking authentication...</p>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated (and not loading)
  if (!isLoading && !user) {
    return (
      <Navigate to="/signin" state={{ from: location.pathname }} replace />
    );
  }

  // Additional safety check for incomplete user data
  if (!user.id || !user.email) {
    console.warn("Incomplete user data detected in ProtectedRoute");
    return (
      <Navigate to="/signin" state={{ from: location.pathname }} replace />
    );
  }

  // User is authenticated and data is complete
  return <>{children}</>;
};
