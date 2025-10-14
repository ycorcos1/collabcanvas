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
  // Persist selected tool across page refreshes
  const [selectedTool, setSelectedTool] = useState<Shape["type"] | null>(() => {
    const saved = localStorage.getItem('collabcanvas-selected-tool');
    return saved ? (saved as Shape["type"]) : null;
  });

  // Save selected tool to localStorage when it changes
  useEffect(() => {
    if (selectedTool) {
      localStorage.setItem('collabcanvas-selected-tool', selectedTool);
    } else {
      localStorage.removeItem('collabcanvas-selected-tool');
    }
  }, [selectedTool]);

  // Clear persisted state when page is unloaded (tab closed/navigated away)
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem('collabcanvas-selected-tool');
      localStorage.removeItem('collabcanvas-selected-shape');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

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
