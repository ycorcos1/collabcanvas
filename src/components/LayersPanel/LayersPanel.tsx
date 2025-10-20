/**
 * LayersPanel Component
 *
 * Figma-like layers panel for managing shape z-index, visibility, and selection
 * Features drag-to-reorder, click-to-select, and visibility toggles
 */

import React, { useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Shape } from "../../types/shape";
import "./LayersPanel.css";

interface LayersPanelProps {
  shapes: Shape[];
  selectedShapeIds: string[];
  onSelectShape: (shapeId: string | null) => void;
  onUpdateShape: (shapeId: string, updates: Partial<Shape>) => void;
  onDeleteShape: (shapeId: string) => void;
  onReorderLayers: (shapes: Shape[]) => void;
}

/**
 * Individual layer item component (sortable)
 */
interface LayerItemProps {
  shape: Shape;
  isSelected: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
}

function LayerItem({
  shape,
  isSelected,
  onSelect,
  onToggleVisibility,
  onDelete,
}: LayerItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shape.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Get shape icon based on type (using SVG icons for consistency)
  const getShapeIcon = () => {
    const iconSize = 14;
    const iconColor = "currentColor";

    switch (shape.type) {
      case "rectangle":
      case "rect":
        return (
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 16 16"
            fill={iconColor}
          >
            <rect x="2" y="2" width="12" height="12" />
          </svg>
        );
      case "circle":
      case "ellipse":
        return (
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 16 16"
            fill={iconColor}
          >
            <circle cx="8" cy="8" r="6" />
          </svg>
        );
      case "triangle":
        return (
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 16 16"
            fill={iconColor}
          >
            <path d="M8 2 L14 14 L2 14 Z" />
          </svg>
        );
      case "line":
        return (
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 16 16"
            stroke={iconColor}
            fill="none"
            strokeWidth="2"
          >
            <line x1="2" y1="14" x2="14" y2="2" />
          </svg>
        );
      case "arrow":
        return (
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 16 16"
            stroke={iconColor}
            fill="none"
            strokeWidth="2"
          >
            <line x1="2" y1="8" x2="14" y2="8" />
            <polyline points="10,4 14,8 10,12" />
          </svg>
        );
      case "text":
        return (
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 16 16"
            fill={iconColor}
          >
            <text x="2" y="12" fontSize="12" fontWeight="bold">
              T
            </text>
          </svg>
        );
      case "drawing":
        return (
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 16 16"
            stroke={iconColor}
            fill="none"
            strokeWidth="1.5"
          >
            <path d="M2,14 Q4,8 6,10 T10,6 T14,8" />
          </svg>
        );
      case "image":
        return (
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 16 16"
            fill={iconColor}
          >
            <rect
              x="2"
              y="2"
              width="12"
              height="12"
              stroke={iconColor}
              fill="none"
              strokeWidth="1.5"
            />
            <circle cx="6" cy="6" r="1.5" />
            <path d="M2,12 L6,8 L10,10 L14,6 L14,14 L2,14 Z" />
          </svg>
        );
      default:
        return (
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 16 16"
            stroke={iconColor}
            fill="none"
            strokeWidth="1.5"
          >
            <rect x="2" y="2" width="12" height="12" />
          </svg>
        );
    }
  };

  // Get display name for layer
  const getLayerName = () => {
    if (shape.name) return shape.name;
    if (shape.type === "text" && shape.text) {
      return (
        shape.text.substring(0, 20) + (shape.text.length > 20 ? "..." : "")
      );
    }
    return `${shape.type.charAt(0).toUpperCase() + shape.type.slice(1)}`;
  };

  const isVisible = shape.visible !== false; // Default to true

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`layer-item ${isSelected ? "selected" : ""} ${
        !isVisible ? "hidden" : ""
      }`}
      onClick={onSelect}
    >
      {/* Drag handle */}
      <div className="layer-drag-handle" {...attributes} {...listeners}>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="3" cy="3" r="1" fill="currentColor" />
          <circle cx="9" cy="3" r="1" fill="currentColor" />
          <circle cx="3" cy="6" r="1" fill="currentColor" />
          <circle cx="9" cy="6" r="1" fill="currentColor" />
          <circle cx="3" cy="9" r="1" fill="currentColor" />
          <circle cx="9" cy="9" r="1" fill="currentColor" />
        </svg>
      </div>

      {/* Shape icon */}
      <span className="layer-icon" title={shape.type}>
        {getShapeIcon()}
      </span>

      {/* Color indicator */}
      <div
        className="layer-color-indicator"
        style={{ backgroundColor: shape.color }}
        title={`Color: ${shape.color}`}
      />

      {/* Layer name */}
      <span className="layer-name">{getLayerName()}</span>

      {/* Visibility toggle */}
      <button
        className="layer-visibility-btn"
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility();
        }}
        title={isVisible ? "Hide layer" : "Show layer"}
        aria-label={isVisible ? "Hide layer" : "Show layer"}
      >
        {isVisible ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 3C4.5 3 1.5 5.5 1 8c.5 2.5 3.5 5 7 5s6.5-2.5 7-5c-.5-2.5-3.5-5-7-5z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <circle cx="8" cy="8" r="2" fill="currentColor" />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 2L14 14M4.5 4.5C3 5.5 2 7 1 8c.5 2.5 3.5 5 7 5 1 0 2-.3 2.9-.7M10 10c-.5.3-1 .5-1.5.7-2-.3-3.5-2-3.5-4 0-.5.1-1 .3-1.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>

      {/* Delete button */}
      <button
        className="layer-delete-btn"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete layer"
        aria-label="Delete layer"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 4h10M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v4M10 7v4M4 4h8l-1 9H5L4 4z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

/**
 * Layers Panel Component
 */
export const LayersPanel: React.FC<LayersPanelProps> = ({
  shapes,
  selectedShapeIds,
  onSelectShape,
  onUpdateShape,
  onDeleteShape,
  onReorderLayers,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sort shapes by zIndex (highest first - top of list)
  const sortedShapes = useMemo(() => {
    return [...shapes].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
  }, [shapes]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedShapes.findIndex((s) => s.id === active.id);
      const newIndex = sortedShapes.findIndex((s) => s.id === over.id);

      // Reorder the array
      const reordered = arrayMove(sortedShapes, oldIndex, newIndex);

      // Update zIndex for all shapes based on new order
      const updatedShapes = reordered.map((shape, index) => ({
        ...shape,
        zIndex: reordered.length - index, // Highest zIndex for top item
      }));

      onReorderLayers(updatedShapes);
    }
  };

  const handleToggleVisibility = (shape: Shape) => {
    const nextVisible = shape.visible === false ? true : false;
    onUpdateShape(shape.id, { visible: nextVisible });
  };

  const handleSelectLayer = (shapeId: string) => {
    onSelectShape(shapeId);
  };

  const handleDeleteLayer = (shapeId: string) => {
    onDeleteShape(shapeId);
  };

  if (shapes.length === 0) {
    return (
      <div className="layers-panel">
        <div className="layers-panel-header">
          <h3>Layers</h3>
        </div>
        <div className="layers-panel-empty">
          <p>No layers yet</p>
          <span>Create a shape to get started</span>
        </div>
      </div>
    );
  }

  return (
    <div className="layers-panel">
      <div className="layers-panel-header">
        <h3>Layers</h3>
        <span className="layers-count">{shapes.length}</span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedShapes.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="layers-list">
            {sortedShapes.map((shape) => (
              <LayerItem
                key={shape.id}
                shape={shape}
                isSelected={selectedShapeIds.includes(shape.id)}
                onSelect={() => handleSelectLayer(shape.id)}
                onToggleVisibility={() => handleToggleVisibility(shape)}
                onDelete={() => handleDeleteLayer(shape.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
