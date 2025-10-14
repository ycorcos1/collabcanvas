import React from "react";
import { Shape } from "../../types/shape";
import "./Toolbar.css";

interface ToolbarProps {
  selectedTool: Shape["type"] | null;
  onToolSelect: (tool: Shape["type"] | null) => void;
  onClearAll: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  selectedTool,
  onToolSelect,
  onClearAll,
}) => {
  const handleToolClick = (tool: Shape["type"]) => {
    // Toggle tool selection - if same tool is clicked, deselect it
    onToolSelect(selectedTool === tool ? null : tool);
  };

  const handleClearAll = () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear all shapes? This action cannot be undone."
    );
    if (confirmed) {
      onClearAll();
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
    </div>
  );
};
