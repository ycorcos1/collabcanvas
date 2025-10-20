/**
 * Shape Type Definitions for Collaborative Canvas
 *
 * Defines the core data structures for shapes in the collaborative canvas.
 * These types ensure type safety across Firebase operations, UI components,
 * and real-time synchronization features.
 */

/**
 * Core shape interface - represents a drawable object on the canvas
 * Includes collaborative selection tracking for real-time editing
 */
export interface Shape {
  id: string; // Unique identifier (Firebase document ID)
  pageId: string; // Page identifier the shape belongs to
  type:
    | "rectangle" // Rectangle shape
    | "circle" // Circle/Ellipse shape
    | "text" // Text box
    | "drawing" // Freehand drawing
    | "rect" // Alternative name for rectangle (Konva compatibility)
    | "ellipse" // Alternative name for circle (Konva compatibility)
    | "triangle" // Triangle shape
    | "line" // Line shape
    | "arrow" // Arrow shape
    | "image"; // Image shape
  x: number; // X coordinate (top-left for rectangles, center for circles)
  y: number; // Y coordinate (top-left for rectangles, center for circles)
  width: number; // Width in pixels
  height: number; // Height in pixels
  color: string; // Fill color (hex format)
  zIndex: number; // Layer order (higher values appear on top)
  visible?: boolean; // Visibility toggle (default: true)
  name?: string; // Custom layer name (optional)
  createdBy: string; // User ID who created the shape
  createdAt: number; // Creation timestamp (Unix time)
  updatedAt: number; // Last modification timestamp

  // Text-specific properties
  text?: string; // Text content (for text shapes)
  fontSize?: number; // Font size (for text shapes)
  fontFamily?: string; // Font family (for text shapes)
  bold?: boolean; // Bold style (for text shapes)
  italic?: boolean; // Italic style (for text shapes)
  underline?: boolean; // Underline decoration (for text shapes)

  // Drawing-specific properties
  points?: number[]; // Drawing path points (for drawing shapes)
  strokeWidth?: number; // Stroke width (for drawing shapes)

  // Image-specific properties
  src?: string; // Public URL for the image
  naturalWidth?: number; // Image natural width for initial placement
  naturalHeight?: number; // Image natural height for initial placement

  // Rotation
  rotation?: number; // Rotation angle in degrees (for all shapes)

  // Collaborative selection state - tracks which user has selected this shape
  selectedBy?: string; // User ID of current selector (for shape locking)
  selectedByName?: string; // Display name for UI indicators
  selectedByColor?: string; // User color for visual consistency
  selectedAt?: number; // Selection timestamp for cleanup
}

/**
 * Shape update interface - for partial shape modifications
 * Used when updating existing shapes (position, size, color changes)
 */
export interface ShapeUpdate {
  id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
  zIndex?: number;
  visible?: boolean; // New visibility state
  name?: string; // New custom layer name
  text?: string; // New text content (for text shapes)
  fontSize?: number; // New font size (for text shapes)
  fontFamily?: string; // New font family (for text shapes)
  points?: number[]; // New drawing points (for drawing shapes)
  strokeWidth?: number; // New stroke width (for drawing shapes)
  rotation?: number; // New rotation angle (for all shapes)
  updatedAt: number;
}

/**
 * Shape creation data - used when creating new shapes
 * Omits auto-generated fields (id, timestamps) that Firebase handles
 */

export type CreateShapeData = Omit<
  Shape,
  "id" | "createdAt" | "updatedAt" | "pageId"
>;
