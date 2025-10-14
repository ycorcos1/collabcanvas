import React, { useState } from "react";
import { Shape } from "../../types/shape";
import { useCanvasDimensions } from "../../hooks/useCanvasDimensions";
import "./Toolbar.css";

/**
 * Props interface for the Toolbar component
 * Handles tool selection, shape actions, and canvas dimension controls
 */
interface ToolbarProps {
  selectedTool: Shape["type"] | null;
  onToolSelect: (tool: Shape["type"] | null) => void;
  onClearAll: () => void;
  onDeleteSelected: () => void;
  hasSelectedShapes: boolean;
}

/**
 * Toolbar Component - Main UI controls for the collaborative canvas
 *
 * Features:
 * - Shape creation tools (Rectangle, Circle)
 * - Shape management actions (Delete Selected, Clear All)
 * - Dynamic canvas resizing with real-time sync across all users
 * - Auto-correction for dimension inputs (5000-15000 pixel range)
 * - Confirmation dialogs for destructive actions
 */

export const Toolbar: React.FC<ToolbarProps> = ({
  selectedTool,
  onToolSelect,
  onClearAll,
  onDeleteSelected,
  hasSelectedShapes,
}) => {
  const {
    dimensions,
    updateDimensions,
    resetToDefault,
    defaultDimensions,
    error: dimensionsError,
  } = useCanvasDimensions();

  // Local state for temporary dimension values during editing
  const [tempWidth, setTempWidth] = useState(dimensions.width.toString());
  const [tempHeight, setTempHeight] = useState(dimensions.height.toString());

  // Update temp values when dimensions change from Firebase
  React.useEffect(() => {
    setTempWidth(dimensions.width.toString());
    setTempHeight(dimensions.height.toString());
  }, [dimensions]);

  const handleToolClick = (tool: Shape["type"]) => {
    // Toggle tool selection - if same tool is clicked, deselect it
    onToolSelect(selectedTool === tool ? null : tool);
  };

  const handleDeleteSelected = () => {
    onDeleteSelected();
  };

  const handleClearAll = () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear all shapes? This action cannot be undone."
    );
    if (confirmed) {
      onClearAll();
    }
  };

  /**
   * Handles canvas dimension updates with validation and auto-correction
   * Enforces min/max limits (5000-15000) and syncs changes across all users
   */
  const handleDimensionUpdate = () => {
    let width = parseInt(tempWidth);
    let height = parseInt(tempHeight);

    if (isNaN(width) || isNaN(height)) {
      alert("Please enter valid numbers for width and height.");
      return;
    }

    // Auto-correct values to be within valid range
    if (width < 5000) {
      width = 5000;
      setTempWidth("5000");
    } else if (width > 15000) {
      width = 15000;
      setTempWidth("15000");
    }

    if (height < 5000) {
      height = 5000;
      setTempHeight("5000");
    } else if (height > 15000) {
      height = 15000;
      setTempHeight("15000");
    }

    updateDimensions(width, height);
  };

  const handleResetDimensions = () => {
    const confirmed = window.confirm(
      `Are you sure you want to reset the canvas size to ${defaultDimensions.width}x${defaultDimensions.height}? This will affect all users.`
    );
    if (confirmed) {
      resetToDefault();
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <h3>Tools</h3>

        {/* Rectangle Tool */}
        <button
          className={`tool-button ${
            selectedTool === "rectangle" ? "active" : ""
          }`}
          onClick={() => handleToolClick("rectangle")}
          title="Create Rectangle"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
          Rectangle
        </button>

        {/* Circle Tool */}
        <button
          className={`tool-button ${selectedTool === "circle" ? "active" : ""}`}
          onClick={() => handleToolClick("circle")}
          title="Create Circle"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
          Circle
        </button>
      </div>

      <div className="toolbar-section">
        <h3>Actions</h3>

        {/* Delete Selected Button */}
        <button
          className={`tool-button delete-selected-button ${
            !hasSelectedShapes ? "disabled" : ""
          }`}
          onClick={handleDeleteSelected}
          disabled={!hasSelectedShapes}
          title={
            hasSelectedShapes ? "Delete Selected Shapes" : "No shapes selected"
          }
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3,6 5,6 21,6"></polyline>
            <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
          Delete Selected
        </button>

        {/* Clear All Button */}
        <button
          className="tool-button clear-all-button"
          onClick={handleClearAll}
          title="Clear All Shapes"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3,6 5,6 21,6"></polyline>
            <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
          Clear All
        </button>
      </div>

      <div className="toolbar-section">
        <h3>Canvas Size</h3>

        {dimensionsError && (
          <div className="error-message">{dimensionsError}</div>
        )}

        <div className="dimension-controls">
          <div className="dimension-input-group">
            <label>Width:</label>
            <input
              type="number"
              value={tempWidth}
              onChange={(e) => setTempWidth(e.target.value)}
              onBlur={(e) => {
                const value = parseInt(e.target.value);
                if (isNaN(value) || value < 5000) {
                  setTempWidth("5000");
                } else if (value > 15000) {
                  setTempWidth("15000");
                }
              }}
              min="5000"
              max="15000"
              className="dimension-input"
            />
          </div>

          <div className="dimension-input-group">
            <label>Height:</label>
            <input
              type="number"
              value={tempHeight}
              onChange={(e) => setTempHeight(e.target.value)}
              onBlur={(e) => {
                const value = parseInt(e.target.value);
                if (isNaN(value) || value < 5000) {
                  setTempHeight("5000");
                } else if (value > 15000) {
                  setTempHeight("15000");
                }
              }}
              min="5000"
              max="15000"
              className="dimension-input"
            />
          </div>
        </div>

        <div className="dimension-buttons">
          <button
            className="tool-button update-dimensions-button"
            onClick={handleDimensionUpdate}
            title="Update Canvas Size"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="1,4 1,10 7,10"></polyline>
              <polyline points="23,20 23,14 17,14"></polyline>
              <path d="m20.49,9A9,9 0 0,0 5.64,5.64L1,10m22,4l-4.64,4.36A9,9 0 0,1 3.51,15"></path>
            </svg>
            Update Size
          </button>

          <button
            className="tool-button reset-dimensions-button"
            onClick={handleResetDimensions}
            title="Reset to Default Size"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
              <path d="M3 21v-5h5"></path>
            </svg>
            Reset
          </button>
        </div>

        <div className="current-dimensions">
          Current: {dimensions.width} × {dimensions.height}
        </div>
      </div>
    </div>
  );
};
