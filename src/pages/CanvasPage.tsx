import React, { useState, useEffect, useCallback } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../components/Auth/AuthProvider";
import { Canvas } from "../components/Canvas/Canvas";
import { Toolbar } from "../components/Toolbar/Toolbar";
import { UserPresence } from "../components/Presence/UserPresence";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { ThemeInitializer } from "../components/ThemeInitializer";
import { useShapes } from "../hooks/useShapes";
import { useHistory } from "../hooks/useHistory";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { exportCanvas, exportSelectedShapes } from "../utils/exportUtils";
import { Button } from "../components/shared";
import { Shape } from "../types/shape";
import "./CanvasPage.css";

/**
 * Canvas Page - Individual project canvas view
 *
 * Full collaborative canvas implementation with:
 * - Project loading by slug
 * - Real-time collaborative drawing
 * - Canvas top bar with project name editing
 * - Back navigation to dashboard
 * - Share functionality
 * - User presence indicators
 * - Toolbar integration
 * - Session persistence
 */
const CanvasPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  // Project name state (editable)
  const [projectName, setProjectName] = useState(
    slug
      ? slug.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase())
      : "Untitled Project"
  );
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(projectName);

  // Canvas state management
  const {
    shapes,
    selectedShapeIds,
    createShape,
    updateShape,
    deleteSelectedShapes,
    selectShape,
    clearAllShapes,
    isShapeLockedByOther,
    getShapeSelector,
  } = useShapes();

  // Selected tool state with session persistence
  const [selectedTool, setSelectedTool] = useState<Shape["type"] | null>(() => {
    const saved = sessionStorage.getItem("horizon-selected-tool");
    return saved ? (saved as Shape["type"]) : null;
  });

  // Selected color state with session persistence
  const [selectedColor, setSelectedColor] = useState<string>(() => {
    return sessionStorage.getItem("horizon-selected-color") || "#4ECDC4";
  });

  // History management for undo/redo
  const {
    canUndo,
    canRedo,
    undo,
    redo,
    pushState,
  } = useHistory(shapes);

  // Clipboard for copy/paste
  const [clipboard, setClipboard] = useState<Shape[]>([]);

  // Persist selected tool in session storage
  useEffect(() => {
    if (selectedTool) {
      sessionStorage.setItem("horizon-selected-tool", selectedTool);
    } else {
      sessionStorage.removeItem("horizon-selected-tool");
    }
  }, [selectedTool]);

  // Persist selected color in session storage
  useEffect(() => {
    sessionStorage.setItem("horizon-selected-color", selectedColor);
  }, [selectedColor]);

  // Validate slug parameter
  if (!slug) {
    return <Navigate to="/dashboard/recent" replace />;
  }

  // Enhanced auth validation
  if (!isLoading && !user) {
    return <Navigate to="/signin" replace />;
  }

  // Additional safety check for incomplete user data
  if (user && (!user.id || !user.email)) {
    console.warn("Incomplete user data detected, redirecting to sign-in");
    return <Navigate to="/signin" replace />;
  }

  // Loading state
  if (isLoading || !user) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading canvas...</p>
      </div>
    );
  }

  // Handle project name editing
  const handleNameEdit = () => {
    setTempName(projectName);
    setIsEditingName(true);
  };

  const handleNameSave = () => {
    if (tempName.trim()) {
      setProjectName(tempName.trim());
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setTempName(projectName);
    setIsEditingName(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSave();
    } else if (e.key === "Escape") {
      handleNameCancel();
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigate("/dashboard/recent");
  };

  // Handle share functionality
  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: projectName,
          text: `Collaborate on this canvas: ${projectName}`,
          url: shareUrl,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        // You could add a toast notification here instead of alert
        alert("Canvas link copied to clipboard!");
      }
    } catch (error) {
      // User cancelled share or clipboard failed
      console.log("Share cancelled or failed");
    }
  };

  // Handle tool selection with validation
  const handleToolSelect = (tool: Shape["type"] | null) => {
    setSelectedTool(tool);
  };

  // History operations
  const handleUndo = useCallback(() => {
    const previousShapes = undo();
    if (previousShapes) {
      // Apply the previous state to Firebase
      // Note: This would need to be implemented in useShapes hook
      console.log('Undo to state:', previousShapes);
    }
  }, [undo]);

  const handleRedo = useCallback(() => {
    const nextShapes = redo();
    if (nextShapes) {
      // Apply the next state to Firebase
      // Note: This would need to be implemented in useShapes hook
      console.log('Redo to state:', nextShapes);
    }
  }, [redo]);

  // Copy selected shapes
  const handleCopy = useCallback(() => {
    const selectedShapes = shapes.filter(shape => selectedShapeIds.includes(shape.id));
    if (selectedShapes.length > 0) {
      setClipboard(selectedShapes);
    }
  }, [shapes, selectedShapeIds]);

  // Paste shapes from clipboard
  const handlePaste = useCallback(async () => {
    if (clipboard.length === 0) return;

    const offset = 20; // Offset for pasted shapes
    for (const shape of clipboard) {
      const newShape = {
        ...shape,
        x: shape.x + offset,
        y: shape.y + offset,
        color: selectedColor, // Use current selected color
      };
      await createShape(newShape);
    }
  }, [clipboard, selectedColor, createShape]);

  // Duplicate selected shapes
  const handleDuplicate = useCallback(async () => {
    const selectedShapes = shapes.filter(shape => selectedShapeIds.includes(shape.id));
    if (selectedShapes.length === 0) return;

    const offset = 20;
    for (const shape of selectedShapes) {
      const newShape = {
        ...shape,
        x: shape.x + offset,
        y: shape.y + offset,
      };
      await createShape(newShape);
    }
  }, [shapes, selectedShapeIds, createShape]);

  // Move selected shapes
  const handleMoveShapes = useCallback(async (dx: number, dy: number) => {
    const selectedShapes = shapes.filter(shape => selectedShapeIds.includes(shape.id));
    if (selectedShapes.length === 0) return;

    for (const shape of selectedShapes) {
      await updateShape(shape.id, {
        x: Math.max(0, shape.x + dx),
        y: Math.max(0, shape.y + dy),
      });
    }
  }, [shapes, selectedShapeIds, updateShape]);

  // Clear selection
  const handleEscape = useCallback(async () => {
    if (selectedShapeIds.length > 0) {
      await selectShape(null);
    }
  }, [selectedShapeIds, selectShape]);

  // Export functions
  const handleExportPNG = useCallback(async () => {
    try {
      await exportCanvas(shapes, projectName, {
        format: 'png',
        scale: 2, // High DPI export
        padding: 20,
        backgroundColor: '#ffffff',
        quality: 0.9,
      });
    } catch (error) {
      console.error('Export PNG failed:', error);
    }
  }, [shapes, projectName]);

  const handleExportSVG = useCallback(async () => {
    try {
      await exportCanvas(shapes, projectName, {
        format: 'svg',
        padding: 20,
      });
    } catch (error) {
      console.error('Export SVG failed:', error);
    }
  }, [shapes, projectName]);

  const handleExportSelectedPNG = useCallback(async () => {
    try {
      await exportSelectedShapes(shapes, selectedShapeIds, projectName, {
        format: 'png',
        scale: 2,
        padding: 20,
        backgroundColor: '#ffffff',
        quality: 0.9,
      });
    } catch (error) {
      console.error('Export selected PNG failed:', error);
    }
  }, [shapes, selectedShapeIds, projectName]);

  const handleExportSelectedSVG = useCallback(async () => {
    try {
      await exportSelectedShapes(shapes, selectedShapeIds, projectName, {
        format: 'svg',
        padding: 20,
      });
    } catch (error) {
      console.error('Export selected SVG failed:', error);
    }
  }, [shapes, selectedShapeIds, projectName]);

  // Push shapes to history when they change
  useEffect(() => {
    pushState(shapes);
  }, [shapes, pushState]);

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onDelete: deleteSelectedShapes,
    onDuplicate: handleDuplicate,
    onCopy: handleCopy,
    onPaste: handlePaste,
    onMoveUp: () => handleMoveShapes(0, -10),
    onMoveDown: () => handleMoveShapes(0, 10),
    onMoveLeft: () => handleMoveShapes(-10, 0),
    onMoveRight: () => handleMoveShapes(10, 0),
    onEscape: handleEscape,
  });

  return (
    <div className="canvas-page">
      {/* Initialize theme for authenticated users */}
      <ThemeInitializer />

      {/* Connection Status */}
      <ConnectionStatus />

      {/* Top Bar */}
      <header className="canvas-header">
        <div className="header-left">
          <Button variant="ghost" onClick={handleBack}>
            ← Back
          </Button>

          <div className="project-name-section">
            {isEditingName ? (
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={handleKeyPress}
                className="project-name-input"
                autoFocus
              />
            ) : (
              <h1
                className="project-name"
                onClick={handleNameEdit}
                title="Click to edit project name"
              >
                {projectName}
              </h1>
            )}
          </div>
        </div>

        <div className="header-right">
          <UserPresence />
          <Button variant="primary" onClick={handleShare}>
            Share
          </Button>
        </div>
      </header>

      {/* Main Canvas Area */}
      <main className="canvas-main">
        {/* Toolbar */}
        <Toolbar
          selectedTool={selectedTool}
          onToolSelect={handleToolSelect}
          hasSelectedShapes={selectedShapeIds.length > 0}
          onDeleteSelected={deleteSelectedShapes}
          onClearAll={clearAllShapes}
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onDuplicate={handleDuplicate}
          onExportPNG={handleExportPNG}
          onExportSVG={handleExportSVG}
          onExportSelectedPNG={handleExportSelectedPNG}
          onExportSelectedSVG={handleExportSelectedSVG}
        />

        {/* Canvas */}
        <div className="canvas-container">
          <Canvas
            shapes={shapes}
            selectedShapeIds={selectedShapeIds}
            selectedTool={selectedTool}
            isLoading={false}
            error={null}
            createShape={createShape}
            updateShape={updateShape}
            deleteSelectedShapes={deleteSelectedShapes}
            selectShape={selectShape}
            isShapeLockedByOther={isShapeLockedByOther}
            getShapeSelector={getShapeSelector}
          />
        </div>
      </main>

      {/* Status Bar */}
      <footer className="canvas-status-bar">
        <div className="status-left">
          <span className="status-item">
            {shapes.length} object{shapes.length !== 1 ? 's' : ''}
          </span>
          {selectedShapeIds.length > 0 && (
            <span className="status-item">
              {selectedShapeIds.length} selected
            </span>
          )}
        </div>
        
        <div className="status-center">
          <span className="status-item canvas-info">
            Canvas: {projectName}
          </span>
        </div>
        
        <div className="status-right">
          <span className="status-item">
            Tool: {selectedTool || 'Select'}
          </span>
          <span className="status-item">
            <div className="status-color-preview" style={{ backgroundColor: selectedColor }} />
            {selectedColor}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default CanvasPage;
