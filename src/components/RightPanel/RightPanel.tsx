import React, { useState } from "react";
import { UserPresence } from "../Presence/UserPresence";
import { CanvasBackground } from "../CanvasBackground/CanvasBackground";
import "./RightPanel.css";

/**
 * Right Panel Component - Modern right panel
 *
 * Features:
 * - Design properties
 * - User presence
 * - Canvas settings
 * - Export options
 */

interface RightPanelProps {
  canvasBackground: string;
  onBackgroundChange: (color: string) => void;
  isBackgroundPickerOpen: boolean;
  onToggleBackgroundPicker: () => void;
  onCloseBackgroundPicker: () => void;
  hasSelectedShapes: boolean;
  selectedShapeIds: string[];
  onExportPNG: () => void;
  onExportSVG: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  canvasBackground,
  onBackgroundChange,
  isBackgroundPickerOpen,
  onToggleBackgroundPicker,
  onCloseBackgroundPicker,
  hasSelectedShapes,
  selectedShapeIds,
  onExportPNG,
  onExportSVG,
}) => {
  const [activeTab, setActiveTab] = useState<"design" | "prototype">("design");

  return (
    <div className="right-panel">
      {/* Header Tabs */}
      <div className="panel-tabs">
        <button
          className={`tab-button ${activeTab === "design" ? "active" : ""}`}
          onClick={() => setActiveTab("design")}
        >
          Design
        </button>
        <button
          className={`tab-button ${activeTab === "prototype" ? "active" : ""}`}
          onClick={() => setActiveTab("prototype")}
        >
          Prototype
        </button>
      </div>

      {/* Content */}
      <div className="panel-content">
        {activeTab === "design" && (
          <div className="design-panel">
            {/* Canvas Settings */}
            <div className="panel-section">
              <div className="section-header">
                <h3>Canvas</h3>
              </div>
              <div className="section-content">
                <div className="property-row">
                  <label>Background</label>
                  <button
                    className="background-button"
                    onClick={onToggleBackgroundPicker}
                  >
                    <div
                      className="background-preview"
                      style={{ backgroundColor: canvasBackground }}
                    />
                    <span>{canvasBackground}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Selection Properties */}
            {hasSelectedShapes && (
              <div className="panel-section">
                <div className="section-header">
                  <h3>Selection</h3>
                  <span className="selection-count">
                    {selectedShapeIds.length} selected
                  </span>
                </div>
                <div className="section-content">
                  <div className="property-row">
                    <label>Properties</label>
                    <div className="property-placeholder">
                      Shape properties will appear here
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Export */}
            <div className="panel-section">
              <div className="section-header">
                <h3>Export</h3>
              </div>
              <div className="section-content">
                <div className="export-buttons">
                  <button className="export-button" onClick={onExportPNG}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14,2 14,8 20,8" />
                    </svg>
                    Export PNG
                  </button>
                  <button className="export-button" onClick={onExportSVG}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14,2 14,8 20,8" />
                      <circle cx="10" cy="12" r="2" />
                    </svg>
                    Export SVG
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "prototype" && (
          <div className="prototype-panel">
            <div className="panel-section">
              <div className="section-header">
                <h3>Collaboration</h3>
              </div>
              <div className="section-content">
                <UserPresence />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Canvas Background Picker */}
      <CanvasBackground
        backgroundColor={canvasBackground}
        onBackgroundChange={onBackgroundChange}
        isOpen={isBackgroundPickerOpen}
        onClose={onCloseBackgroundPicker}
      />
    </div>
  );
};
