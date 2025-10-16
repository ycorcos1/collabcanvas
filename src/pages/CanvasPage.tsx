import React, { useState, useEffect, useCallback } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../components/Auth/AuthProvider";
import { Canvas } from "../components/Canvas/Canvas";
// Removed old imports - using new floating components
import { ConnectionStatus } from "../components/ConnectionStatus";
import { ThemeInitializer } from "../components/ThemeInitializer";
import { useShapes } from "../hooks/useShapes";
import { useHistory } from "../hooks/useHistory";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { exportCanvas } from "../utils/exportUtils";
// Alignment utils removed - will be added back when needed in right panel
import { LeftSidebar } from "../components/LeftSidebar/LeftSidebar";
import { ModernToolbar } from "../components/ModernToolbar/ModernToolbar";
import { RightPanel } from "../components/RightPanel/RightPanel";
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

  // Generate project name based on slug or create new untitled project
  const generateProjectName = (slug: string) => {
    if (slug.startsWith("untitled-")) {
      // For new untitled projects, just return "Untitled Project"
      return "Untitled Project";
    }
    return slug.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
  };

  // Project name state (editable)
  const [projectName, setProjectName] = useState(
    slug ? generateProjectName(slug) : "Untitled Project"
  );
  // Removed unused old state variables

  // Canvas state management
  const {
    shapes,
    selectedShapeIds,
    createShape,
    updateShape,
    deleteSelectedShapes,
    selectShape,
    // clearAllShapes, // Not used in Figma layout
    isShapeLockedByOther,
    getShapeSelector,
  } = useShapes();

  // Selected tool state with session persistence
  const [selectedTool, setSelectedTool] = useState<Shape["type"] | null>(() => {
    const saved = sessionStorage.getItem("horizon-selected-tool");
    return saved ? (saved as Shape["type"]) : null;
  });

  // Selected color state with session persistence
  const [selectedColor] = useState<string>(() => {
    return sessionStorage.getItem("horizon-selected-color") || "#4ECDC4";
  });

  // History management for undo/redo
  const { undo, redo, pushState } = useHistory(shapes);

  // Clipboard for copy/paste
  const [clipboard, setClipboard] = useState<Shape[]>([]);

  // Removed layers panel state - now integrated in left sidebar

  // Canvas background state
  const [canvasBackground, setCanvasBackground] = useState("#ffffff");
  const [isBackgroundPickerOpen, setIsBackgroundPickerOpen] = useState(false);

  // Project naming state
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [tempProjectName, setTempProjectName] = useState(projectName);

  // Persist selected tool in session storage
  useEffect(() => {
    if (selectedTool) {
      sessionStorage.setItem("horizon-selected-tool", selectedTool);
    } else {
      sessionStorage.removeItem("horizon-selected-tool");
    }
  }, [selectedTool]);

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
    setTempProjectName(projectName);
    setIsEditingProjectName(true);
  };

  const handleNameSave = () => {
    if (tempProjectName.trim()) {
      setProjectName(tempProjectName.trim());
      // Note: URL will update on next page refresh as per requirements
    }
    setIsEditingProjectName(false);
  };

  const handleNameCancel = () => {
    setTempProjectName(projectName);
    setIsEditingProjectName(false);
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
      console.log("Undo to state:", previousShapes);
    }
  }, [undo]);

  const handleRedo = useCallback(() => {
    const nextShapes = redo();
    if (nextShapes) {
      // Apply the next state to Firebase
      // Note: This would need to be implemented in useShapes hook
      console.log("Redo to state:", nextShapes);
    }
  }, [redo]);

  // Copy selected shapes
  const handleCopy = useCallback(() => {
    const selectedShapes = shapes.filter((shape) =>
      selectedShapeIds.includes(shape.id)
    );
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
    const selectedShapes = shapes.filter((shape) =>
      selectedShapeIds.includes(shape.id)
    );
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
  const handleMoveShapes = useCallback(
    async (dx: number, dy: number) => {
      const selectedShapes = shapes.filter((shape) =>
        selectedShapeIds.includes(shape.id)
      );
      if (selectedShapes.length === 0) return;

      for (const shape of selectedShapes) {
        await updateShape(shape.id, {
          x: Math.max(0, shape.x + dx),
          y: Math.max(0, shape.y + dy),
        });
      }
    },
    [shapes, selectedShapeIds, updateShape]
  );

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
        format: "png",
        scale: 2, // High DPI export
        padding: 20,
        backgroundColor: "#ffffff",
        quality: 0.9,
      });
    } catch (error) {
      console.error("Export PNG failed:", error);
    }
  }, [shapes, projectName]);

  const handleExportSVG = useCallback(async () => {
    try {
      await exportCanvas(shapes, projectName, {
        format: "svg",
        padding: 20,
      });
    } catch (error) {
      console.error("Export SVG failed:", error);
    }
  }, [shapes, projectName]);

  // Export selected functions moved to FloatingToolbar component

  // Z-index management functions removed - will be added to right panel later if needed

  // Alignment functions removed - will be added to right panel later if needed

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
    <div className="modern-canvas-page">
      {/* Initialize theme for authenticated users */}
      <ThemeInitializer />

      {/* Top Header */}
      <header className="modern-header">
        <div className="header-left">
          <Button variant="ghost" onClick={handleBack} className="back-btn">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Button>

          <div className="project-name-section">
            {isEditingProjectName ? (
              <input
                type="text"
                value={tempProjectName}
                onChange={(e) => setTempProjectName(e.target.value)}
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
      </header>

      {/* Main Layout */}
      <div className="modern-main-layout">
        {/* Left Sidebar */}
        <LeftSidebar
          shapes={shapes}
          selectedShapeIds={selectedShapeIds}
          onSelectShape={selectShape}
          projectName={projectName}
        />

        {/* Canvas Area */}
        <main
          className="modern-canvas-main"
          style={{ backgroundColor: canvasBackground }}
        >
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
        </main>

        {/* Right Panel */}
        <RightPanel
          canvasBackground={canvasBackground}
          onBackgroundChange={setCanvasBackground}
          isBackgroundPickerOpen={isBackgroundPickerOpen}
          onToggleBackgroundPicker={() =>
            setIsBackgroundPickerOpen(!isBackgroundPickerOpen)
          }
          onCloseBackgroundPicker={() => setIsBackgroundPickerOpen(false)}
          hasSelectedShapes={selectedShapeIds.length > 0}
          selectedShapeIds={selectedShapeIds}
          onExportPNG={handleExportPNG}
          onExportSVG={handleExportSVG}
        />
      </div>

      {/* Modern Toolbar */}
      <ModernToolbar
        selectedTool={selectedTool}
        onToolSelect={handleToolSelect}
        hasSelectedShapes={selectedShapeIds.length > 0}
        onDeleteSelected={deleteSelectedShapes}
        onDuplicate={handleDuplicate}
      />

      {/* Connection Status */}
      <ConnectionStatus />
    </div>
  );
};

export default CanvasPage;
