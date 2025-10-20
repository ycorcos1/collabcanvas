import React, { useState, useRef, useEffect } from "react";
import { Shape } from "../../types/shape";
import { DEBOUNCE_DELAY_MS } from "../../utils/constants";
import "./ModernToolbar.css";

/**
 * Modern Bottom Toolbar Component
 *
 * Features:
 * - Cursor tools (grab, pointer, select)
 * - Shape tools (rectangle, circle, triangle, line, arrow, image)
 * - Text tool
 * - Drawing tools (pen, eraser)
 * - Dropdown menus for each tool category
 */

interface ModernToolbarProps {
  selectedTool: Shape["type"] | null;
  onToolSelect: (tool: Shape["type"] | null) => void;
  hasSelectedShapes: boolean;
  onDeleteSelected: () => void;
  onDuplicate: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  hasClipboardContent?: boolean;
  selectedColor?: string;
  onColorChange?: (color: string) => void;
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onCursorModeChange?: (mode: CursorMode) => void;
  // Sync from parent when cursor mode changes externally (e.g., after text creation)
  currentCursorMode?: string | CursorMode;
  // Grid and snap controls
  showGrid?: boolean;
  gridSize?: 10 | 20 | 50;
  snapToGridEnabled?: boolean;
  onToggleGrid?: () => void;
  onToggleSnap?: () => void;
  onGridSizeChange?: (size: 10 | 20 | 50) => void;
}

type CursorMode = "move" | "hand" | "text";
type ShapeType = "rectangle" | "circle" | "triangle" | "line" | "arrow";
// Drawing removed

// Quick color palette for the enhanced color picker
const QUICK_COLORS = [
  "#FF0000",
  "#FF7F00",
  "#FFFF00",
  "#00FF00",
  "#0000FF",
  "#4B0082",
  "#9400D3",
  "#FFFFFF",
  "#000000",
  "#808080",
  "#C0C0C0",
  "#800000",
  "#808000",
  "#008000",
  "#008080",
  "#000080",
];

export const ModernToolbar: React.FC<ModernToolbarProps> = ({
  selectedTool,
  onToolSelect,
  hasSelectedShapes,
  onDeleteSelected,
  onDuplicate: _onDuplicate, // Reserved for future toolbar duplicate button
  onCopy: _onCopy, // Reserved for future toolbar copy button
  onPaste: _onPaste, // Reserved for future toolbar paste button
  hasClipboardContent: _hasClipboardContent = false, // Reserved for future paste button state
  selectedColor = "#FF0000",
  onColorChange,
  zoom = 100,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onCursorModeChange,
  currentCursorMode,
  showGrid = false,
  snapToGridEnabled = false,
  onToggleGrid,
  onToggleSnap,
  onGridSizeChange: _onGridSizeChange, // Reserved for future grid size picker
}) => {
  // Initialize state from localStorage or defaults
  const [cursorMode, setCursorMode] = useState<CursorMode>(() => {
    const saved = localStorage.getItem("toolbar-cursor-mode");
    return (saved as CursorMode) || "move"; // Default to move tool
  });
  const [shapeMode, setShapeMode] = useState<ShapeType>(() => {
    const saved = localStorage.getItem("toolbar-shape-mode");
    return (saved as ShapeType) || "rectangle";
  });
  const [lastNonImageShape, setLastNonImageShape] = useState<ShapeType>(() => {
    const saved = localStorage.getItem("toolbar-last-non-image-shape");
    return (saved as ShapeType) || "rectangle";
  });
  // Drawing removed
  const [isTextMode, setIsTextMode] = useState(() => {
    const saved = localStorage.getItem("toolbar-text-mode");
    return saved === "true";
  });

  const [showCursorDropdown, setShowCursorDropdown] = useState(false);
  const [showShapeDropdown, setShowShapeDropdown] = useState(false);
  // Drawing removed
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Drawing controls removed

  // File input ref for image upload
  // Image upload removed

  const cursorButtonRef = useRef<HTMLButtonElement>(null);
  const shapeButtonRef = useRef<HTMLButtonElement>(null);
  // Drawing button removed

  // Notify parent of initial cursor mode on mount (default to move).
  useEffect(() => {
    if (onCursorModeChange) {
      onCursorModeChange("move");
    }
    setCursorMode("move");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Consolidated persistence effect with debounce
  useEffect(() => {
    const state = {
      cursorMode,
      shapeMode,
      lastNonImageShape,
      isTextMode: isTextMode.toString(),
    };

    const debounceTimer = setTimeout(() => {
      Object.entries(state).forEach(([key, value]) => {
        localStorage.setItem(`toolbar-${key}`, value);
      });
    }, DEBOUNCE_DELAY_MS);

    return () => clearTimeout(debounceTimer);
  }, [cursorMode, shapeMode, lastNonImageShape, isTextMode]);

  // Sync external cursor mode from parent (e.g., revert to move after using text tool)
  useEffect(() => {
    if (!currentCursorMode) return;
    if (currentCursorMode !== cursorMode) {
      setCursorMode(currentCursorMode);
    }
    if (currentCursorMode !== "text" && isTextMode) {
      setIsTextMode(false);
    }
  }, [currentCursorMode]);

  const cursorTools = [
    {
      id: "move" as const,
      name: "Move",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
          <path d="m13 13 6 6" />
        </svg>
      ),
    },
    {
      id: "hand" as const,
      name: "Hand",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 11V6a2 2 0 0 0-4 0v5" />
          <path d="M14 10V4a2 2 0 0 0-4 0v2" />
          <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
        </svg>
      ),
    },
  ];

  const shapeTools = [
    {
      id: "rectangle" as const,
      name: "Rectangle",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      ),
      shortcut: "R",
    },
    {
      id: "circle" as const,
      name: "Ellipse",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="9" />
        </svg>
      ),
      shortcut: "O",
    },
    {
      id: "triangle" as const,
      name: "Triangle",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="12,2 22,20 2,20" />
        </svg>
      ),
      shortcut: "T",
    },
    {
      id: "line" as const,
      name: "Line",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      ),
      shortcut: "L",
    },
    {
      id: "arrow" as const,
      name: "Arrow",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12,5 19,12 12,19" />
        </svg>
      ),
      shortcut: "A",
    },
  ];

  // Drawing removed

  // Close all dropdowns when one is opened
  const closeAllDropdowns = () => {
    setShowCursorDropdown(false);
    setShowShapeDropdown(false);
  };

  const handleCursorSelect = (mode: CursorMode) => {
    setCursorMode(mode);
    setShowCursorDropdown(false);
    setIsTextMode(false);

    // Notify parent about cursor mode change
    if (onCursorModeChange) {
      onCursorModeChange(mode);
    }

    // When switching to cursor tools, clear any shape tool
    if (mode === "move" || mode === "hand") {
      onToolSelect(null); // Move/Hand tools - no active shape creation
    }
  };

  const handleShapeSelect = (shape: ShapeType) => {
    setShowShapeDropdown(false);
    setIsTextMode(false);
    // Do NOT change cursor mode here; keep last chosen (move/hand) active

    // Image upload removed

    // Update shape mode and track as last non-image shape
    setShapeMode(shape);
    setLastNonImageShape(shape);

    // Map toolbar shape names to Canvas component shape types
    const shapeTypeMap: Record<string, string> = {
      rectangle: "rect",
      circle: "ellipse",
      triangle: "triangle",
      line: "line",
      arrow: "arrow",
    };

    // Pass the mapped shape type to canvas
    const canvasShapeType = shapeTypeMap[shape];
    if (canvasShapeType) {
      onToolSelect(canvasShapeType as any);
    } else {
      // For unsupported shapes, clear the tool selection
      onToolSelect(null);
    }
  };

  // Image upload removed

  // Drawing removed

  const handleTextSelect = () => {
    const newTextMode = !isTextMode;
    setIsTextMode(newTextMode);
    onToolSelect(null); // Clear shape tool when text mode

    // Notify parent about cursor mode change
    if (onCursorModeChange) {
      onCursorModeChange(newTextMode ? "text" : "move");
    }

    closeAllDropdowns();
  };

  // Zoom functionality - use props if available
  const handleZoomIn = () => {
    if (onZoomIn) {
      onZoomIn();
    }
  };

  const handleZoomOut = () => {
    if (onZoomOut) {
      onZoomOut();
    }
  };

  const handleZoomReset = () => {
    if (onZoomReset) {
      onZoomReset();
    }
  };

  const getCurrentCursorTool = () =>
    cursorTools.find((tool) => tool.id === cursorMode);
  const getCurrentShapeTool = () =>
    shapeTools.find((tool) => tool.id === lastNonImageShape); // Always show last non-image shape
  // Drawing removed

  return (
    <>
      {/* Image upload removed */}

      {/* Drawing Toolbar removed */}

      {/* Main Modern Toolbar */}
      <div className="modern-toolbar">
        <div className="toolbar-left">
          {/* Cursor Tool */}
          <div className="tool-group">
            <div className="split-button">
              <button
                ref={cursorButtonRef}
                className={`main-tool-button ${
                  selectedTool === null && !isTextMode ? "active" : ""
                }`}
                onClick={() => {
                  closeAllDropdowns();
                  handleCursorSelect(cursorMode);
                }}
                title={getCurrentCursorTool()?.name}
              >
                {getCurrentCursorTool()?.icon}
              </button>
              <button
                className="dropdown-button"
                onClick={() => {
                  closeAllDropdowns();
                  setShowCursorDropdown(!showCursorDropdown);
                }}
                title="More cursor tools"
              >
                <svg
                  className="dropdown-arrow"
                  width="8"
                  height="8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6,9 12,15 18,9" />
                </svg>
              </button>
            </div>

            {showCursorDropdown && (
              <div className="tool-dropdown">
                {cursorTools.map((tool) => (
                  <button
                    key={tool.id}
                    className={`dropdown-item ${
                      cursorMode === tool.id ? "active" : ""
                    }`}
                    onClick={() => handleCursorSelect(tool.id)}
                  >
                    {tool.icon}
                    <span>{tool.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Shape Tool */}
          <div className="tool-group">
            <div className="split-button">
              <button
                ref={shapeButtonRef}
                className={`main-tool-button ${
                  (selectedTool === "rectangle" ||
                    selectedTool === "circle" ||
                    selectedTool === "rect" ||
                    selectedTool === "ellipse" ||
                    selectedTool === "triangle" ||
                    selectedTool === "line" ||
                    selectedTool === "arrow") &&
                  !isTextMode
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  closeAllDropdowns();
                  handleShapeSelect(shapeMode);
                }}
                title={getCurrentShapeTool()?.name}
              >
                {getCurrentShapeTool()?.icon}
              </button>
              <button
                className="dropdown-button"
                onClick={() => {
                  closeAllDropdowns();
                  setShowShapeDropdown(!showShapeDropdown);
                }}
                title="More shape tools"
              >
                <svg
                  className="dropdown-arrow"
                  width="8"
                  height="8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6,9 12,15 18,9" />
                </svg>
              </button>
            </div>

            {showShapeDropdown && (
              <div className="tool-dropdown">
                {shapeTools.map((tool) => (
                  <button
                    key={tool.id}
                    className={`dropdown-item ${
                      shapeMode === tool.id ? "active" : ""
                    }`}
                    onClick={() => handleShapeSelect(tool.id)}
                  >
                    {tool.icon}
                    <span>{tool.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Text Tool */}
          <div className="tool-group">
            <div className="split-button">
              <button
                className={`main-tool-button ${isTextMode ? "active" : ""}`}
                onClick={handleTextSelect}
                title="Text"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="4,7 4,4 20,4 20,7" />
                  <line x1="9" y1="20" x2="15" y2="20" />
                  <line x1="12" y1="4" x2="12" y2="20" />
                </svg>
              </button>
            </div>
          </div>

          {/* Drawing tool removed */}
        </div>

        <div className="toolbar-center">
          <div className="zoom-controls">
            <button
              className="zoom-button"
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </button>
            <span
              className="zoom-level"
              onClick={handleZoomReset}
              title="Reset Zoom"
            >
              {zoom}%
            </span>
            <button
              className="zoom-button"
              onClick={handleZoomIn}
              title="Zoom In"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </button>
          </div>

          {/* Grid and Snap Controls */}
          <div className="grid-snap-controls">
            <button
              className={`grid-button ${showGrid ? "active" : ""}`}
              onClick={onToggleGrid}
              title="Toggle Grid"
              disabled={!onToggleGrid}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>

            <button
              className={`snap-button ${snapToGridEnabled ? "active" : ""}`}
              onClick={onToggleSnap}
              title="Snap to Grid"
              disabled={!onToggleSnap}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2 L12 6 M12 18 L12 22 M2 12 L6 12 M18 12 L22 12" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </div>

        <div className="toolbar-right">
          {/* Enhanced Color Picker - Show when shape tool is selected or shapes are selected */}
          {(selectedTool || hasSelectedShapes) && onColorChange && (
            <div className="color-picker-group">
              <button
                className="color-picker-button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                title={hasSelectedShapes ? "Change Shape Color" : "Shape Color"}
              >
                <div
                  className="color-preview"
                  style={{ backgroundColor: selectedColor }}
                />
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m19 9-7 7-7-7" />
                </svg>
              </button>

              {showColorPicker && (
                <div className="color-picker-dropdown">
                  <div className="color-picker-header">
                    <span>
                      {hasSelectedShapes ? "Change Color" : "Shape Color"}
                    </span>
                    <button
                      className="close-picker"
                      onClick={() => setShowColorPicker(false)}
                    >
                      ×
                    </button>
                  </div>

                  {/* Quick Colors Grid */}
                  <div className="quick-colors">
                    {QUICK_COLORS.map((color) => (
                      <button
                        key={color}
                        className={`color-swatch ${
                          selectedColor === color ? "active" : ""
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          onColorChange(color);
                          if (!hasSelectedShapes) {
                            setShowColorPicker(false);
                          }
                        }}
                        title={color}
                      />
                    ))}
                  </div>

                  {/* Custom Color Input */}
                  <div className="custom-color-section">
                    <label>Custom Color</label>
                    <div className="custom-color-input">
                      <input
                        type="color"
                        value={selectedColor}
                        onChange={(e) => onColorChange(e.target.value)}
                      />
                      <input
                        type="text"
                        value={selectedColor}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                            onColorChange(value);
                          }
                        }}
                        placeholder="#000000"
                        className="hex-input"
                      />
                    </div>
                  </div>

                  {hasSelectedShapes && (
                    <button
                      className="apply-color-button"
                      onClick={() => setShowColorPicker(false)}
                    >
                      Apply to Selected
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick Actions for Selected Shapes */}
          {hasSelectedShapes && (
            <div className="quick-actions">
              {/* Copy/Paste buttons removed as requested */}
              {/* Duplicate action removed as requested */}

              <button
                className="action-button"
                onClick={onDeleteSelected}
                title="Delete (Del)"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
