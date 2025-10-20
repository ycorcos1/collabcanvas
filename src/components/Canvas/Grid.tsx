/**
 * Grid Component
 *
 * Displays an optional grid overlay on the canvas
 * Features:
 * - Configurable grid size (10px, 20px, 50px, custom)
 * - Snap-to-grid functionality
 * - Toggle on/off
 * - Semi-transparent appearance
 */

import React from "react";
import { Line } from "react-konva";

export type GridSize = 10 | 20 | 50 | number;

interface GridProps {
  width: number;
  height: number;
  gridSize: GridSize;
  visible: boolean;
  opacity?: number;
}

/**
 * Grid Component
 * Renders a grid overlay on the canvas
 */
export const Grid: React.FC<GridProps> = ({
  width,
  height,
  gridSize,
  visible,
  opacity = 0.15,
}) => {
  if (!visible) return null;

  const lines: React.ReactElement[] = [];

  // Vertical lines
  for (let i = 0; i <= width; i += gridSize) {
    lines.push(
      <Line
        key={`v-${i}`}
        points={[i, 0, i, height]}
        stroke="#8B5CF6" // Purple color
        strokeWidth={i % (gridSize * 5) === 0 ? 1 : 0.5} // Thicker lines every 5 intervals
        opacity={opacity}
        listening={false}
        perfectDrawEnabled={false}
      />
    );
  }

  // Horizontal lines
  for (let i = 0; i <= height; i += gridSize) {
    lines.push(
      <Line
        key={`h-${i}`}
        points={[0, i, width, i]}
        stroke="#8B5CF6" // Purple color
        strokeWidth={i % (gridSize * 5) === 0 ? 1 : 0.5} // Thicker lines every 5 intervals
        opacity={opacity}
        listening={false}
        perfectDrawEnabled={false}
      />
    );
  }

  return <>{lines}</>;
};

/**
 * Snap a coordinate to the nearest grid point
 */
export const snapToGrid = (
  value: number,
  gridSize: number,
  enabled: boolean
): number => {
  if (!enabled) return value;
  return Math.round(value / gridSize) * gridSize;
};

/**
 * Snap a shape's position to the grid
 */
export const snapShapeToGrid = (
  shape: { x: number; y: number; width: number; height: number },
  gridSize: number,
  enabled: boolean
): { x: number; y: number } => {
  if (!enabled) return { x: shape.x, y: shape.y };

  return {
    x: snapToGrid(shape.x, gridSize, enabled),
    y: snapToGrid(shape.y, gridSize, enabled),
  };
};
