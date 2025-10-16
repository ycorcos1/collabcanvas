import React, { useState, useRef } from "react";
import { Shape } from "../../types/shape";
import "./ModernToolbar.css";

/**
 * Modern Bottom Toolbar Component
 *
 * Features:
 * - Cursor tools (grab, pointer, select)
 * - Shape tools (rectangle, circle, polygon, triangle, line, arrow, star, image)
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
}

type CursorMode = "grab" | "pointer" | "select";
type ShapeType =
  | "rectangle"
  | "circle"
  | "polygon"
  | "triangle"
  | "line"
  | "arrow"
  | "star"
  | "image";
type DrawingMode = "brush" | "eraser";

export const ModernToolbar: React.FC<ModernToolbarProps> = ({
  selectedTool,
  onToolSelect,
  hasSelectedShapes,
  onDeleteSelected,
  onDuplicate,
}) => {
  const [cursorMode, setCursorMode] = useState<CursorMode>("select");
  const [shapeMode, setShapeMode] = useState<ShapeType>("rectangle");
  const [drawingMode, setDrawingMode] = useState<DrawingMode>("brush");
  const [isTextMode, setIsTextMode] = useState(false);

  const [showCursorDropdown, setShowCursorDropdown] = useState(false);
  const [showShapeDropdown, setShowShapeDropdown] = useState(false);
  const [showDrawingDropdown, setShowDrawingDropdown] = useState(false);
  const [showDrawingToolbar, setShowDrawingToolbar] = useState(false);

  const [brushSize, setBrushSize] = useState(4);
  const [brushColor] = useState("#000000");
  const [zoom, setZoom] = useState(100);

  const cursorButtonRef = useRef<HTMLButtonElement>(null);
  const shapeButtonRef = useRef<HTMLButtonElement>(null);
  const drawingButtonRef = useRef<HTMLButtonElement>(null);

  const cursorTools = [
    {
      id: "grab" as const,
      name: "Hand tool",
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
      shortcut: "H",
    },
      {
        id: "pointer" as const,
        name: "Move",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
            <path d="m13 13 6 6"/>
          </svg>
        ),
        shortcut: "V",
      },
      {
        id: "select" as const,
        name: "Select",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
            <path d="m13 13 6 6"/>
          </svg>
        ),
        shortcut: "V",
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
      id: "polygon" as const,
      name: "Polygon",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
        </svg>
      ),
      shortcut: "P",
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
    {
      id: "star" as const,
      name: "Star",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ),
      shortcut: "S",
    },
    {
      id: "image" as const,
      name: "Image",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
      ),
      shortcut: "I",
    },
  ];

  const drawingTools = [
    {
      id: "brush" as const,
      name: "Brush",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="M2 2l7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
      ),
      shortcut: "B",
    },
    {
      id: "eraser" as const,
      name: "Eraser",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.5l9.6-9.6c1-1 2.5-1 3.5 0l5.2 5.2c1 1 1 2.5 0 3.5L13 21" />
          <path d="M22 21H7" />
          <path d="m5 11 9 9" />
        </svg>
      ),
      shortcut: "E",
    },
  ];

  // Close all dropdowns when one is opened
  const closeAllDropdowns = () => {
    setShowCursorDropdown(false);
    setShowShapeDropdown(false);
    setShowDrawingDropdown(false);
  };

  const handleCursorSelect = (mode: CursorMode) => {
    setCursorMode(mode);
    setShowCursorDropdown(false);
    if (mode === "select") {
      onToolSelect(null); // Select tool
    }
    // Handle grab and pointer modes as needed
  };

  const handleShapeSelect = (shape: ShapeType) => {
    setShapeMode(shape);
    setShowShapeDropdown(false);
    if (shape === "rectangle" || shape === "circle") {
      onToolSelect(shape);
    }
    // Handle other shapes as needed
  };

  const handleDrawingSelect = (mode: DrawingMode) => {
    setDrawingMode(mode);
    setShowDrawingDropdown(false);
    setShowDrawingToolbar(true);
    // Handle drawing mode
  };

  const handleTextSelect = () => {
    setIsTextMode(!isTextMode);
    closeAllDropdowns();
    // Handle text mode
  };

  // Zoom functionality
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 500));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 25));
  };

  const handleZoomReset = () => {
    setZoom(100);
  };

  const getCurrentCursorTool = () =>
    cursorTools.find((tool) => tool.id === cursorMode);
  const getCurrentShapeTool = () =>
    shapeTools.find((tool) => tool.id === shapeMode);
  const getCurrentDrawingTool = () =>
    drawingTools.find((tool) => tool.id === drawingMode);

  return (
    <>
      {/* Drawing Toolbar (appears above main toolbar when in drawing mode) */}
      {showDrawingToolbar && (
        <div className="drawing-toolbar">
          <div className="drawing-controls">
            <div className="brush-size-control">
              <label>Size</label>
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="brush-size-slider"
              />
              <span className="brush-size-value">{brushSize}</span>
            </div>

            <div className="brush-color-control">
              <label>Color</label>
              <button
                className="brush-color-button"
                style={{ backgroundColor: brushColor }}
                onClick={() => {
                  /* Open color picker */
                }}
              />
            </div>

            <button
              className="close-drawing-toolbar"
              onClick={() => setShowDrawingToolbar(false)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Modern Toolbar */}
      <div className="modern-toolbar">
        <div className="toolbar-left">
          {/* Cursor Tool */}
          <div className="tool-group">
            <button
              ref={cursorButtonRef}
              className={`main-tool-button ${
                selectedTool === null && cursorMode === "select" ? "active" : ""
              }`}
               onClick={() => {
                 closeAllDropdowns();
                 setShowCursorDropdown(!showCursorDropdown);
               }}
              title={getCurrentCursorTool()?.name}
            >
              {getCurrentCursorTool()?.icon}
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
                    <span className="shortcut">{tool.shortcut}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Shape Tool */}
          <div className="tool-group">
            <button
              ref={shapeButtonRef}
              className={`main-tool-button ${
                selectedTool === "rectangle" || selectedTool === "circle"
                  ? "active"
                  : ""
              }`}
               onClick={() => {
                 closeAllDropdowns();
                 setShowShapeDropdown(!showShapeDropdown);
               }}
              title={getCurrentShapeTool()?.name}
            >
              {getCurrentShapeTool()?.icon}
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
                    <span className="shortcut">{tool.shortcut}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Text Tool */}
          <div className="tool-group">
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

          {/* Drawing Tool */}
          <div className="tool-group">
            <button
              ref={drawingButtonRef}
              className={`main-tool-button ${
                showDrawingToolbar ? "active" : ""
              }`}
               onClick={() => {
                 closeAllDropdowns();
                 setShowDrawingDropdown(!showDrawingDropdown);
               }}
              title={getCurrentDrawingTool()?.name}
            >
              {getCurrentDrawingTool()?.icon}
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

            {showDrawingDropdown && (
              <div className="tool-dropdown">
                {drawingTools.map((tool) => (
                  <button
                    key={tool.id}
                    className={`dropdown-item ${
                      drawingMode === tool.id ? "active" : ""
                    }`}
                    onClick={() => handleDrawingSelect(tool.id)}
                  >
                    {tool.icon}
                    <span>{tool.name}</span>
                    <span className="shortcut">{tool.shortcut}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="toolbar-center">
          <div className="zoom-controls">
            <button className="zoom-button" onClick={handleZoomOut} title="Zoom Out">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
            <span className="zoom-level" onClick={handleZoomReset} title="Reset Zoom">{zoom}%</span>
            <button className="zoom-button" onClick={handleZoomIn} title="Zoom In">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
                <line x1="11" y1="8" x2="11" y2="14"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="toolbar-right">
          {/* Quick Actions for Selected Shapes */}
          {hasSelectedShapes && (
            <div className="quick-actions">
              <button
                className="action-button"
                onClick={onDuplicate}
                title="Duplicate (⌘D)"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>

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
