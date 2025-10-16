import React, { useState, useRef } from "react";
import { Shape } from "../../types/shape";
import { ColorPicker } from "../ColorPicker/ColorPicker";
import "./BottomToolbar.css";

/**
 * Bottom Toolbar Component - Modern bottom toolbar
 *
 * Features:
 * - Drawing tools (select, rectangle, circle)
 * - Tool shortcuts and quick actions
 * - Color picker
 * - Zoom controls
 */

interface BottomToolbarProps {
  selectedTool: Shape["type"] | null;
  onToolSelect: (tool: Shape["type"] | null) => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  hasSelectedShapes: boolean;
  onDeleteSelected: () => void;
  onDuplicate: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  selectedTool,
  onToolSelect,
  selectedColor,
  onColorChange,
  hasSelectedShapes,
  onDeleteSelected,
  onDuplicate,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => {
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const colorButtonRef = useRef<HTMLButtonElement>(null);

  const tools = [
    {
      id: null,
      name: "Move",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 2l7 7-3 3 8 8 3-3 7 7H2V2z" />
        </svg>
      ),
      shortcut: "V",
    },
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
  ];

  return (
    <div className="bottom-toolbar">
      <div className="toolbar-left">
        {/* Drawing Tools */}
        <div className="tool-group">
          {tools.map((tool) => (
            <button
              key={tool.id || "select"}
              className={`tool-button ${
                selectedTool === tool.id ? "active" : ""
              }`}
              onClick={() => onToolSelect(tool.id)}
              title={`${tool.name} (${tool.shortcut})`}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="toolbar-separator" />

        {/* Quick Actions */}
        <div className="tool-group">
          <button
            className={`tool-button ${!canUndo ? "disabled" : ""}`}
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (⌘Z)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 7v6h6" />
              <path d="m21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
            </svg>
          </button>

          <button
            className={`tool-button ${!canRedo ? "disabled" : ""}`}
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (⌘⇧Z)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m21 7-6-6v6h-6a9 9 0 0 0-9 9 9 9 0 0 0 9 9h6v-6" />
            </svg>
          </button>
        </div>

        {/* Separator */}
        <div className="toolbar-separator" />

        {/* Shape Actions */}
        {hasSelectedShapes && (
          <>
            <div className="tool-group">
              <button
                className="tool-button"
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
                className="tool-button"
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
            <div className="toolbar-separator" />
          </>
        )}

        {/* Color Picker */}
        <div className="tool-group">
          <button
            ref={colorButtonRef}
            className="color-tool-button"
            onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
            title="Fill Color"
          >
            <div
              className="color-swatch"
              style={{ backgroundColor: selectedColor }}
            />
          </button>
        </div>
      </div>

      <div className="toolbar-center">
        {/* Tool Info */}
        <div className="tool-info">
          {selectedTool ? (
            <span>{tools.find((t) => t.id === selectedTool)?.name}</span>
          ) : (
            <span>Move</span>
          )}
        </div>
      </div>

      <div className="toolbar-right">
        {/* Zoom Controls */}
        <div className="zoom-controls">
          <button className="zoom-button" title="Zoom Out">
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

          <span className="zoom-level">100%</span>

          <button className="zoom-button" title="Zoom In">
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
      </div>

      {/* Color Picker */}
      <ColorPicker
        selectedColor={selectedColor}
        onColorChange={onColorChange}
        isOpen={isColorPickerOpen}
        onClose={() => setIsColorPickerOpen(false)}
        anchorEl={colorButtonRef.current}
      />
    </div>
  );
};
