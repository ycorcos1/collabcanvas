import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./components/Auth/AuthProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppRouter } from "./routes/AppRouter";

/**
 * Main App component with routing infrastructure
 * 
 * Architecture:
 * - ErrorBoundary: Catches and handles React errors
 * - AuthProvider: Manages authentication state
 * - Router: Enables client-side routing
 * - AppRouter: Contains all route definitions
 */
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppRouter />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
