import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { useCanvasDimensions } from "../hooks/useCanvasDimensions";
import { useProjectManagement } from "../hooks/useProjectManagement";
import { useProjectSync } from "../hooks/useProjectSync";
import { useAIAgent } from "../hooks/useAIAgent";
import { exportCanvas } from "../utils/exportUtils";
// Alignment utils removed - will be added back when needed in right panel
import { LeftSidebar } from "../components/LeftSidebar/LeftSidebar";
import { ModernToolbar } from "../components/ModernToolbar/ModernToolbar";
import { RightPanel } from "../components/RightPanel/RightPanel";
import { AddCollaboratorsModal } from "../components/Modals/AddCollaboratorsModal";
import { Button } from "../components/shared";
import { Shape } from "../types/shape";
import { generateProjectSlug } from "../utils/projectUtils";
import { generateKonvaThumbnail } from "../utils/thumbnailGenerator";
import "./CanvasPage.css";
import { memorySync } from "../services/memorySync";
import { memoryBank } from "../services/memoryBank";

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

  // Project name is now completely separate from URL
  // The actual name will be loaded from Firestore or set by user
  // Use slug from URL parameter - loadProject will handle slug->ID conversion
  const projectSlug =
    slug || `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Save system state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedState, setLastSavedState] = useState<string>("");
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [isProjectSaved, setIsProjectSaved] = useState(false); // Track if project has been saved at least once
  const [actualProjectId, setActualProjectId] = useState<string | null>(null); // Store the real project ID after first save
  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [isProjectLoaded, setIsProjectLoaded] = useState(false); // Track if project data has been loaded
  const [projectName, setProjectName] = useState(""); // Start empty to prevent flash
  const [stageRef, setStageRef] = useState<any>(null); // Store Konva stage reference for thumbnail generation
  const [isInitializing, setIsInitializing] = useState(true); // Track if we're still initializing the project
  const workspaceRef = useRef<HTMLDivElement | null>(null); // Reference to canvas workspace for panning

  // Canvas state management
  const {
    shapes,
    setShapes,
    selectedShapeIds,
    createShape,
    updateShape,
    deleteSelectedShapes,
    selectShape,
    clearAllShapes,
    isShapeLockedByOther,
    getShapeSelector,
  } = useShapes(actualProjectId || projectSlug); // Use actual project ID for shapes, fallback to slug

  // Selected tool state with session persistence
  const [selectedTool, setSelectedTool] = useState<Shape["type"] | null>(() => {
    const saved = sessionStorage.getItem("horizon-selected-tool");
    return saved ? (saved as Shape["type"]) : null;
  });

  // Selected color state with session persistence
  const [selectedColor, setSelectedColor] = useState<string>(() => {
    return sessionStorage.getItem("horizon-selected-color") || "#FF0000";
  });

  // Handle color change
  const handleColorChange = useCallback((color: string) => {
    setSelectedColor(color);
    sessionStorage.setItem("horizon-selected-color", color);
  }, []);

  // History management for undo/redo
  const { undo, redo, pushState, canUndo, canRedo } = useHistory(shapes);

  // Collaboration modal state
  const [isCollaborationModalOpen, setIsCollaborationModalOpen] =
    useState(false);

  // AI Agent integration
  const {
    executeCommand: executeAICommand,
    isEnabled: isAIEnabled,
    isProcessing: isAIProcessing,
  } = useAIAgent({
    scopeId: (actualProjectId || projectSlug || "").toString(),
    onSuccess: (response) => {
      // Command executed successfully
      console.log("AI command success:", response);
    },
    onError: (error) => {
      // Command failed
      console.error("AI command error:", error);
    },
  });

  // AI Chat state (in-memory, not persisted)
  const [aiChatMessages, setAiChatMessages] = useState<
    Array<{
      id: string;
      role: "user" | "ai";
      content: string;
      timestamp: number;
      status?: "success" | "error" | "processing";
    }>
  >([]);

  // Project management
  const { saveProject, loadProject } = useProjectManagement();

  // Real-time project synchronization
  const { projectData: syncedProjectData } = useProjectSync(actualProjectId);

  // Canvas state management
  const { canvasState, zoomIn, zoomOut, zoomReset } = useCanvas();

  // Canvas dimensions management
  const { dimensions: canvasDimensions } = useCanvasDimensions();

  // Clipboard for copy/paste
  const [clipboard, setClipboard] = useState<Shape[]>([]);

  // Page management state - always start on first page
  const [currentPageId, setCurrentPageId] = useState("page1");
  const [pageCanvasData, setPageCanvasData] = useState<
    Record<string, { shapes: Shape[]; canvasBackground: string }>
  >(() => {
    // For new projects, always start with a clean first page
    return {
      page1: { shapes: [], canvasBackground: "#ffffff" },
    };
  });

  // In-memory page data (not persisted until save)
  const [inMemoryPages, setInMemoryPages] = useState<
    { id: string; name: string }[]
  >([{ id: "page1", name: "Page 1" }]);
  const [inMemoryObjectNames, setInMemoryObjectNames] = useState<
    Record<string, string>
  >({});

  // Removed layers panel state - now integrated in left sidebar

  // Canvas background state with persistence (now per-page)
  const [canvasBackground, setCanvasBackground] = useState(() => {
    return pageCanvasData[currentPageId]?.canvasBackground || "#ffffff";
  });
  const [isBackgroundPickerOpen, setIsBackgroundPickerOpen] = useState(false);

  // Cursor mode state with persistence
  const [cursorMode, setCursorMode] = useState(() => {
    return sessionStorage.getItem("canvas-cursor-mode") || "move";
  });

  // Project naming state
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [tempProjectName, setTempProjectName] = useState(projectName);

  // Sync tempProjectName with projectName when projectName changes (but only after loading)
  useEffect(() => {
    if (!isEditingProjectName && isProjectLoaded) {
      setTempProjectName(projectName);
    }
  }, [projectName, isEditingProjectName, isProjectLoaded]);

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

  // Update current page data in memory (no localStorage persistence)
  useEffect(() => {
    const currentPageData = pageCanvasData[currentPageId];

    // Only update if shapes or background actually changed
    const shapesChanged =
      JSON.stringify(currentPageData?.shapes) !== JSON.stringify(shapes);
    const backgroundChanged =
      currentPageData?.canvasBackground !== canvasBackground;

    if (shapesChanged || backgroundChanged) {
      const updatedPageData = {
        ...pageCanvasData,
        [currentPageId]: {
          shapes: shapes,
          canvasBackground: canvasBackground,
        },
      };
      setPageCanvasData(updatedPageData);
    }
    // Note: No localStorage saving here - only save when project is explicitly saved
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapes, canvasBackground, currentPageId]);

  // Load current page data when page changes (only when switching pages)
  const prevPageIdRef = useRef(currentPageId);
  useEffect(() => {
    // Only load data if we actually switched to a different page
    if (prevPageIdRef.current !== currentPageId) {
      prevPageIdRef.current = currentPageId;

      const currentPageData = pageCanvasData[currentPageId];
      if (currentPageData) {
        // Load shapes from page data
        if (currentPageData.shapes && Array.isArray(currentPageData.shapes)) {
          setShapes(currentPageData.shapes);
        } else {
          setShapes([]); // Clear shapes if page has none
        }
        // Load canvas background
        setCanvasBackground(currentPageData.canvasBackground || "#ffffff");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageId]);

  // Persist selected shapes to session storage
  useEffect(() => {
    sessionStorage.setItem(
      "canvas-selected-shapes",
      JSON.stringify(selectedShapeIds)
    );
  }, [selectedShapeIds]);

  // Update Memory Bank active context whenever canvas/session changes
  useEffect(() => {
    try {
      const defaults = memoryBank.getDefaults();
      memorySync.updateActiveContext({
        projectId: actualProjectId || projectSlug,
        canvas: {
          width: canvasDimensions?.width,
          height: canvasDimensions?.height,
          background: canvasBackground,
        },
        pages: {
          total: Object.keys(pageCanvasData ?? {}).length,
          selectedId: currentPageId,
        },
        ai: {
          defaultPosition: defaults.aiPreferences.defaultPosition,
          duplicateOffset: defaults.duplicateOffset,
          palette: defaults.colors.palette,
        },
        recentCommands:
          (aiChatMessages as any[])?.slice?.(-5)?.map((m: any) => m.content) ??
          [],
        locks:
          shapes
            ?.filter((s) => s.selectedBy && s.selectedBy !== user?.id)
            .map((s) => s.id) ?? [],
      });
    } catch {}
  }, [
    actualProjectId,
    projectSlug,
    canvasDimensions,
    canvasBackground,
    pageCanvasData,
    currentPageId,
    aiChatMessages,
    shapes,
    user,
  ]);

  // Restore selected shapes once after initial shapes load
  const didRestoreSelectionRef = useRef(false);
  useEffect(() => {
    if (didRestoreSelectionRef.current) return;

    const savedSelection = sessionStorage.getItem("canvas-selected-shapes");
    if (!savedSelection) {
      didRestoreSelectionRef.current = true;
      return;
    }

    if (shapes.length === 0) return; // wait until shapes are available

    try {
      const parsedSelection = JSON.parse(savedSelection);
      if (Array.isArray(parsedSelection) && parsedSelection.length > 0) {
        const validSelections = parsedSelection.filter((id: string) =>
          shapes.some((shape) => shape.id === id)
        );

        if (validSelections.length > 0) {
          validSelections.forEach((id: string) => selectShape(id));
        }
      }
    } catch (error) {
      console.error("Failed to restore shape selection:", error);
    } finally {
      // Ensure we only attempt restore once to avoid loops
      didRestoreSelectionRef.current = true;
    }
  }, [shapes, selectShape]);

  // Track unsaved changes by comparing current state with last saved state - only after project is loaded
  // Debounced to prevent excessive state comparisons
  useEffect(() => {
    if (!isProjectLoaded) return; // Don't track changes during loading

    // Debounce change detection to reduce overhead
    const timeoutId = setTimeout(() => {
      // Update current page data in pageCanvasData
      const updatedPageData = {
        ...pageCanvasData,
        [currentPageId]: {
          shapes: shapes.map((s) => ({
            ...s,
            selectedBy: undefined,
            selectedByName: undefined,
            selectedByColor: undefined,
            selectedAt: undefined,
          })),
          canvasBackground: canvasBackground,
        },
      };

      const currentState = JSON.stringify({
        pages: updatedPageData,
        currentPageId,
        projectName,
        pageMetadata: inMemoryPages,
        objectNames: inMemoryObjectNames,
      });

      // Don't detect changes during initialization
      if (isInitializing) {
        return;
      }

      if (lastSavedState && currentState !== lastSavedState) {
        // Only mark as unsaved if the project has been saved before OR if there are actual changes
        const hasActualChanges =
          shapes.length > 0 ||
          projectName !== "Untitled Project" ||
          Object.keys(updatedPageData).length > 1 ||
          updatedPageData[currentPageId].canvasBackground !== "#ffffff";

        if (isProjectSaved || hasActualChanges) {
          setHasUnsavedChanges(true);
        }
      } else if (!lastSavedState && isProjectLoaded) {
        // Initialize last saved state on first load (but don't mark as unsaved yet)
        setLastSavedState(currentState);
      }
    }, 500); // Debounce by 500ms to reduce overhead

    return () => clearTimeout(timeoutId);
  }, [
    shapes,
    canvasBackground,
    projectName,
    lastSavedState,
    isProjectSaved,
    pageCanvasData,
    currentPageId,
    inMemoryPages,
    inMemoryObjectNames,
    isProjectLoaded,
    isInitializing, // Add to dependencies
  ]);

  // Handle browser beforeunload event (now only for critical situations)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only warn if there are very recent changes that might not be auto-saved yet
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    // Block browser back/forward navigation
    const handlePopState = (e: PopStateEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        const confirmLeave = window.confirm(
          "You have unsaved changes. Are you sure you want to leave? All progress will be lost."
        );
        if (!confirmLeave) {
          // Push the current state back to prevent navigation
          window.history.pushState(null, "", window.location.href);
        } else {
          // Allow navigation and reset unsaved changes
          setHasUnsavedChanges(false);
          window.history.back();
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    // Push initial state to enable popstate detection
    if (hasUnsavedChanges) {
      window.history.pushState(null, "", window.location.href);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
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
    if (hasUnsavedChanges) {
      setShowExitPrompt(true);
    } else {
      navigate("/dashboard/recent");
    }
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
  const handleRenameShape = (_id: string, _newName: string) => {
    // This is handled locally in the sidebar component
    // Could be extended to save to a separate shapes metadata collection if needed
  };

  // Manual save functionality (for File menu)
  const handleSaveProject = useCallback(async () => {
    if (!user || !slug || !isProjectLoaded) return;

    setSavingStatus("saving");

    try {
      // Clean current page shapes for saving
      const cleanedShapes = shapes.map((s) => ({
        ...s,
        selectedBy: undefined,
        selectedByName: undefined,
        selectedByColor: undefined,
        selectedAt: undefined,
      }));

      // Update current page data
      const updatedPageData = {
        ...pageCanvasData,
        [currentPageId]: {
          shapes: cleanedShapes,
          canvasBackground: canvasBackground,
        },
      };

      let saveProjectId = actualProjectId || projectSlug;

      // If this is the first save or project doesn't exist, create it
      if (!isProjectSaved) {
        saveProjectId = projectSlug;
        setActualProjectId(saveProjectId);
        setIsProjectSaved(true);
      }

      // Generate thumbnail if stage is available and there are shapes
      let thumbnailUrl: string | undefined;
      if (stageRef && shapes.length > 0) {
        try {
          thumbnailUrl = await generateKonvaThumbnail(stageRef, 280, 160);
        } catch (error) {
          console.error("Failed to generate thumbnail:", error);
          // Continue saving without thumbnail
        }
      }

      // Build project data object with only defined values
      const projectData: any = {};

      if (projectName !== undefined) projectData.name = projectName;
      if (updatedPageData !== undefined) projectData.pages = updatedPageData;
      if (currentPageId !== undefined)
        projectData.currentPageId = currentPageId;
      if (cleanedShapes !== undefined) projectData.shapes = cleanedShapes;
      if (canvasBackground !== undefined)
        projectData.canvasBackground = canvasBackground;
      if (inMemoryObjectNames !== undefined)
        projectData.objectNames = inMemoryObjectNames;
      if (inMemoryPages !== undefined) projectData.pageMetadata = inMemoryPages;
      if (thumbnailUrl !== undefined) projectData.thumbnailUrl = thumbnailUrl;

      const success = await saveProject(saveProjectId, projectData);

      if (success) {
        // Update the saved state
        const savedState = JSON.stringify({
          pages: updatedPageData,
          currentPageId,
          projectName,
          pageMetadata: inMemoryPages,
          objectNames: inMemoryObjectNames,
        });
        setLastSavedState(savedState);
        setHasUnsavedChanges(false);

        setSavingStatus("saved");

        // Hide "Saved" status after 2 seconds
        setTimeout(() => {
          setSavingStatus("idle");
        }, 2000);
      } else {
        setSavingStatus("idle");
      }
    } catch (error) {
      console.error("Save failed:", error);
      setSavingStatus("idle");
    }
  }, [
    user,
    slug,
    shapes,
    pageCanvasData,
    currentPageId,
    canvasBackground,
    actualProjectId,
    projectSlug,
    isProjectSaved,
    saveProject,
    projectName,
    inMemoryObjectNames,
    inMemoryPages,
    isProjectLoaded,
    stageRef,
  ]);

  // Create new project on first user change (not on load)
  useEffect(() => {
    const createProjectOnFirstChange = async () => {
      if (!user || !slug || isProjectSaved || !isProjectLoaded) return;

      // Only create project if user has made actual changes
      if (hasUnsavedChanges) {
        try {
          const success = await saveProject(projectSlug, {
            name: projectName,
            pages: pageCanvasData,
            currentPageId: currentPageId,
            shapes: [],
            canvasBackground: "#ffffff",
            objectNames: {},
            pageMetadata: inMemoryPages,
          });

          if (success) {
            setActualProjectId(projectSlug);
            setIsProjectSaved(true);
            setHasUnsavedChanges(false);

            // Set initial saved state
            const savedState = JSON.stringify({
              pages: pageCanvasData,
              currentPageId,
              projectName,
              pageMetadata: inMemoryPages,
              objectNames: {},
            });
            setLastSavedState(savedState);
          }
        } catch (error) {
          console.error("Failed to initialize project:", error);
        }
      }
    };

    createProjectOnFirstChange();
  }, [
    hasUnsavedChanges,
    user,
    slug,
    projectSlug,
    projectName,
    pageCanvasData,
    currentPageId,
    isProjectSaved,
    isProjectLoaded,
    saveProject,
    inMemoryPages,
  ]);

  // Load existing project data on mount
  useEffect(() => {
    const loadExistingProject = async () => {
      if (!user || !slug) return;

      try {
        const existingProject = await loadProject(projectSlug); // Use slug to load project
        if (existingProject) {
          // Project exists, load it
          setProjectName(existingProject.project.name);
          setTempProjectName(existingProject.project.name);
          setIsProjectSaved(true);
          setActualProjectId(existingProject.project.id); // Store the actual project ID

          // Load canvas data
          if (existingProject.canvasData.pages) {
            setPageCanvasData(existingProject.canvasData.pages);
            setCurrentPageId(
              existingProject.canvasData.currentPageId || "page1"
            );
            setCanvasBackground(
              existingProject.canvasData.pages[
                existingProject.canvasData.currentPageId || "page1"
              ]?.canvasBackground || "#ffffff"
            );
          }

          // Load object names
          if (existingProject.canvasData.objectNames) {
            setInMemoryObjectNames(existingProject.canvasData.objectNames);
          }

          // Load page metadata (page names)
          if (existingProject.canvasData.pageMetadata) {
            setInMemoryPages(existingProject.canvasData.pageMetadata);
          }

          // Set last saved state
          const savedState = JSON.stringify({
            pages: existingProject.canvasData.pages,
            currentPageId: existingProject.canvasData.currentPageId,
            projectName: existingProject.project.name,
            pageMetadata: existingProject.canvasData.pageMetadata,
            objectNames: existingProject.canvasData.objectNames,
          });
          setLastSavedState(savedState);
          setHasUnsavedChanges(false);
          setIsProjectLoaded(true); // Mark project as loaded

          // End initialization after a short delay to ensure all state is set
          setTimeout(() => {
            setIsInitializing(false);
          }, 100);
        } else {
          // Project doesn't exist - this is a new project
          setProjectName("Untitled Project");
          setTempProjectName("Untitled Project");
          setIsProjectLoaded(true); // Mark as loaded even for new projects

          // End initialization for new projects
          setTimeout(() => {
            setIsInitializing(false);
          }, 100);
        }
      } catch (error: any) {
        // Check if this is an access denied error
        if (error?.name === "AccessDeniedError") {
          // Redirect to dashboard with error message
          alert(
            error.message || "You don't have permission to access this project"
          );
          navigate("/dashboard");
          return;
        }

        // Other errors - project doesn't exist, this is normal for new projects
        setProjectName("Untitled Project");
        setTempProjectName("Untitled Project");
        setIsProjectLoaded(true); // Mark as loaded even on error

        // End initialization even on error
        setTimeout(() => {
          setIsInitializing(false);
        }, 100);
      }
    };

    loadExistingProject();
  }, [slug, user, projectSlug, loadProject]);

  // Real-time sync: Update local state when other users make changes
  useEffect(() => {
    if (!syncedProjectData || isInitializing || !isProjectLoaded) return;

    // Update project name
    if (syncedProjectData.name !== projectName) {
      setProjectName(syncedProjectData.name);
      setTempProjectName(syncedProjectData.name);
    }

    // Update pages data
    if (
      syncedProjectData.pages &&
      JSON.stringify(syncedProjectData.pages) !== JSON.stringify(pageCanvasData)
    ) {
      setPageCanvasData(syncedProjectData.pages);
    }

    // Update current page
    if (
      syncedProjectData.currentPageId &&
      syncedProjectData.currentPageId !== currentPageId
    ) {
      setCurrentPageId(syncedProjectData.currentPageId);
    }

    // Update page metadata
    if (
      syncedProjectData.pageMetadata &&
      JSON.stringify(syncedProjectData.pageMetadata) !==
        JSON.stringify(inMemoryPages)
    ) {
      setInMemoryPages(syncedProjectData.pageMetadata);
    }

    // Update object names
    if (
      syncedProjectData.objectNames &&
      JSON.stringify(syncedProjectData.objectNames) !==
        JSON.stringify(inMemoryObjectNames)
    ) {
      setInMemoryObjectNames(syncedProjectData.objectNames);
    }

    // Update canvas background
    if (
      syncedProjectData.canvasBackground &&
      syncedProjectData.canvasBackground !== canvasBackground
    ) {
      setCanvasBackground(syncedProjectData.canvasBackground);
    }

    // Update shapes for current page - merge with local state intelligently
    const currentPageShapes =
      syncedProjectData.pages?.[syncedProjectData.currentPageId || "page1"]
        ?.shapes || [];

    // Only update if shapes actually changed
    if (JSON.stringify(currentPageShapes) !== JSON.stringify(shapes)) {
      // Always take the synced shapes - server is the source of truth
      // This prevents race conditions where two users select the same shape
      setShapes(currentPageShapes);
    }
  }, [syncedProjectData, isInitializing, isProjectLoaded, user]);

  // Debounced selection sync - save selection changes to Firestore immediately
  const selectionSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  // Track last synced selection signature to avoid infinite loops
  const lastSelectionSigRef = useRef<string>("");
  useEffect(() => {
    // Only sync selections if project has been saved at least once
    if (!actualProjectId || !isProjectSaved) return;

    // Build a compact signature of selection-related fields only
    const selectionSig = JSON.stringify(
      [...(shapes || [])]
        .map((s) => ({ id: s.id, by: s.selectedBy, at: s.selectedAt }))
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    );

    // If selection signature hasn't changed, do not write
    if (selectionSig === lastSelectionSigRef.current) {
      return;
    }

    // Clear previous timeout
    if (selectionSyncTimeoutRef.current) {
      clearTimeout(selectionSyncTimeoutRef.current);
    }

    // Debounce selection updates to avoid too many writes
    // Reduced to 100ms for faster lock propagation
    selectionSyncTimeoutRef.current = setTimeout(async () => {
      try {
        // Save only the current page's shapes to sync selections
        const updatedPages = {
          ...pageCanvasData,
          [currentPageId]: {
            ...pageCanvasData[currentPageId],
            shapes: shapes,
            canvasBackground:
              pageCanvasData[currentPageId]?.canvasBackground ||
              canvasBackground,
          },
        };

        await saveProject(actualProjectId, {
          pages: updatedPages,
        });
        // Update last synced signature only after successful write
        lastSelectionSigRef.current = selectionSig;
      } catch (error) {
        console.error("Failed to sync selections:", error);
      }
    }, 100); // 100ms debounce - faster for better collaboration

    return () => {
      if (selectionSyncTimeoutRef.current) {
        clearTimeout(selectionSyncTimeoutRef.current);
      }
    };
  }, [
    shapes,
    actualProjectId,
    isProjectSaved,
    currentPageId,
    pageCanvasData,
    canvasBackground,
    saveProject,
  ]);

  // Initialize lastSavedState after project is loaded and initialization is complete
  useEffect(() => {
    if (!isInitializing && isProjectLoaded && !lastSavedState) {
      const currentState = JSON.stringify({
        pages: pageCanvasData,
        currentPageId,
        projectName,
        pageMetadata: inMemoryPages,
        objectNames: inMemoryObjectNames,
      });
      setLastSavedState(currentState);
    }
  }, [
    isInitializing,
    isProjectLoaded,
    lastSavedState,
    pageCanvasData,
    currentPageId,
    projectName,
    inMemoryPages,
    inMemoryObjectNames,
  ]);

  // Handle new project
  const handleNewProject = useCallback(async () => {
    if (hasUnsavedChanges) {
      setShowExitPrompt(true);
      return;
    }

    // Generate a unique project ID/slug for new project
    const newProjectSlug = generateProjectSlug();
    navigate(`/canvas/${newProjectSlug}`);
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

  // Handle add collaborators
  const handleAddCollaborators = useCallback(async () => {
    // If project hasn't been saved yet, save it first
    if (!isProjectSaved || hasUnsavedChanges) {
      const confirmSave = window.confirm(
        "This project needs to be saved before you can share it. Would you like to save now?"
      );

      if (confirmSave) {
        await handleSaveProject();
        // Open modal after save completes
        setIsCollaborationModalOpen(true);
      }
    } else {
      setIsCollaborationModalOpen(true);
    }
  }, [isProjectSaved, hasUnsavedChanges, handleSaveProject]);

  // Handle AI chat message submission
  const handleAIChatMessage = useCallback(
    async (message: string) => {
      if (!user) return;

      // Add user message to chat
      const userMessageId = `msg-${Date.now()}-user`;
      const userMessage = {
        id: userMessageId,
        role: "user" as const,
        content: message,
        timestamp: Date.now(),
      };
      setAiChatMessages((prev) => [...prev, userMessage]);

      // Build context for AI agent with wrapped functions
      const context = {
        shapes,
        selectedShapeIds,
        canvasDimensions: canvasDimensions || { width: 800, height: 1200 },
        shapeActions: {
          createShape: (shape: Partial<Shape>) => {
            // Wrap the async createShape function
            if (!shape.type) return;

            const shapeData: any = {
              type: shape.type,
              x: typeof shape.x === "number" ? shape.x : 0,
              y: typeof shape.y === "number" ? shape.y : 0,
              // prefer explicit color, fallback to fill
              color: (shape as any).color || (shape as any).fill || "#FF0000",
            };

            // Add optional properties only if they exist
            if (shape.width !== undefined) shapeData.width = shape.width;
            if (shape.height !== undefined) shapeData.height = shape.height;
            if ("radius" in shape && shape.radius !== undefined) {
              // our renderer uses width/height for circles (ellipse)
              const diameter = Math.max(1, Number(shape.radius) * 2 || 0);
              if (diameter) {
                shapeData.width = diameter;
                shapeData.height = diameter;
              }
            }
            if ("stroke" in shape && shape.stroke !== undefined)
              shapeData.stroke = shape.stroke;
            if ("strokeWidth" in shape && shape.strokeWidth !== undefined)
              shapeData.strokeWidth = shape.strokeWidth;
            if ("text" in shape && shape.text !== undefined)
              shapeData.text = shape.text;
            if ("fontSize" in shape && shape.fontSize !== undefined)
              shapeData.fontSize = shape.fontSize;
            if ("fontFamily" in shape && shape.fontFamily !== undefined)
              shapeData.fontFamily = shape.fontFamily;
            if ("points" in shape && shape.points !== undefined)
              shapeData.points = shape.points;

            createShape(shapeData).catch((err) => {
              console.error("Failed to create shape:", err);
            });
          },
          updateShape: (id: string, updates: Partial<Shape>) => {
            // Wrap the async updateShape function
            const mapped: Partial<Shape> = { ...updates } as any;
            // map fill->color if present
            if ((updates as any).fill !== undefined) {
              (mapped as any).color = (updates as any).fill;
              delete (mapped as any).fill;
            }
            // map radius->width/height for circles
            if ((updates as any).radius !== undefined) {
              const diameter = Math.max(
                1,
                Number((updates as any).radius) * 2 || 0
              );
              if (diameter) {
                (mapped as any).width = diameter;
                (mapped as any).height = diameter;
              }
              delete (mapped as any).radius;
            }

            updateShape(id, mapped).catch((err) => {
              console.error("Failed to update shape:", err);
            });
          },
          deleteShape: (id: string) => {
            // Delete shape by updating it (since we don't have a direct delete)
            const shape = shapes.find((s) => s.id === id);
            if (shape) {
              setShapes((prev) => prev.filter((s) => s.id !== id));
            }
          },
          selectShape: (id: string | null) => {
            // Wrap the async selectShape function
            selectShape(id);
          },
          deleteSelectedShapes: () => {
            deleteSelectedShapes();
          },
        },
        user: {
          id: user.id,
          name: user.displayName || user.email || "Unknown",
          color: user.color || "#000000",
        },
      };

      // Execute the AI command
      const response = await executeAICommand(message, context);

      // Add AI response to chat
      const aiMessageId = `msg-${Date.now()}-ai`;
      const aiMessage = {
        id: aiMessageId,
        role: "ai" as const,
        content: response?.message || "No response",
        timestamp: Date.now(),
        status: response?.success ? ("success" as const) : ("error" as const),
      };
      setAiChatMessages((prev) => [...prev, aiMessage]);
    },
    [
      user,
      shapes,
      selectedShapeIds,
      canvasDimensions,
      createShape,
      updateShape,
      selectShape,
      deleteSelectedShapes,
      setShapes,
      executeAICommand,
    ]
  );

  // Handle page data changes from LeftSidebar
  const handlePageDataChange = useCallback(
    (
      pages: { id: string; name: string }[],
      objectNames: Record<string, string>
    ) => {
      setInMemoryPages(pages);
      setInMemoryObjectNames(objectNames);
    },
    []
  );

  // Handle page switching
  const handlePageSwitch = useCallback(
    (pageId: string) => {
      // Update current page data in memory before switching (no localStorage saving)
      const updatedPageData = {
        ...pageCanvasData,
        [currentPageId]: {
          shapes: shapes,
          canvasBackground: canvasBackground,
        },
      };

      // Switch to new page
      setCurrentPageId(pageId);

      // Load new page data if it exists
      const newPageData = updatedPageData[pageId];
      if (newPageData) {
        // Load the page's canvas background
        setCanvasBackground(newPageData.canvasBackground);
        // Note: Shapes will be loaded by the useShapes hook when it detects page change
      } else {
        // Create new page with default data
        const newPageDefaultData = { shapes: [], canvasBackground: "#ffffff" };
        updatedPageData[pageId] = newPageDefaultData;
        setCanvasBackground("#ffffff");
      }

      // Update page data in memory only (no localStorage until project save)
      setPageCanvasData(updatedPageData);
    },
    [pageCanvasData, currentPageId, shapes, canvasBackground]
  );

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

  const handleExportPDF = useCallback(async () => {
    try {
      await exportCanvas(shapes, projectName, {
        format: "pdf",
        padding: 20,
        backgroundColor: canvasBackground,
      });
    } catch (error) {
      console.error("Export PDF failed:", error);
    }
  }, [shapes, projectName, canvasBackground]);

  // Hand tool panning implementation
  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace || cursorMode !== "hand") return;

    let isPanning = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isPanning = true;
      startX = e.pageX - workspace.offsetLeft;
      startY = e.pageY - workspace.offsetTop;
      scrollLeft = workspace.scrollLeft;
      scrollTop = workspace.scrollTop;
      workspace.style.cursor = "grabbing";
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning) return;
      e.preventDefault();
      const x = e.pageX - workspace.offsetLeft;
      const y = e.pageY - workspace.offsetTop;
      const walkX = (x - startX) * 1; // Scroll speed multiplier
      const walkY = (y - startY) * 1;
      workspace.scrollLeft = scrollLeft - walkX;
      workspace.scrollTop = scrollTop - walkY;
    };

    const handleMouseUp = () => {
      isPanning = false;
      workspace.style.cursor = "grab";
    };

    const handleMouseLeave = () => {
      isPanning = false;
      workspace.style.cursor = "grab";
    };

    workspace.addEventListener("mousedown", handleMouseDown);
    workspace.addEventListener("mousemove", handleMouseMove);
    workspace.addEventListener("mouseup", handleMouseUp);
    workspace.addEventListener("mouseleave", handleMouseLeave);

    // Set initial cursor
    workspace.style.cursor = "grab";

    return () => {
      workspace.removeEventListener("mousedown", handleMouseDown);
      workspace.removeEventListener("mousemove", handleMouseMove);
      workspace.removeEventListener("mouseup", handleMouseUp);
      workspace.removeEventListener("mouseleave", handleMouseLeave);
      workspace.style.cursor = "default";
    };
  }, [cursorMode]);

  // Restore scroll position on load or center if no saved position
  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace || !isProjectLoaded) return;

    const restoreScrollPosition = () => {
      if (workspace.scrollWidth > 0 && workspace.scrollHeight > 0) {
        // Try to restore saved scroll position
        const savedScrollX = sessionStorage.getItem(
          `canvas-scroll-x-${projectSlug}`
        );
        const savedScrollY = sessionStorage.getItem(
          `canvas-scroll-y-${projectSlug}`
        );

        if (savedScrollX !== null && savedScrollY !== null) {
          // Restore saved position
          workspace.scrollTo(parseInt(savedScrollX), parseInt(savedScrollY));
        } else {
          // No saved position, center the canvas
          const scrollToX = (workspace.scrollWidth - workspace.clientWidth) / 2;
          const scrollToY =
            (workspace.scrollHeight - workspace.clientHeight) / 2;
          workspace.scrollTo(scrollToX, scrollToY);
        }
      }
    };

    // Try immediately
    restoreScrollPosition();

    // Also try after a short delay to ensure everything is loaded
    const timer = setTimeout(restoreScrollPosition, 100);

    return () => clearTimeout(timer);
  }, [canvasDimensions, isProjectLoaded, projectSlug]);

  // Save scroll position whenever it changes
  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace || !isProjectLoaded) return;

    const handleScroll = () => {
      sessionStorage.setItem(
        `canvas-scroll-x-${projectSlug}`,
        workspace.scrollLeft.toString()
      );
      sessionStorage.setItem(
        `canvas-scroll-y-${projectSlug}`,
        workspace.scrollTop.toString()
      );
    };

    workspace.addEventListener("scroll", handleScroll);
    return () => workspace.removeEventListener("scroll", handleScroll);
  }, [isProjectLoaded, projectSlug]);

  // Listen for AI-triggered auto-save requests (e.g., after clear canvas)
  useEffect(() => {
    const handler = async () => {
      if (!actualProjectId) return; // only persist if we have a project id
      try {
        const currentPageData = {
          ...pageCanvasData,
          [currentPageId]: { shapes, canvasBackground },
        };
        await saveProject(actualProjectId, {
          name: projectName || "Untitled Project",
          pages: currentPageData,
          currentPageId,
          canvasBackground,
        });
      } catch (e) {
        console.error("Auto-save after clear failed:", e);
      }
    };
    window.addEventListener("ai:autoSaveRequested", handler as any);
    return () =>
      window.removeEventListener("ai:autoSaveRequested", handler as any);
  }, [
    actualProjectId,
    projectName,
    pageCanvasData,
    currentPageId,
    shapes,
    canvasBackground,
    saveProject,
  ]);

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
                {isProjectLoaded
                  ? projectName || "Untitled Project"
                  : "Loading..."}
              </h1>
            )}
            {savingStatus === "saving" && (
              <div className="saving-status saving" title="Saving changes">
                Saving...
              </div>
            )}
            {savingStatus === "saved" && (
              <div className="saving-status saved" title="Changes saved">
                Saved
              </div>
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
          onUndo={handleUndo}
          onRedo={handleRedo}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onDeleteSelected={deleteSelectedShapes}
          onRenameShape={handleRenameShape}
          onSave={handleSaveProject}
          onNewProject={handleNewProject}
          onAddCollaborators={handleAddCollaborators}
          onExportPNG={handleExportPNG}
          onExportPDF={handleExportPDF}
          canUndo={canUndo}
          canRedo={canRedo}
          hasClipboardContent={clipboard.length > 0}
          hasUnsavedChanges={hasUnsavedChanges}
          currentPageId={currentPageId}
          onPageSwitch={handlePageSwitch}
          projectId={actualProjectId || projectSlug}
          onPageDataChange={handlePageDataChange}
          pages={inMemoryPages}
          objectNames={inMemoryObjectNames}
          aiMessages={aiChatMessages}
          isAIProcessing={isAIProcessing}
          onAISendMessage={handleAIChatMessage}
          isAIEnabled={isAIEnabled}
        />

        {/* Canvas Area */}
        <main className="modern-canvas-main">
          <div className="canvas-workspace" ref={workspaceRef}>
            <div
              className="canvas-container-wrapper"
              style={{
                transform: `scale(${canvasState.scale})`,
                transformOrigin: "top center",
                // Increase dimensions based on zoom to allow panning in all directions when zoomed
                minWidth: `calc((100% + 120px) * ${canvasState.scale})`,
                minHeight: `calc((100% + 120px) * ${canvasState.scale})`,
              }}
            >
              <div
                className="canvas-viewport"
                style={{
                  backgroundColor: canvasBackground,
                  width: `${canvasDimensions?.width || 2000}px`,
                  height: `${canvasDimensions?.height || 2000}px`,
                }}
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
                  cursorMode={cursorMode}
                  onCut={handleCut}
                  onCopy={handleCopy}
                  onPaste={handlePaste}
                  hasClipboardContent={clipboard.length > 0}
                  projectId={actualProjectId || projectSlug}
                  onStageRef={setStageRef}
                />
              </div>
            </div>
          </div>
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
          selectedShapes={shapes.filter((shape) =>
            selectedShapeIds.includes(shape.id)
          )}
          onUpdateShape={updateShape}
          onExportPNG={handleExportPNG}
          onExportSVG={handleExportSVG}
          onExportPDF={handleExportPDF}
          projectId={projectSlug}
          onDeleteSelected={deleteSelectedShapes}
          onClearCanvas={clearAllShapes}
          onCopy={handleCopy}
          onPaste={handlePaste}
        />
      </div>

      {/* Modern Toolbar */}
      <ModernToolbar
        selectedTool={selectedTool}
        onToolSelect={handleToolSelect}
        hasSelectedShapes={selectedShapeIds.length > 0}
        onDeleteSelected={deleteSelectedShapes}
        onDuplicate={handleDuplicate}
        onCopy={handleCopy}
        onPaste={handlePaste}
        hasClipboardContent={clipboard.length > 0}
        selectedColor={selectedColor}
        onColorChange={handleColorChange}
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

      {/* Add Collaborators Modal */}
      <AddCollaboratorsModal
        isOpen={isCollaborationModalOpen}
        onClose={() => setIsCollaborationModalOpen(false)}
        projectId={actualProjectId || projectSlug || slug || ""}
        projectName={projectName}
      />
    </div>
  );
};

export default CanvasPage;
