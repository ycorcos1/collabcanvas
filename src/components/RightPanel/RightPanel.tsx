import React, { useState } from "react";
import { UserPresence } from "../Presence/UserPresence";
import { CanvasBackground } from "../CanvasBackground/CanvasBackground";
import { usePresence } from "../../hooks/usePresence";
import { useCanvasDimensions } from "../../hooks/useCanvasDimensions";
import { Shape } from "../../types/shape";
import "./RightPanel.css";

/**
 * Right Panel Component - Dynamic design tools and collaboration
 *
 * Features:
 * - Dynamic design properties based on selection
 * - Canvas settings (background, dimensions, export)
 * - Shape properties (size, color)
 * - Text properties (font, styling, size)
 * - Online users with count
 */

interface RightPanelProps {
  canvasBackground: string;
  onBackgroundChange: (color: string) => void;
  isBackgroundPickerOpen: boolean;
  onToggleBackgroundPicker: () => void;
  onCloseBackgroundPicker: () => void;
  selectedShapes: Shape[];
  onUpdateShape: (id: string, updates: Partial<Shape>) => void;
  onExportPNG: () => void;
  onExportSVG: () => void;
  onExportPDF: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  canvasBackground,
  onBackgroundChange,
  isBackgroundPickerOpen,
  onToggleBackgroundPicker,
  onCloseBackgroundPicker,
  selectedShapes,
  onUpdateShape,
  onExportPNG,
  onExportSVG,
  onExportPDF,
}) => {
  const [activeTab, setActiveTab] = useState<"design" | "online">("design");
  const { getUserCount } = usePresence();
  const { dimensions, updateDimensions, resetToDefault } = useCanvasDimensions();

  // Determine what type of selection we have
  const hasSelection = selectedShapes.length > 0;
  const selectionType = hasSelection ? getSelectionType(selectedShapes) : null;

  // Helper function to determine selection type
  function getSelectionType(shapes: Shape[]): 'mixed' | 'rectangle' | 'circle' | 'text' | 'drawing' {
    if (shapes.length === 0) return 'mixed';
    const firstType = shapes[0].type;
    const allSameType = shapes.every(shape => shape.type === firstType);
    return allSameType ? firstType : 'mixed';
  }

  // Handle shape property updates
  const handleShapeUpdate = (property: string, value: any) => {
    selectedShapes.forEach(shape => {
      onUpdateShape(shape.id, { [property]: value });
    });
  };

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
          className={`tab-button ${activeTab === "online" ? "active" : ""}`}
          onClick={() => setActiveTab("online")}
        >
          Online ({getUserCount()})
        </button>
      </div>

      {/* Content */}
      <div className="panel-content">
        {activeTab === "design" && (
          <div className="design-panel">
            {/* Dynamic Design Content Based on Selection */}
            {!hasSelection && (
              <>
                {/* Canvas Settings - Default when nothing selected */}
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
                    
                    <div className="property-row">
                      <label>Width</label>
                      <input
                        type="number"
                        value={dimensions.width}
                        onChange={(e) => updateDimensions(parseInt(e.target.value) || dimensions.width, dimensions.height)}
                        className="dimension-input"
                        min="500"
                        max="15000"
                      />
                    </div>
                    
                    <div className="property-row">
                      <label>Height</label>
                      <input
                        type="number"
                        value={dimensions.height}
                        onChange={(e) => updateDimensions(dimensions.width, parseInt(e.target.value) || dimensions.height)}
                        className="dimension-input"
                        min="500"
                        max="15000"
                      />
                    </div>
                    
                    <button className="reset-button" onClick={resetToDefault}>
                      Reset to Default
                    </button>
                  </div>
                </div>

                {/* Export Options */}
                <div className="panel-section">
                  <div className="section-header">
                    <h3>Export</h3>
                  </div>
                  <div className="section-content">
                    <div className="export-buttons">
                      <button className="export-button" onClick={onExportPNG}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7,10 12,15 17,10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        PNG
                      </button>
                      <button className="export-button" onClick={onExportSVG}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7,10 12,15 17,10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        SVG
                      </button>
                      <button className="export-button" onClick={onExportPDF}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14,2 14,8 20,8"/>
                          <path d="M16 13H8"/>
                          <path d="M16 17H8"/>
                        </svg>
                        PDF
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Shape Properties - When shapes are selected */}
            {hasSelection && (selectionType === 'rectangle' || selectionType === 'circle' || selectionType === 'mixed') && (
              <div className="panel-section">
                <div className="section-header">
                  <h3>Shape Properties</h3>
                  <span className="selection-count">{selectedShapes.length} selected</span>
                </div>
                <div className="section-content">
                  <div className="property-row">
                    <label>Width</label>
                    <input
                      type="number"
                      value={selectedShapes[0]?.width || 0}
                      onChange={(e) => handleShapeUpdate('width', parseInt(e.target.value) || 0)}
                      className="property-input"
                      min="1"
                    />
                  </div>
                  
                  <div className="property-row">
                    <label>Height</label>
                    <input
                      type="number"
                      value={selectedShapes[0]?.height || 0}
                      onChange={(e) => handleShapeUpdate('height', parseInt(e.target.value) || 0)}
                      className="property-input"
                      min="1"
                    />
                  </div>
                  
                  <div className="property-row">
                    <label>Color</label>
                    <input
                      type="color"
                      value={selectedShapes[0]?.color || '#000000'}
                      onChange={(e) => handleShapeUpdate('color', e.target.value)}
                      className="color-input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Text Properties - When text is selected */}
            {hasSelection && selectionType === 'text' && (
              <div className="panel-section">
                <div className="section-header">
                  <h3>Text Properties</h3>
                  <span className="selection-count">{selectedShapes.length} selected</span>
                </div>
                <div className="section-content">
                  <div className="property-row">
                    <label>Width</label>
                    <input
                      type="number"
                      value={selectedShapes[0]?.width || 0}
                      onChange={(e) => handleShapeUpdate('width', parseInt(e.target.value) || 0)}
                      className="property-input"
                      min="1"
                    />
                  </div>
                  
                  <div className="property-row">
                    <label>Height</label>
                    <input
                      type="number"
                      value={selectedShapes[0]?.height || 0}
                      onChange={(e) => handleShapeUpdate('height', parseInt(e.target.value) || 0)}
                      className="property-input"
                      min="1"
                    />
                  </div>
                  
                  <div className="property-row">
                    <label>Font Family</label>
                    <select
                      value={selectedShapes[0]?.fontFamily || 'Arial'}
                      onChange={(e) => handleShapeUpdate('fontFamily', e.target.value)}
                      className="font-select"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Courier New">Courier New</option>
                    </select>
                  </div>
                  
                  <div className="property-row">
                    <label>Font Size</label>
                    <input
                      type="number"
                      value={selectedShapes[0]?.fontSize || 16}
                      onChange={(e) => handleShapeUpdate('fontSize', parseInt(e.target.value) || 16)}
                      className="property-input"
                      min="8"
                      max="72"
                    />
                  </div>
                  
                  <div className="property-row">
                    <label>Text Color</label>
                    <input
                      type="color"
                      value={selectedShapes[0]?.color || '#000000'}
                      onChange={(e) => handleShapeUpdate('color', e.target.value)}
                      className="color-input"
                    />
                  </div>
                  
                  <div className="property-row">
                    <label>Style</label>
                    <div className="text-style-buttons">
                      <button className="style-button">
                        <strong>B</strong>
                      </button>
                      <button className="style-button">
                        <em>I</em>
                      </button>
                      <button className="style-button">
                        <u>U</u>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "online" && (
          <div className="online-panel">
            <div className="panel-section">
              <div className="section-header">
                <h3>Online Users</h3>
              </div>
              <div className="section-content">
                <UserPresence variant="right-panel" />
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
