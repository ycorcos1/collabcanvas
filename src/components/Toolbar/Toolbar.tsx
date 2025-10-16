import React, { useState, useRef } from "react";
import { Shape } from "../../types/shape";
import { useCanvasDimensions } from "../../hooks/useCanvasDimensions";
import { ColorPicker } from "../ColorPicker/ColorPicker";
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
  selectedColor?: string;
  onColorChange?: (color: string) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onDuplicate?: () => void;
  onExportPNG?: () => void;
  onExportSVG?: () => void;
  onExportSelectedPNG?: () => void;
  onExportSelectedSVG?: () => void;
  onAlignLeft?: () => void;
  onAlignRight?: () => void;
  onAlignCenterH?: () => void;
  onAlignTop?: () => void;
  onAlignBottom?: () => void;
  onAlignCenterV?: () => void;
  onDistributeH?: () => void;
  onDistributeV?: () => void;
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
  selectedColor = "#4ECDC4",
  onColorChange,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onDuplicate,
  onExportPNG,
  onExportSVG,
  onExportSelectedPNG,
  onExportSelectedSVG,
  onAlignLeft,
  onAlignRight,
  onAlignCenterH,
  onAlignTop,
  onAlignBottom,
  onAlignCenterV,
  onDistributeH,
  onDistributeV,
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

  // Color picker state
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const colorButtonRef = useRef<HTMLButtonElement>(null);

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

      {/* Color Section */}
      <div className="toolbar-section">
        <h3>Color</h3>

        <button
          ref={colorButtonRef}
          className="tool-button color-button"
          onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
          title="Select Color"
        >
          <div
            className="color-preview"
            style={{ backgroundColor: selectedColor }}
          />
          <span>Color</span>
        </button>
      </div>

      <div className="toolbar-section">
        <h3>Actions</h3>

        {/* Undo Button */}
        {onUndo && (
          <button
            className={`tool-button ${!canUndo ? "disabled" : ""}`}
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Cmd+Z)"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 7v6h6" />
              <path d="m21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
            </svg>
            Undo
          </button>
        )}

        {/* Redo Button */}
        {onRedo && (
          <button
            className={`tool-button ${!canRedo ? "disabled" : ""}`}
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Cmd+Y)"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m21 7-6-6v6h-6a9 9 0 0 0-9 9 9 9 0 0 0 9 9h6v-6" />
            </svg>
            Redo
          </button>
        )}

        {/* Duplicate Button */}
        {onDuplicate && (
          <button
            className={`tool-button ${!hasSelectedShapes ? "disabled" : ""}`}
            onClick={onDuplicate}
            disabled={!hasSelectedShapes}
            title="Duplicate (Cmd+D)"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Duplicate
          </button>
        )}

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

      {/* Export Section */}
      <div className="toolbar-section">
        <h3>Export</h3>

        {/* Export Canvas as PNG */}
        {onExportPNG && (
          <button
            className="tool-button"
            onClick={onExportPNG}
            title="Export Canvas as PNG"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10,9 9,9 8,9" />
            </svg>
            PNG
          </button>
        )}

        {/* Export Canvas as SVG */}
        {onExportSVG && (
          <button
            className="tool-button"
            onClick={onExportSVG}
            title="Export Canvas as SVG"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <circle cx="10" cy="12" r="2" />
              <path d="m20 17-1.09-1.09a2 2 0 0 0-2.82 0L10 22" />
            </svg>
            SVG
          </button>
        )}

        {/* Export Selected as PNG */}
        {onExportSelectedPNG && (
          <button
            className={`tool-button ${!hasSelectedShapes ? "disabled" : ""}`}
            onClick={onExportSelectedPNG}
            disabled={!hasSelectedShapes}
            title="Export Selected as PNG"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <rect x="8" y="12" width="8" height="4" rx="1" />
            </svg>
            PNG Selected
          </button>
        )}

        {/* Export Selected as SVG */}
        {onExportSelectedSVG && (
          <button
            className={`tool-button ${!hasSelectedShapes ? "disabled" : ""}`}
            onClick={onExportSelectedSVG}
            disabled={!hasSelectedShapes}
            title="Export Selected as SVG"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <circle cx="10" cy="15" r="1" />
              <circle cx="14" cy="15" r="1" />
            </svg>
            SVG Selected
          </button>
        )}
      </div>

      {/* Alignment Section */}
      {hasSelectedShapes && (
        <div className="toolbar-section">
          <h3>Align</h3>

          {/* Horizontal Alignment */}
          <div className="alignment-group">
            <span className="alignment-label">Horizontal:</span>
            <div className="alignment-buttons">
              {onAlignLeft && (
                <button
                  className="tool-button alignment-btn"
                  onClick={onAlignLeft}
                  title="Align Left"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="15" y2="12" />
                    <line x1="3" y1="18" x2="18" y2="18" />
                  </svg>
                </button>
              )}
              {onAlignCenterH && (
                <button
                  className="tool-button alignment-btn"
                  onClick={onAlignCenterH}
                  title="Align Center Horizontal"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="12" y1="2" x2="12" y2="22" />
                    <rect x="8" y="6" width="8" height="4" />
                    <rect x="6" y="14" width="12" height="4" />
                  </svg>
                </button>
              )}
              {onAlignRight && (
                <button
                  className="tool-button alignment-btn"
                  onClick={onAlignRight}
                  title="Align Right"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="9" y1="12" x2="21" y2="12" />
                    <line x1="6" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Vertical Alignment */}
          <div className="alignment-group">
            <span className="alignment-label">Vertical:</span>
            <div className="alignment-buttons">
              {onAlignTop && (
                <button
                  className="tool-button alignment-btn"
                  onClick={onAlignTop}
                  title="Align Top"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="6" y1="3" x2="6" y2="21" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                    <line x1="18" y1="3" x2="18" y2="18" />
                  </svg>
                </button>
              )}
              {onAlignCenterV && (
                <button
                  className="tool-button alignment-btn"
                  onClick={onAlignCenterV}
                  title="Align Center Vertical"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <rect x="6" y="8" width="4" height="8" />
                    <rect x="14" y="6" width="4" height="12" />
                  </svg>
                </button>
              )}
              {onAlignBottom && (
                <button
                  className="tool-button alignment-btn"
                  onClick={onAlignBottom}
                  title="Align Bottom"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="6" y1="3" x2="6" y2="21" />
                    <line x1="12" y1="9" x2="12" y2="21" />
                    <line x1="18" y1="6" x2="18" y2="21" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Distribution */}
          <div className="alignment-group">
            <span className="alignment-label">Distribute:</span>
            <div className="alignment-buttons">
              {onDistributeH && (
                <button
                  className="tool-button alignment-btn"
                  onClick={onDistributeH}
                  title="Distribute Horizontally"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="8" width="4" height="8" />
                    <rect x="10" y="6" width="4" height="12" />
                    <rect x="17" y="8" width="4" height="8" />
                  </svg>
                </button>
              )}
              {onDistributeV && (
                <button
                  className="tool-button alignment-btn"
                  onClick={onDistributeV}
                  title="Distribute Vertically"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="8" y="3" width="8" height="4" />
                    <rect x="6" y="10" width="12" height="4" />
                    <rect x="8" y="17" width="8" height="4" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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

      {/* Color Picker */}
      {onColorChange && (
        <ColorPicker
          selectedColor={selectedColor}
          onColorChange={onColorChange}
          isOpen={isColorPickerOpen}
          onClose={() => setIsColorPickerOpen(false)}
          anchorEl={colorButtonRef.current}
        />
      )}
    </div>
  );
};
