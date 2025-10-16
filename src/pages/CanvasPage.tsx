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
import { useCanvas } from "../hooks/useCanvas";
import { exportCanvas } from "../utils/exportUtils";
// Alignment utils removed - will be added back when needed in right panel
import { LeftSidebar } from "../components/LeftSidebar/LeftSidebar";
import { ModernToolbar } from "../components/ModernToolbar/ModernToolbar";
import { RightPanel } from "../components/RightPanel/RightPanel";
import { Button } from "../components/shared";
import { Shape, CreateShapeData } from "../types/shape";
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
    deleteShape,
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
  const { undo, redo, pushState, canUndo, canRedo } = useHistory(shapes);

  // Canvas state management
  const { canvasState, zoomIn, zoomOut, zoomReset } = useCanvas();

  // Clipboard for copy/paste
  const [clipboard, setClipboard] = useState<Shape[]>([]);

  // Save system state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedState, setLastSavedState] = useState<string>("");
  const [showExitPrompt, setShowExitPrompt] = useState(false);

  // Removed layers panel state - now integrated in left sidebar

  // Canvas background state with persistence
  const [canvasBackground, setCanvasBackground] = useState(() => {
    return sessionStorage.getItem("canvas-background-color") || "#ffffff";
  });
  const [isBackgroundPickerOpen, setIsBackgroundPickerOpen] = useState(false);

  // Cursor mode state with persistence
  const [cursorMode, setCursorMode] = useState(() => {
    return sessionStorage.getItem("canvas-cursor-mode") || "move";
  });

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

  // Persist cursor mode to session storage
  useEffect(() => {
    sessionStorage.setItem("canvas-cursor-mode", cursorMode);
  }, [cursorMode]);

  // Persist canvas background to session storage
  useEffect(() => {
    sessionStorage.setItem("canvas-background-color", canvasBackground);
  }, [canvasBackground]);

  // Persist selected shapes to session storage
  useEffect(() => {
    sessionStorage.setItem(
      "canvas-selected-shapes",
      JSON.stringify(selectedShapeIds)
    );
  }, [selectedShapeIds]);

  // Restore selected shapes on component mount
  useEffect(() => {
    const savedSelection = sessionStorage.getItem("canvas-selected-shapes");
    if (savedSelection && shapes.length > 0) {
      try {
        const parsedSelection = JSON.parse(savedSelection);
        if (Array.isArray(parsedSelection)) {
          // Only restore selections that still exist in current shapes
          const validSelections = parsedSelection.filter((id) =>
            shapes.some((shape) => shape.id === id)
          );
          if (validSelections.length > 0) {
            // Use the selectShape function to restore selections
            validSelections.forEach((id) => selectShape(id, true));
          }
        }
      } catch (error) {
        console.error("Failed to restore shape selection:", error);
      }
    }
  }, [shapes, selectShape]); // Only run when shapes are loaded

  // Local shapes state for unsaved changes
  const [localShapes, setLocalShapes] = useState<Shape[]>([]);
  const [isLocalMode, setIsLocalMode] = useState(false);

  // Use local shapes when in local mode, otherwise use Firestore shapes
  const currentShapes = isLocalMode ? localShapes : shapes;

  // Track unsaved changes by comparing current state with last saved state
  useEffect(() => {
    const currentState = JSON.stringify({
      shapes: currentShapes.map((s) => ({
        ...s,
        selectedBy: undefined,
        selectedByName: undefined,
        selectedByColor: undefined,
        selectedAt: undefined,
      })),
      canvasBackground,
      projectName,
    });

    if (lastSavedState && currentState !== lastSavedState) {
      setHasUnsavedChanges(true);
    } else if (!lastSavedState) {
      // Initialize last saved state on first load
      setLastSavedState(currentState);
    }
  }, [currentShapes, canvasBackground, projectName, lastSavedState]);

  // Load saved project state on mount
  useEffect(() => {
    const savedProject = localStorage.getItem(`project-${slug}`);
    if (savedProject) {
      try {
        const projectData = JSON.parse(savedProject);
        setLastSavedState(
          JSON.stringify({
            shapes: projectData.shapes || [],
            canvasBackground: projectData.canvasBackground || "#ffffff",
            projectName: projectData.projectName || projectName,
          })
        );
        setHasUnsavedChanges(false);
        
        // Load saved shapes into local state
        if (projectData.shapes) {
          setLocalShapes(projectData.shapes);
          setIsLocalMode(true);
        }
      } catch (error) {
        console.error("Failed to load saved project:", error);
      }
    }
  }, [slug, projectName]);

  // Local shape operations that don't sync to Firestore
  const localCreateShape = useCallback(async (shapeData: CreateShapeData): Promise<Shape | null> => {
    const newShape: Shape = {
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...shapeData,
      zIndex: Math.max(...currentShapes.map(s => s.zIndex), 0) + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    setLocalShapes(prev => [...prev, newShape]);
    setIsLocalMode(true);
    setHasUnsavedChanges(true);
    
    return newShape;
  }, [currentShapes]);

  const localUpdateShape = useCallback(async (id: string, updates: Partial<Shape>): Promise<void> => {
    setLocalShapes(prev => prev.map(shape => 
      shape.id === id 
        ? { ...shape, ...updates, updatedAt: Date.now() }
        : shape
    ));
    setHasUnsavedChanges(true);
  }, []);

  const localDeleteShapes = useCallback((ids: string[]) => {
    setLocalShapes(prev => prev.filter(shape => !ids.includes(shape.id)));
    setHasUnsavedChanges(true);
  }, []);

  // Local delete selected shapes
  const localDeleteSelectedShapes = useCallback(async (): Promise<void> => {
    if (selectedShapeIds.length > 0) {
      localDeleteShapes(selectedShapeIds);
      // Clear selection after deleting
      sessionStorage.removeItem("horizon-selected-shapes");
      window.location.reload(); // Force refresh to clear selection state
    }
  }, [selectedShapeIds, localDeleteShapes]);

  // Use local operations when in local mode
  const activeCreateShape = isLocalMode ? localCreateShape : createShape;
  const activeUpdateShape = isLocalMode ? localUpdateShape : updateShape;
  const activeDeleteSelectedShapes = isLocalMode ? localDeleteSelectedShapes : deleteSelectedShapes;

  // Handle browser beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

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

  // Handle cursor mode changes from toolbar
  const handleCursorModeChange = (mode: string) => {
    setCursorMode(mode);
  };

  // Handle shape renaming from sidebar
  const handleRenameShape = (id: string, newName: string) => {
    // This is handled locally in the sidebar component
    // Could be extended to save to a separate shapes metadata collection if needed
    console.log(`Renaming shape ${id} to ${newName}`);
  };

  // Save project functionality - saves to both localStorage and Firestore
  const handleSaveProject = useCallback(async () => {
    try {
      const shapesToSave = currentShapes.map((s) => ({
        ...s,
        selectedBy: undefined,
        selectedByName: undefined,
        selectedByColor: undefined,
        selectedAt: undefined,
      }));

      const projectData = {
        shapes: shapesToSave,
        canvasBackground,
        projectName,
        lastSaved: Date.now(),
      };

      // Save to localStorage for quick access
      localStorage.setItem(`project-${slug}`, JSON.stringify(projectData));

      // If we have local changes, sync them to Firestore
      if (isLocalMode) {
        // First, clear existing shapes from Firestore
        const existingShapes = shapes;
        for (const shape of existingShapes) {
          try {
            await deleteShape(shape.id);
          } catch (error) {
            console.error(`Failed to delete old shape ${shape.id}:`, error);
          }
        }

        // Then create new shapes in Firestore
        for (const shape of shapesToSave) {
          try {
            const shapeData: CreateShapeData = {
              type: shape.type,
              x: shape.x,
              y: shape.y,
              width: shape.width,
              height: shape.height,
              color: shape.color,
              zIndex: shape.zIndex,
              createdBy: shape.createdBy,
              text: shape.text,
              fontSize: shape.fontSize,
              fontFamily: shape.fontFamily,
              points: shape.points,
              strokeWidth: shape.strokeWidth,
            };
            await createShape(shapeData);
          } catch (error) {
            console.error(`Failed to create shape in Firestore:`, error);
          }
        }

        // Switch back to Firestore mode
        setIsLocalMode(false);
        setLocalShapes([]);
      }

      const currentState = JSON.stringify({
        shapes: shapesToSave,
        canvasBackground,
        projectName,
      });

      setLastSavedState(currentState);
      setHasUnsavedChanges(false);

      console.log("Project saved successfully to both localStorage and Firestore");
    } catch (error) {
      console.error("Failed to save project:", error);
    }
  }, [currentShapes, canvasBackground, projectName, slug, isLocalMode, shapes, deleteShape, createShape]);

  // Handle new project
  const handleNewProject = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowExitPrompt(true);
      return;
    }
    navigate("/dashboard/recent");
  }, [hasUnsavedChanges, navigate]);

  // Handle exit with unsaved changes
  const handleExitWithoutSaving = useCallback(() => {
    setHasUnsavedChanges(false);
    setShowExitPrompt(false);
    navigate("/dashboard/recent");
  }, [navigate]);

  // Handle save and exit
  const handleSaveAndExit = useCallback(() => {
    handleSaveProject();
    setShowExitPrompt(false);
    navigate("/dashboard/recent");
  }, [handleSaveProject, navigate]);

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

  // Cut selected shapes (copy + delete)
  const handleCut = useCallback(async () => {
    if (selectedShapeIds.length === 0) return;

    // First copy the selected shapes
    handleCopy();

    // Then delete them
    await deleteSelectedShapes();
  }, [selectedShapeIds, handleCopy, deleteSelectedShapes]);

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
      await exportCanvas(currentShapes, projectName, {
        format: "png",
        scale: 2, // High DPI export
        padding: 20,
        backgroundColor: "#ffffff",
        quality: 0.9,
      });
    } catch (error) {
      console.error("Export PNG failed:", error);
    }
  }, [currentShapes, projectName]);

  const handleExportSVG = useCallback(async () => {
    try {
      await exportCanvas(currentShapes, projectName, {
        format: "svg",
        padding: 20,
      });
    } catch (error) {
      console.error("Export SVG failed:", error);
    }
  }, [currentShapes, projectName]);

  const handleExportPDF = useCallback(async () => {
    try {
      await exportCanvas(currentShapes, projectName, {
        format: "pdf",
        padding: 20,
        backgroundColor: canvasBackground,
      });
    } catch (error) {
      console.error("Export PDF failed:", error);
    }
  }, [currentShapes, projectName, canvasBackground]);

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
          shapes={currentShapes}
          selectedShapeIds={selectedShapeIds}
          onSelectShape={selectShape}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onDeleteSelected={activeDeleteSelectedShapes}
          onRenameShape={handleRenameShape}
          onSave={handleSaveProject}
          onNewProject={handleNewProject}
          onExportPNG={handleExportPNG}
          onExportPDF={handleExportPDF}
          canUndo={canUndo}
          canRedo={canRedo}
          hasClipboardContent={clipboard.length > 0}
          hasUnsavedChanges={hasUnsavedChanges}
        />

        {/* Canvas Area */}
        <main
          className="modern-canvas-main"
          style={{ backgroundColor: canvasBackground }}
        >
          <Canvas
            shapes={currentShapes}
            selectedShapeIds={selectedShapeIds}
            selectedTool={selectedTool}
            isLoading={false}
            error={null}
            createShape={activeCreateShape}
            updateShape={activeUpdateShape}
            deleteSelectedShapes={activeDeleteSelectedShapes}
            selectShape={selectShape}
            isShapeLockedByOther={isShapeLockedByOther}
            getShapeSelector={getShapeSelector}
            cursorMode={cursorMode}
            onCut={handleCut}
            onCopy={handleCopy}
            onPaste={handlePaste}
            hasClipboardContent={clipboard.length > 0}
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
          selectedShapes={currentShapes.filter((shape) =>
            selectedShapeIds.includes(shape.id)
          )}
          onUpdateShape={activeUpdateShape}
          onExportPNG={handleExportPNG}
          onExportSVG={handleExportSVG}
          onExportPDF={handleExportPDF}
        />
      </div>

      {/* Modern Toolbar */}
      <ModernToolbar
        selectedTool={selectedTool}
        onToolSelect={handleToolSelect}
        hasSelectedShapes={selectedShapeIds.length > 0}
        onDeleteSelected={deleteSelectedShapes}
        onDuplicate={handleDuplicate}
        zoom={Math.round(canvasState.scale * 100)}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomReset={zoomReset}
        onCursorModeChange={handleCursorModeChange}
      />

      {/* Connection Status */}
      <ConnectionStatus />

      {/* Exit Prompt Modal */}
      {showExitPrompt && (
        <div className="exit-prompt-overlay">
          <div className="exit-prompt-modal">
            <h3>Unsaved Changes</h3>
            <p>You have unsaved changes. What would you like to do?</p>
            <div className="exit-prompt-buttons">
              <button
                className="exit-prompt-button secondary"
                onClick={() => setShowExitPrompt(false)}
              >
                Cancel
              </button>
              <button
                className="exit-prompt-button danger"
                onClick={handleExitWithoutSaving}
              >
                Continue without saving
              </button>
              <button
                className="exit-prompt-button primary"
                onClick={handleSaveAndExit}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasPage;
