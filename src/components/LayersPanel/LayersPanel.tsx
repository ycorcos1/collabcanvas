import React, { useState, useCallback } from 'react';
import { Shape } from '../../types/shape';
import './LayersPanel.css';

/**
 * Layers Panel Component - Manage shape layers and z-index
 * 
 * Features:
 * - Visual layer hierarchy
 * - Drag-to-reorder layers
 * - Show/hide layers
 * - Rename layers
 * - Z-index management (bring to front, send to back)
 * - Layer selection and multi-selection
 */

interface LayersPanelProps {
  shapes: Shape[];
  selectedShapeIds: string[];
  onSelectShape: (id: string | null, isShiftPressed?: boolean) => void;
  onUpdateShape: (id: string, updates: Partial<Shape>) => void;
  onBringToFront: (shapeIds: string[]) => void;
  onSendToBack: (shapeIds: string[]) => void;
  onBringForward: (shapeIds: string[]) => void;
  onSendBackward: (shapeIds: string[]) => void;
  isOpen: boolean;
  onToggle: () => void;
}

interface LayerItem extends Shape {
  name: string;
  visible: boolean;
  locked: boolean;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  shapes,
  selectedShapeIds,
  onSelectShape,
  onUpdateShape,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  isOpen,
  onToggle,
}) => {
  const [draggedLayer, setDraggedLayer] = useState<string | null>(null);
  const [dragOverLayer, setDragOverLayer] = useState<string | null>(null);

  // Convert shapes to layer items with generated names
  const layers: LayerItem[] = shapes
    .map((shape, index) => ({
      ...shape,
      name: `${shape.type.charAt(0).toUpperCase() + shape.type.slice(1)} ${index + 1}`,
      visible: true,
      locked: false,
    }))
    .sort((a, b) => b.zIndex - a.zIndex); // Sort by z-index (highest first)

  // Handle layer selection
  const handleLayerClick = useCallback((layerId: string, event: React.MouseEvent) => {
    const isShiftPressed = event.shiftKey;
    onSelectShape(layerId, isShiftPressed);
  }, [onSelectShape]);

  // Handle drag start
  const handleDragStart = useCallback((event: React.DragEvent, layerId: string) => {
    setDraggedLayer(layerId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', layerId);
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((event: React.DragEvent, layerId: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverLayer(layerId);
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback(() => {
    setDragOverLayer(null);
  }, []);

  // Handle drop
  const handleDrop = useCallback((event: React.DragEvent, targetLayerId: string) => {
    event.preventDefault();
    setDragOverLayer(null);
    
    if (!draggedLayer || draggedLayer === targetLayerId) {
      setDraggedLayer(null);
      return;
    }

    const draggedShape = shapes.find(s => s.id === draggedLayer);
    const targetShape = shapes.find(s => s.id === targetLayerId);
    
    if (!draggedShape || !targetShape) {
      setDraggedLayer(null);
      return;
    }

    // Update z-index to place dragged layer above target
    onUpdateShape(draggedLayer, {
      zIndex: targetShape.zIndex + 1,
    });

    setDraggedLayer(null);
  }, [draggedLayer, shapes, onUpdateShape]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedLayer(null);
    setDragOverLayer(null);
  }, []);

  // Get layer icon based on shape type
  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'rectangle':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
          </svg>
        );
      case 'circle':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
          </svg>
        );
    }
  };

  if (!isOpen) {
    return (
      <div className="layers-panel collapsed">
        <button className="layers-toggle" onClick={onToggle} title="Show Layers">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12,2 2,7 12,12 22,7 12,2"/>
            <polyline points="2,17 12,22 22,17"/>
            <polyline points="2,12 12,17 22,12"/>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="layers-panel">
      <div className="layers-header">
        <h3>Layers</h3>
        <div className="layers-actions">
          {selectedShapeIds.length > 0 && (
            <>
              <button
                className="layer-action-btn"
                onClick={() => onBringToFront(selectedShapeIds)}
                title="Bring to Front"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m3 8 4-4 4 4"/>
                  <path d="M7 4v16"/>
                  <rect x="15" y="4" width="4" height="6" ry="2"/>
                  <rect x="15" y="14" width="4" height="6" ry="2"/>
                </svg>
              </button>
              <button
                className="layer-action-btn"
                onClick={() => onBringForward(selectedShapeIds)}
                title="Bring Forward"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m18 15-6-6-6 6"/>
                </svg>
              </button>
              <button
                className="layer-action-btn"
                onClick={() => onSendBackward(selectedShapeIds)}
                title="Send Backward"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
              <button
                className="layer-action-btn"
                onClick={() => onSendToBack(selectedShapeIds)}
                title="Send to Back"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m21 16-4 4-4-4"/>
                  <path d="M17 20V4"/>
                  <rect x="5" y="4" width="4" height="6" ry="2"/>
                  <rect x="5" y="14" width="4" height="6" ry="2"/>
                </svg>
              </button>
            </>
          )}
          <button className="layers-toggle" onClick={onToggle} title="Hide Layers">
            ×
          </button>
        </div>
      </div>

      <div className="layers-list">
        {layers.length === 0 ? (
          <div className="layers-empty">
            <p>No layers yet</p>
            <span>Create shapes to see them here</span>
          </div>
        ) : (
          layers.map((layer) => (
            <div
              key={layer.id}
              className={`layer-item ${
                selectedShapeIds.includes(layer.id) ? 'selected' : ''
              } ${draggedLayer === layer.id ? 'dragging' : ''} ${
                dragOverLayer === layer.id ? 'drag-over' : ''
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, layer.id)}
              onDragOver={(e) => handleDragOver(e, layer.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, layer.id)}
              onDragEnd={handleDragEnd}
              onClick={(e) => handleLayerClick(layer.id, e)}
            >
              <div className="layer-content">
                <div className="layer-icon">
                  {getLayerIcon(layer.type)}
                </div>
                <div className="layer-info">
                  <span className="layer-name">{layer.name}</span>
                  <span className="layer-details">
                    {Math.round(layer.width)} × {Math.round(layer.height)}
                  </span>
                </div>
                <div className="layer-controls">
                  <div 
                    className="layer-color-preview" 
                    style={{ backgroundColor: layer.color }}
                    title={layer.color}
                  />
                  <span className="layer-z-index">{layer.zIndex}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
