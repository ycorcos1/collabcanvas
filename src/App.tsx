import React, { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./components/Auth/AuthProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppRouter } from "./routes/AppRouter";
import { initializeAIAgent } from "./services/aiAgent";
import { memorySync } from "./services/memorySync";

/**
 * Main App component with routing infrastructure
 *
 * Architecture:
 * - ErrorBoundary: Catches and handles React errors
 * - AuthProvider: Manages authentication state
 * - Router: Enables client-side routing with v7 future flags
 * - AppRouter: Contains all route definitions
 */
const App: React.FC = () => {
  // Initialize AI agent on app start
  useEffect(() => {
    initializeAIAgent();
    try {
      memorySync.snapshotFrontend(import.meta.env as any);
    } catch {}
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <AppRouter />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
