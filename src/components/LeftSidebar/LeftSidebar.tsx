import React, { useState } from 'react';
import { Shape } from '../../types/shape';
import './LeftSidebar.css';

/**
 * Left Sidebar Component - Figma-style left panel
 * 
 * Features:
 * - File/project management
 * - Pages navigation
 * - Layers panel
 * - Assets panel
 */

interface LeftSidebarProps {
  shapes: Shape[];
  selectedShapeIds: string[];
  onSelectShape: (id: string | null, isShiftPressed?: boolean) => void;
  projectName: string;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  shapes,
  selectedShapeIds,
  onSelectShape,
  projectName,
}) => {
  const [activeTab, setActiveTab] = useState<'pages' | 'layers'>('layers');

  // Convert shapes to layer items with generated names
  const layers = shapes
    .map((shape, index) => ({
      ...shape,
      name: `${shape.type.charAt(0).toUpperCase() + shape.type.slice(1)} ${index + 1}`,
    }))
    .sort((a, b) => b.zIndex - a.zIndex); // Sort by z-index (highest first)

  const handleLayerClick = (layerId: string, event: React.MouseEvent) => {
    const isShiftPressed = event.shiftKey;
    onSelectShape(layerId, isShiftPressed);
  };

  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'rectangle':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
          </svg>
        );
      case 'circle':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9"/>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
          </svg>
        );
    }
  };

  return (
    <div className="left-sidebar">
      {/* File Section */}
      <div className="sidebar-section file-section">
        <div className="file-info">
          <div className="file-name">{projectName}</div>
          <div className="file-status">
            <span className="status-badge">Free</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sidebar-tabs">
        <button
          className={`tab-button ${activeTab === 'pages' ? 'active' : ''}`}
          onClick={() => setActiveTab('pages')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
          </svg>
          Pages
        </button>
        <button
          className={`tab-button ${activeTab === 'layers' ? 'active' : ''}`}
          onClick={() => setActiveTab('layers')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12,2 2,7 12,12 22,7 12,2"/>
            <polyline points="2,17 12,22 22,17"/>
            <polyline points="2,12 12,17 22,12"/>
          </svg>
          Layers
        </button>
      </div>

      {/* Content Area */}
      <div className="sidebar-content">
        {activeTab === 'pages' && (
          <div className="pages-panel">
            <div className="page-item active">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
              <span>Page 1</span>
            </div>
          </div>
        )}

        {activeTab === 'layers' && (
          <div className="layers-panel">
            {layers.length === 0 ? (
              <div className="empty-layers">
                <p>No layers yet</p>
                <span>Create shapes to see them here</span>
              </div>
            ) : (
              <div className="layers-list">
                {layers.map((layer) => (
                  <div
                    key={layer.id}
                    className={`layer-item ${
                      selectedShapeIds.includes(layer.id) ? 'selected' : ''
                    }`}
                    onClick={(e) => handleLayerClick(layer.id, e)}
                  >
                    <div className="layer-content">
                      <div className="layer-icon">
                        {getLayerIcon(layer.type)}
                      </div>
                      <div className="layer-info">
                        <span className="layer-name">{layer.name}</span>
                      </div>
                      <div className="layer-controls">
                        <div 
                          className="layer-color-preview" 
                          style={{ backgroundColor: layer.color }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
