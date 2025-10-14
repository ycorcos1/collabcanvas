import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./components/Auth/AuthProvider";
import { Login } from "./components/Auth/Login";
import { Canvas } from "./components/Canvas/Canvas";
import { Toolbar } from "./components/Toolbar/Toolbar";
import { UserPresence } from "./components/Presence/UserPresence";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useShapes } from "./hooks/useShapes";
import { Shape } from "./types/shape";
import "./App.css";

const AppContent: React.FC = () => {
  const { user, isLoading, signOut } = useAuth();
  const { clearAllShapes } = useShapes();
  // Persist selected tool across page refreshes (using sessionStorage)
  const [selectedTool, setSelectedTool] = useState<Shape["type"] | null>(() => {
    const saved = sessionStorage.getItem('collabcanvas-selected-tool');
    return saved ? (saved as Shape["type"]) : null;
  });

  // Save selected tool to sessionStorage when it changes
  useEffect(() => {
    if (selectedTool) {
      sessionStorage.setItem('collabcanvas-selected-tool', selectedTool);
    } else {
      sessionStorage.removeItem('collabcanvas-selected-tool');
    }
  }, [selectedTool]);

  // Reset selected tool when user signs out (but not when signing back in)
  useEffect(() => {
    // Only reset if user becomes null AND we're not in the initial loading state
    if (!user && !isLoading) {
      setSelectedTool(null);
    }
  }, [user, isLoading]);

  const handleToolSelect = (tool: Shape["type"] | null) => {
    setSelectedTool(tool);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="app">
      {/* Connection Status */}
      <ConnectionStatus />

      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <h1>CollabCanvas</h1>
        </div>
        <div className="header-right">
          <span className="user-info">Welcome, {user.displayName}</span>
          <button className="sign-out-button" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <Toolbar
        selectedTool={selectedTool}
        onToolSelect={handleToolSelect}
        onClearAll={clearAllShapes}
      />

      {/* User Presence */}
      <UserPresence />

      {/* Canvas */}
      <Canvas selectedTool={selectedTool} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
