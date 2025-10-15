import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../components/Auth/AuthProvider';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';

// Lazy load pages for better performance
const HomePage = React.lazy(() => import('../pages/HomePage'));
const SignInPage = React.lazy(() => import('../pages/SignInPage'));
const SignUpPage = React.lazy(() => import('../pages/SignUpPage'));
const DashboardPage = React.lazy(() => import('../pages/DashboardPage'));
const CanvasPage = React.lazy(() => import('../pages/CanvasPage'));
const NotFound = React.lazy(() => import('../pages/NotFound'));

/**
 * Root redirect component - handles initial navigation based on auth state
 */
const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect to dashboard if logged in, otherwise to homepage
  return <Navigate to={user ? "/dashboard/recent" : "/"} replace />;
};

/**
 * Loading fallback component for lazy-loaded routes
 */
const LoadingFallback: React.FC = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Loading page...</p>
  </div>
);

/**
 * Main application router with lazy loading and protected routes
 * 
 * Route Structure:
 * - / → Homepage (public) or redirect to dashboard if authenticated
 * - /signin → Sign in page (public only)
 * - /signup → Sign up page (public only)
 * - /dashboard/* → Dashboard with nested routes (protected)
 * - /canvas/:slug → Canvas page (protected)
 * - * → 404 Not Found
 */
export const AppRouter: React.FC = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Root redirect */}
        <Route path="/app" element={<RootRedirect />} />
        
        {/* Public routes */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <HomePage />
            </PublicRoute>
          }
        />
        
        <Route
          path="/signin"
          element={
            <PublicRoute>
              <SignInPage />
            </PublicRoute>
          }
        />
        
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignUpPage />
            </PublicRoute>
          }
        />
        
        {/* Protected routes */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/canvas/:slug"
          element={
            <ProtectedRoute>
              <CanvasPage />
            </ProtectedRoute>
          }
        />
        
        {/* 404 fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};
