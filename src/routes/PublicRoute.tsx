import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../components/Auth/AuthProvider";

interface PublicRouteProps {
  children: React.ReactNode;
  /** Whether to redirect authenticated users (default: true for signin/signup) */
  redirectIfAuthenticated?: boolean;
}

/**
 * Public Route component for pages that don't require authentication
 *
 * Features:
 * - Allows unauthenticated access
 * - Optionally redirects authenticated users (for signin/signup pages)
 * - Handles return URLs for post-authentication navigation
 * - Shows loading state during auth check
 */
export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectIfAuthenticated = true,
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // If user is authenticated and we should redirect
  if (user && redirectIfAuthenticated) {
    // Check if there's a return URL from the location state
    const from = (location.state as any)?.from;

    // Only redirect verified users away from signin/signup
    // Unverified users should stay on signin/signup to see error messages
    const isVerified = !!(user as any)?.emailVerified;
    
    if (isVerified) {
      // Verified users: redirect to dashboard or intended destination
      const redirectTo =
        from && from !== "/signin" && from !== "/signup"
          ? from
          : "/dashboard/recent";
      return <Navigate to={redirectTo} replace />;
    }
    
    // Unverified users: allow them to stay on signin/signup pages
    // so they can see error messages and resend verification
  }

  // Show the public content
  return <>{children}</>;
};
