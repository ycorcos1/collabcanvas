/**
 * AlignmentGuides Component
 *
 * Displays visual alignment guides when shapes align with other shapes or canvas.
 * Features:
 * - Center alignment (horizontal and vertical)
 * - Edge alignment (top, right, bottom, left)
 * - Distance indicators for equal spacing
 * - Pink/purple guide lines (Figma-style)
 */

import React from "react";
import { Line } from "react-konva";

export interface AlignmentGuide {
  type: "vertical" | "horizontal";
  position: number; // x position for vertical, y position for horizontal
  start: number; // y start for vertical, x start for horizontal
  end: number; // y end for vertical, x end for horizontal
  snapType: "center" | "edge" | "spacing";
}

interface AlignmentGuidesProps {
  guides: AlignmentGuide[];
  canvasDimensions: { width: number; height: number };
}

/**
 * AlignmentGuides Component
 * Renders visual guide lines when shapes align
 */
export const AlignmentGuides: React.FC<AlignmentGuidesProps> = ({ guides }) => {
  if (guides.length === 0) return null;

  return (
    <>
      {guides.map((guide, index) => {
        // Guide line color (pink/purple for alignment, orange for spacing)
        const color =
          guide.snapType === "spacing"
            ? "#FF6B6B" // Orange-red for spacing indicators
            : "#E879F9"; // Pink/purple for alignment

        if (guide.type === "vertical") {
          // Vertical guide line (aligned horizontally)
          return (
            <Line
              key={`guide-v-${index}`}
              points={[guide.position, guide.start, guide.position, guide.end]}
              stroke={color}
              strokeWidth={1}
              dash={[4, 4]}
              listening={false}
              perfectDrawEnabled={false}
            />
          );
        } else {
          // Horizontal guide line (aligned vertically)
          return (
            <Line
              key={`guide-h-${index}`}
              points={[guide.start, guide.position, guide.end, guide.position]}
              stroke={color}
              strokeWidth={1}
              dash={[4, 4]}
              listening={false}
              perfectDrawEnabled={false}
            />
          );
        }
      })}
    </>
  );
};

/**
 * Calculate alignment guides for a dragging shape
 * Returns guide lines when the shape aligns with other shapes
 */
export const calculateAlignmentGuides = (
  draggingShape: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
  otherShapes: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>,
  snapThreshold: number = 5,
  canvasDimensions: { width: number; height: number }
): { guides: AlignmentGuide[]; snapX: number | null; snapY: number | null } => {
  const guides: AlignmentGuide[] = [];
  let snapX: number | null = null;
  let snapY: number | null = null;

  // Calculate dragging shape boundaries
  const dragLeft = draggingShape.x;
  const dragRight = draggingShape.x + draggingShape.width;
  const dragCenterX = draggingShape.x + draggingShape.width / 2;
  const dragTop = draggingShape.y;
  const dragBottom = draggingShape.y + draggingShape.height;
  const dragCenterY = draggingShape.y + draggingShape.height / 2;

  // Canvas center lines
  const canvasCenterX = canvasDimensions.width / 2;
  const canvasCenterY = canvasDimensions.height / 2;

  // Check alignment with canvas center
  if (Math.abs(dragCenterX - canvasCenterX) < snapThreshold) {
    guides.push({
      type: "vertical",
      position: canvasCenterX,
      start: 0,
      end: canvasDimensions.height,
      snapType: "center",
    });
    snapX = canvasCenterX - draggingShape.width / 2;
  }

  if (Math.abs(dragCenterY - canvasCenterY) < snapThreshold) {
    guides.push({
      type: "horizontal",
      position: canvasCenterY,
      start: 0,
      end: canvasDimensions.width,
      snapType: "center",
    });
    snapY = canvasCenterY - draggingShape.height / 2;
  }

  // Check alignment with other shapes
  otherShapes.forEach((shape) => {
    const shapeLeft = shape.x;
    const shapeRight = shape.x + shape.width;
    const shapeCenterX = shape.x + shape.width / 2;
    const shapeTop = shape.y;
    const shapeBottom = shape.y + shape.height;
    const shapeCenterY = shape.y + shape.height / 2;

    // Vertical alignment checks (X-axis)
    // Left edges align
    if (Math.abs(dragLeft - shapeLeft) < snapThreshold && snapX === null) {
      const minY = Math.min(dragTop, shapeTop);
      const maxY = Math.max(dragBottom, shapeBottom);
      guides.push({
        type: "vertical",
        position: shapeLeft,
        start: minY,
        end: maxY,
        snapType: "edge",
      });
      snapX = shapeLeft;
    }

    // Right edges align
    if (Math.abs(dragRight - shapeRight) < snapThreshold && snapX === null) {
      const minY = Math.min(dragTop, shapeTop);
      const maxY = Math.max(dragBottom, shapeBottom);
      guides.push({
        type: "vertical",
        position: shapeRight,
        start: minY,
        end: maxY,
        snapType: "edge",
      });
      snapX = shapeRight - draggingShape.width;
    }

    // Center X align
    if (
      Math.abs(dragCenterX - shapeCenterX) < snapThreshold &&
      snapX === null
    ) {
      const minY = Math.min(dragTop, shapeTop);
      const maxY = Math.max(dragBottom, shapeBottom);
      guides.push({
        type: "vertical",
        position: shapeCenterX,
        start: minY,
        end: maxY,
        snapType: "center",
      });
      snapX = shapeCenterX - draggingShape.width / 2;
    }

    // Left to Right edge align (shape to the right)
    if (Math.abs(dragLeft - shapeRight) < snapThreshold && snapX === null) {
      const minY = Math.min(dragTop, shapeTop);
      const maxY = Math.max(dragBottom, shapeBottom);
      guides.push({
        type: "vertical",
        position: shapeRight,
        start: minY,
        end: maxY,
        snapType: "edge",
      });
      snapX = shapeRight;
    }

    // Right to Left edge align (shape to the left)
    if (Math.abs(dragRight - shapeLeft) < snapThreshold && snapX === null) {
      const minY = Math.min(dragTop, shapeTop);
      const maxY = Math.max(dragBottom, shapeBottom);
      guides.push({
        type: "vertical",
        position: shapeLeft,
        start: minY,
        end: maxY,
        snapType: "edge",
      });
      snapX = shapeLeft - draggingShape.width;
    }

    // Horizontal alignment checks (Y-axis)
    // Top edges align
    if (Math.abs(dragTop - shapeTop) < snapThreshold && snapY === null) {
      const minX = Math.min(dragLeft, shapeLeft);
      const maxX = Math.max(dragRight, shapeRight);
      guides.push({
        type: "horizontal",
        position: shapeTop,
        start: minX,
        end: maxX,
        snapType: "edge",
      });
      snapY = shapeTop;
    }

    // Bottom edges align
    if (Math.abs(dragBottom - shapeBottom) < snapThreshold && snapY === null) {
      const minX = Math.min(dragLeft, shapeLeft);
      const maxX = Math.max(dragRight, shapeRight);
      guides.push({
        type: "horizontal",
        position: shapeBottom,
        start: minX,
        end: maxX,
        snapType: "edge",
      });
      snapY = shapeBottom - draggingShape.height;
    }

    // Center Y align
    if (
      Math.abs(dragCenterY - shapeCenterY) < snapThreshold &&
      snapY === null
    ) {
      const minX = Math.min(dragLeft, shapeLeft);
      const maxX = Math.max(dragRight, shapeRight);
      guides.push({
        type: "horizontal",
        position: shapeCenterY,
        start: minX,
        end: maxX,
        snapType: "center",
      });
      snapY = shapeCenterY - draggingShape.height / 2;
    }

    // Top to Bottom edge align (shape below)
    if (Math.abs(dragTop - shapeBottom) < snapThreshold && snapY === null) {
      const minX = Math.min(dragLeft, shapeLeft);
      const maxX = Math.max(dragRight, shapeRight);
      guides.push({
        type: "horizontal",
        position: shapeBottom,
        start: minX,
        end: maxX,
        snapType: "edge",
      });
      snapY = shapeBottom;
    }

    // Bottom to Top edge align (shape above)
    if (Math.abs(dragBottom - shapeTop) < snapThreshold && snapY === null) {
      const minX = Math.min(dragLeft, shapeLeft);
      const maxX = Math.max(dragRight, shapeRight);
      guides.push({
        type: "horizontal",
        position: shapeTop,
        start: minX,
        end: maxX,
        snapType: "edge",
      });
      snapY = shapeTop - draggingShape.height;
    }
  });

  return { guides, snapX, snapY };
};
