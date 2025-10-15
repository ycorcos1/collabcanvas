import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../components/Auth/AuthProvider";
import { Canvas } from "../components/Canvas/Canvas";
import { Toolbar } from "../components/Toolbar/Toolbar";
import { UserPresence } from "../components/Presence/UserPresence";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { useShapes } from "../hooks/useShapes";
import { Shape } from "../types/shape";
import "../App.css";

/**
 * Dashboard Page - Main collaborative canvas interface
 *
 * This is the core application page that brings together:
 * - Canvas for shape creation and manipulation
 * - Toolbar for tools and canvas controls
 * - User presence indicators
 * - Connection status monitoring
 * - Session persistence for selected tools and shapes
 * - Real-time collaboration features
 *
 * Requires authentication - redirects to sign-in if not logged in
 */

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading, signOut } = useAuth();
  const {
    shapes,
    selectedShapeIds,
    isLoading: shapesLoading,
    error: shapesError,
    createShape,
    updateShape,
    deleteSelectedShapes,
    selectShape,
    clearAllShapes,
    isShapeLockedByOther,
    getShapeSelector,
  } = useShapes();

  // Enhanced auth validation with error handling
  if (!isLoading && !user) {
    return <Navigate to="/signin" replace />;
  }

  // Additional safety check for incomplete user data
  if (user && (!user.id || !user.email)) {
    console.warn("Incomplete user data detected, redirecting to sign-in");
    return <Navigate to="/signin" replace />;
  }

  // Persist selected tool across page refreshes (using sessionStorage)
  const [selectedTool, setSelectedTool] = useState<Shape["type"] | null>(() => {
    const saved = sessionStorage.getItem("horizon-selected-tool");
    return saved ? (saved as Shape["type"]) : null;
  });

  // Save selected tool to sessionStorage when it changes
  useEffect(() => {
    if (selectedTool) {
      sessionStorage.setItem("horizon-selected-tool", selectedTool);
    } else {
      sessionStorage.removeItem("horizon-selected-tool");
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
      navigate("/signin", { replace: true });
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
    return <Navigate to="/signin" replace />;
  }

  return (
    <div className="app">
      {/* Connection Status */}
      <ConnectionStatus />

      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <h1>HØRIZON</h1>
        </div>
        <div className="header-right">
          <span className="user-info">
            Welcome, {user?.displayName || 'User'}
          </span>
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
        onDeleteSelected={deleteSelectedShapes}
        hasSelectedShapes={selectedShapeIds.length > 0}
      />

      {/* User Presence */}
      <UserPresence />

      {/* Canvas */}
      <Canvas
        selectedTool={selectedTool}
        shapes={shapes}
        selectedShapeIds={selectedShapeIds}
        isLoading={shapesLoading}
        error={shapesError}
        createShape={createShape}
        updateShape={updateShape}
        deleteSelectedShapes={deleteSelectedShapes}
        selectShape={selectShape}
        isShapeLockedByOther={isShapeLockedByOther}
        getShapeSelector={getShapeSelector}
      />
    </div>
  );
};
