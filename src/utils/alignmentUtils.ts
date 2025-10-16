import { Shape } from '../types/shape';

/**
 * Alignment Utilities - Handle shape alignment and distribution
 * 
 * Features:
 * - Align shapes left, center, right, top, middle, bottom
 * - Distribute shapes evenly horizontally and vertically
 * - Calculate bounds and positioning for multiple shapes
 */

export interface AlignmentBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

/**
 * Calculate bounds for a single shape
 */
export const getShapeBounds = (shape: Shape): AlignmentBounds => {
  const left = shape.x;
  const right = shape.x + shape.width;
  const top = shape.y;
  const bottom = shape.y + shape.height;
  const centerX = shape.x + shape.width / 2;
  const centerY = shape.y + shape.height / 2;

  return {
    left,
    right,
    top,
    bottom,
    centerX,
    centerY,
    width: shape.width,
    height: shape.height,
  };
};

/**
 * Calculate collective bounds for multiple shapes
 */
export const getCollectiveBounds = (shapes: Shape[]): AlignmentBounds => {
  if (shapes.length === 0) {
    return {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      centerX: 0,
      centerY: 0,
      width: 0,
      height: 0,
    };
  }

  const bounds = shapes.map(getShapeBounds);
  const left = Math.min(...bounds.map(b => b.left));
  const right = Math.max(...bounds.map(b => b.right));
  const top = Math.min(...bounds.map(b => b.top));
  const bottom = Math.max(...bounds.map(b => b.bottom));
  const width = right - left;
  const height = bottom - top;
  const centerX = left + width / 2;
  const centerY = top + height / 2;

  return {
    left,
    right,
    top,
    bottom,
    centerX,
    centerY,
    width,
    height,
  };
};

/**
 * Align shapes to the left
 */
export const alignLeft = (shapes: Shape[]): Partial<Shape>[] => {
  if (shapes.length < 2) return [];

  const bounds = shapes.map(getShapeBounds);
  const leftMost = Math.min(...bounds.map(b => b.left));

  return shapes.map(shape => ({
    id: shape.id,
    x: leftMost,
  }));
};

/**
 * Align shapes to the right
 */
export const alignRight = (shapes: Shape[]): Partial<Shape>[] => {
  if (shapes.length < 2) return [];

  const bounds = shapes.map(getShapeBounds);
  const rightMost = Math.max(...bounds.map(b => b.right));

  return shapes.map(shape => ({
    id: shape.id,
    x: rightMost - shape.width,
  }));
};

/**
 * Align shapes to horizontal center
 */
export const alignCenterHorizontal = (shapes: Shape[]): Partial<Shape>[] => {
  if (shapes.length < 2) return [];

  const collectiveBounds = getCollectiveBounds(shapes);

  return shapes.map(shape => ({
    id: shape.id,
    x: collectiveBounds.centerX - shape.width / 2,
  }));
};

/**
 * Align shapes to the top
 */
export const alignTop = (shapes: Shape[]): Partial<Shape>[] => {
  if (shapes.length < 2) return [];

  const bounds = shapes.map(getShapeBounds);
  const topMost = Math.min(...bounds.map(b => b.top));

  return shapes.map(shape => ({
    id: shape.id,
    y: topMost,
  }));
};

/**
 * Align shapes to the bottom
 */
export const alignBottom = (shapes: Shape[]): Partial<Shape>[] => {
  if (shapes.length < 2) return [];

  const bounds = shapes.map(getShapeBounds);
  const bottomMost = Math.max(...bounds.map(b => b.bottom));

  return shapes.map(shape => ({
    id: shape.id,
    y: bottomMost - shape.height,
  }));
};

/**
 * Align shapes to vertical center
 */
export const alignCenterVertical = (shapes: Shape[]): Partial<Shape>[] => {
  if (shapes.length < 2) return [];

  const collectiveBounds = getCollectiveBounds(shapes);

  return shapes.map(shape => ({
    id: shape.id,
    y: collectiveBounds.centerY - shape.height / 2,
  }));
};

/**
 * Distribute shapes evenly horizontally
 */
export const distributeHorizontally = (shapes: Shape[]): Partial<Shape>[] => {
  if (shapes.length < 3) return [];

  // Sort shapes by their left position
  const sortedShapes = [...shapes].sort((a, b) => a.x - b.x);
  const bounds = sortedShapes.map(getShapeBounds);
  
  const leftMost = bounds[0].left;
  const rightMost = bounds[bounds.length - 1].right;
  const totalWidth = rightMost - leftMost;
  
  // Calculate total width of all shapes
  const shapesWidth = bounds.reduce((sum, bound) => sum + bound.width, 0);
  const availableSpace = totalWidth - shapesWidth;
  const spacing = availableSpace / (shapes.length - 1);

  let currentX = leftMost;
  
  return sortedShapes.map((shape) => {
    const result = {
      id: shape.id,
      x: currentX,
    };
    currentX += shape.width + spacing;
    return result;
  });
};

/**
 * Distribute shapes evenly vertically
 */
export const distributeVertically = (shapes: Shape[]): Partial<Shape>[] => {
  if (shapes.length < 3) return [];

  // Sort shapes by their top position
  const sortedShapes = [...shapes].sort((a, b) => a.y - b.y);
  const bounds = sortedShapes.map(getShapeBounds);
  
  const topMost = bounds[0].top;
  const bottomMost = bounds[bounds.length - 1].bottom;
  const totalHeight = bottomMost - topMost;
  
  // Calculate total height of all shapes
  const shapesHeight = bounds.reduce((sum, bound) => sum + bound.height, 0);
  const availableSpace = totalHeight - shapesHeight;
  const spacing = availableSpace / (shapes.length - 1);

  let currentY = topMost;
  
  return sortedShapes.map((shape) => {
    const result = {
      id: shape.id,
      y: currentY,
    };
    currentY += shape.height + spacing;
    return result;
  });
};

/**
 * Space shapes evenly horizontally (equal gaps)
 */
export const spaceEvenlyHorizontally = (shapes: Shape[]): Partial<Shape>[] => {
  if (shapes.length < 3) return [];

  const sortedShapes = [...shapes].sort((a, b) => a.x - b.x);
  const bounds = sortedShapes.map(getShapeBounds);
  
  const leftMost = bounds[0].left;
  const rightMost = bounds[bounds.length - 1].right;
  const totalWidth = rightMost - leftMost;
  
  // Calculate total width of all shapes except first and last
  const middleShapesWidth = bounds.slice(1, -1).reduce((sum, bound) => sum + bound.width, 0);
  const availableSpace = totalWidth - bounds[0].width - bounds[bounds.length - 1].width - middleShapesWidth;
  const spacing = availableSpace / (shapes.length - 1);

  let currentX = leftMost + bounds[0].width + spacing;
  
  return sortedShapes.map((shape, index) => {
    if (index === 0 || index === sortedShapes.length - 1) {
      // Keep first and last shapes in place
      return { id: shape.id };
    }
    
    const result = {
      id: shape.id,
      x: currentX,
    };
    currentX += shape.width + spacing;
    return result;
  });
};

/**
 * Space shapes evenly vertically (equal gaps)
 */
export const spaceEvenlyVertically = (shapes: Shape[]): Partial<Shape>[] => {
  if (shapes.length < 3) return [];

  const sortedShapes = [...shapes].sort((a, b) => a.y - b.y);
  const bounds = sortedShapes.map(getShapeBounds);
  
  const topMost = bounds[0].top;
  const bottomMost = bounds[bounds.length - 1].bottom;
  const totalHeight = bottomMost - topMost;
  
  // Calculate total height of all shapes except first and last
  const middleShapesHeight = bounds.slice(1, -1).reduce((sum, bound) => sum + bound.height, 0);
  const availableSpace = totalHeight - bounds[0].height - bounds[bounds.length - 1].height - middleShapesHeight;
  const spacing = availableSpace / (shapes.length - 1);

  let currentY = topMost + bounds[0].height + spacing;
  
  return sortedShapes.map((shape, index) => {
    if (index === 0 || index === sortedShapes.length - 1) {
      // Keep first and last shapes in place
      return { id: shape.id };
    }
    
    const result = {
      id: shape.id,
      y: currentY,
    };
    currentY += shape.height + spacing;
    return result;
  });
};
