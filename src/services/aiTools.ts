/**
 * AI Tools for Canvas Manipulation
 *
 * Function calling tools that the AI agent can use to manipulate the canvas
 */

import { Tool, AICommandContext, AIToolResult } from "../types/ai";
import { Shape } from "../types/shape";
import { memoryBank } from "./memoryBank";
import { pushCheckpoint } from "./aiCheckpoints";
import { colorNameToHex } from "../utils/colorHelpers";

/**
 * Check if a shape is locked by another user
 */
const isShapeLockedByOther = (
  shape: Shape,
  currentUserId: string
): { locked: boolean; userName?: string; userId?: string } => {
  if (
    shape.selectedBy &&
    shape.selectedBy !== currentUserId &&
    shape.selectedByName
  ) {
    return {
      locked: true,
      userName: shape.selectedByName,
      userId: shape.selectedBy,
    };
  }
  return { locked: false };
};

/**
 * Tool: Create Shape
 * Creates a new shape on the canvas
 */
export const createShapeTool: Tool = {
  name: "create_shape",
  description:
    "Create a new shape on the canvas. Supports rectangles, circles, triangles, and text.",
  parameters: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: [
          "rectangle",
          "rect",
          "square",
          "circle",
          "ellipse",
          "oval",
          "triangle",
          "text",
        ],
        description:
          "Shape type. 'square' is treated as rectangle with equal sides. 'ellipse'/'oval' are treated as circle.",
      },
      x: {
        type: "number",
        description: "X position of the shape (in pixels from left)",
      },
      y: {
        type: "number",
        description: "Y position of the shape (in pixels from top)",
      },
      width: {
        type: "number",
        description: "Width of the shape (for rectangle and triangle)",
      },
      height: {
        type: "number",
        description: "Height of the shape (for rectangle and triangle)",
      },
      radius: {
        type: "number",
        description: "Radius of the shape (for circle only)",
      },
      fill: {
        type: "string",
        description: "Fill color (e.g., 'red', '#FF0000', 'rgb(255,0,0)')",
      },
      stroke: {
        type: "string",
        description: "Stroke/border color",
      },
      strokeWidth: {
        type: "number",
        description: "Stroke/border width in pixels",
      },
      text: {
        type: "string",
        description: "Text content (for text type)",
      },
      fontSize: {
        type: "number",
        description: "Font size (for text type)",
      },
      fontFamily: {
        type: "string",
        description: "Font family (for text type)",
      },
    },
    required: ["type", "x", "y"],
  },
  execute: async (
    args: Record<string, any>,
    context: AICommandContext
  ): Promise<AIToolResult> => {
    try {
      const {
        type,
        x,
        y,
        width,
        height,
        radius,
        fill,
        stroke: _stroke,
        strokeWidth: _strokeWidth,
      } = args;

      // Validate required fields
      if (!type || typeof x !== "number" || typeof y !== "number") {
        return {
          success: false,
          message: "Missing required parameters",
          error: "type, x, and y are required",
        };
      }

      // Build shape data (map to our canvas shape model)
      // Normalize synonyms for our renderer
      const typeStr = String(type).toLowerCase();
      const isCircleLike = ["circle", "ellipse", "oval"].includes(typeStr);
      const isRectLike = ["rectangle", "rect", "square"].includes(typeStr);
      const normalizedType = isRectLike
        ? "rect"
        : isCircleLike
        ? "ellipse"
        : type;
      // Convert color names to hex (e.g., "red" -> "#FF0000")
      const resolvedColor = colorNameToHex(fill || "#FF0000");

      const shapeData: Partial<Shape> = {
        type: normalizedType as any,
        x: typeof x === "number" ? x : 0,
        y: typeof y === "number" ? y : 0,
        color: resolvedColor,
      } as Partial<Shape>;

      // Handle text separately
      if (String(type).toLowerCase() === "text") {
        shapeData.text = args.text || "Text";
        shapeData.fontSize =
          typeof args.fontSize === "number" ? args.fontSize : 18;
        shapeData.fontFamily = args.fontFamily || "Arial";
        shapeData.width =
          typeof width === "number" && !isNaN(width) ? width : 200;
        shapeData.height =
          typeof height === "number" && !isNaN(height)
            ? height
            : Math.max(24, (shapeData.fontSize as number) + 8);
      } else if (isCircleLike) {
        const diameter =
          typeof radius === "number" && !isNaN(radius)
            ? Math.max(1, radius * 2)
            : 100; // default 100x100
        shapeData.width = diameter;
        shapeData.height = diameter;
      } else {
        const side =
          typeStr === "square"
            ? typeof width === "number" && !isNaN(width)
              ? width
              : typeof height === "number" && !isNaN(height)
              ? height
              : 100
            : undefined;
        shapeData.width =
          side !== undefined
            ? side
            : typeof width === "number" && !isNaN(width)
            ? width
            : 100;
        shapeData.height =
          side !== undefined
            ? side
            : typeof height === "number" && !isNaN(height)
            ? height
            : 100;
      }

      // Create the shape
      context.shapeActions.createShape(shapeData);
      // Hint for no-selection fallbacks
      try {
        const lastId =
          (shapeData as any).id ||
          context.shapes[context.shapes.length - 1]?.id;
        if (lastId) sessionStorage.setItem("ai:lastCreatedId", String(lastId));
      } catch {}

      return {
        success: true,
        message: `Created ${type} at (${x}, ${y})`,
        data: shapeData,
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to create shape",
        error: error.message || "Unknown error",
      };
    }
  },
};

/**
 * Tool: Delete Shape
 * Deletes a shape by ID or deletes all selected shapes
 */
export const deleteShapeTool: Tool = {
  name: "delete_shape",
  description:
    "Delete a shape by ID, or delete all currently selected shapes if no ID is provided.",
  parameters: {
    type: "object",
    properties: {
      shapeId: {
        type: "string",
        description: "The ID of the shape to delete (optional)",
      },
      deleteSelected: {
        type: "boolean",
        description:
          "If true, delete all selected shapes instead of a specific ID",
      },
    },
  },
  execute: async (
    args: Record<string, any>,
    context: AICommandContext
  ): Promise<AIToolResult> => {
    try {
      const { shapeId, deleteSelected } = args;

      if (deleteSelected || (!shapeId && context.selectedShapeIds.length > 0)) {
        // Delete all selected shapes
        const count = context.selectedShapeIds.length;
        if (count === 0) {
          return {
            success: false,
            message: "No shapes selected to delete",
          };
        }

        // Check for locked shapes
        const selectedShapes = context.shapes.filter((s) =>
          context.selectedShapeIds.includes(s.id)
        );
        const lockedShapes = selectedShapes
          .map((s) => ({
            shape: s,
            lock: isShapeLockedByOther(s, context.user.id),
          }))
          .filter((item) => item.lock.locked);

        if (lockedShapes.length > 0) {
          const lockedBy = lockedShapes
            .map((item) => item.lock.userName)
            .join(", ");
          return {
            success: false,
            message: `Cannot delete ${lockedShapes.length} shape${
              lockedShapes.length > 1 ? "s" : ""
            } - locked by ${lockedBy}`,
          };
        }

        context.shapeActions.deleteSelectedShapes();

        return {
          success: true,
          message: `Deleted ${count} selected shape${count > 1 ? "s" : ""}`,
          data: { count },
        };
      }

      if (shapeId) {
        // Delete specific shape by ID
        const shape = context.shapes.find((s) => s.id === shapeId);
        if (!shape) {
          return {
            success: false,
            message: `Shape with ID '${shapeId}' not found`,
          };
        }

        // Check if locked
        const lock = isShapeLockedByOther(shape, context.user.id);
        if (lock.locked) {
          return {
            success: false,
            message: `Cannot delete ${shape.type} - locked by ${lock.userName}`,
          };
        }

        context.shapeActions.deleteShape(shapeId);

        return {
          success: true,
          message: `Deleted ${shape.type} shape`,
          data: { shapeId },
        };
      }

      return {
        success: false,
        message: "No shape ID provided and no shapes selected",
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to delete shape",
        error: error.message || "Unknown error",
      };
    }
  },
};

/**
 * Tool: Update Shape
 * Updates properties of an existing shape
 */
export const updateShapeTool: Tool = {
  name: "update_shape",
  description:
    "Update properties of an existing shape (position, size, color, etc.)",
  parameters: {
    type: "object",
    properties: {
      shapeId: {
        type: "string",
        description:
          "The ID of the shape to update (optional if updating selected)",
      },
      updateSelected: {
        type: "boolean",
        description:
          "If true, update all selected shapes instead of a specific ID",
      },
      x: {
        type: "number",
        description: "New X position",
      },
      y: {
        type: "number",
        description: "New Y position",
      },
      width: {
        type: "number",
        description: "New width",
      },
      height: {
        type: "number",
        description: "New height",
      },
      radius: {
        type: "number",
        description: "New radius (for circles)",
      },
      fill: {
        type: "string",
        description: "New fill color",
      },
      stroke: {
        type: "string",
        description: "New stroke color",
      },
      strokeWidth: {
        type: "number",
        description: "New stroke width",
      },
      rotation: {
        type: "number",
        description: "New rotation angle in degrees",
      },
    },
  },
  execute: async (
    args: Record<string, any>,
    context: AICommandContext
  ): Promise<AIToolResult> => {
    try {
      const { shapeId, updateSelected, ...updates } = args;

      // Remove undefined values and convert color names to hex
      const cleanUpdates: Partial<Shape> = {};
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          // Convert color names to hex for fill/color properties
          if (
            (key === "fill" || key === "color") &&
            typeof value === "string"
          ) {
            // Normalize to our canonical 'color' field
            const hex = colorNameToHex(value);
            (cleanUpdates as any).color = hex;
          } else {
            cleanUpdates[key as keyof Shape] = value as any;
          }
        }
      });

      if (Object.keys(cleanUpdates).length === 0) {
        return {
          success: false,
          message: "No properties provided to update",
        };
      }

      // If no specific shape ID and updateSelected is true/undefined, try to update selected shapes
      if (
        !shapeId &&
        (updateSelected === true || updateSelected === undefined)
      ) {
        if (context.selectedShapeIds.length === 0) {
          return {
            success: false,
            message:
              "No shapes selected. Please select a shape first or specify which shape to update.",
          };
        }
      }

      if (updateSelected || (!shapeId && context.selectedShapeIds.length > 0)) {
        // Update all selected shapes
        const count = context.selectedShapeIds.length;
        if (count === 0) {
          return {
            success: false,
            message: "No shapes selected to update",
          };
        }

        // Check for locked shapes
        const selectedShapes = context.shapes.filter((s) =>
          context.selectedShapeIds.includes(s.id)
        );
        const lockedShapes = selectedShapes
          .map((s) => ({
            shape: s,
            lock: isShapeLockedByOther(s, context.user.id),
          }))
          .filter((item) => item.lock.locked);

        if (lockedShapes.length > 0) {
          const lockedBy = lockedShapes
            .map((item) => item.lock.userName)
            .join(", ");
          return {
            success: false,
            message: `Cannot update ${lockedShapes.length} shape${
              lockedShapes.length > 1 ? "s" : ""
            } - locked by ${lockedBy}`,
          };
        }

        context.selectedShapeIds.forEach((id) => {
          context.shapeActions.updateShape(id, cleanUpdates);
        });

        const updatesList = Object.keys(cleanUpdates).join(", ");
        return {
          success: true,
          message: `Updated ${count} shape${
            count > 1 ? "s" : ""
          } (${updatesList})`,
          data: { count, updates: cleanUpdates },
        };
      }

      if (shapeId) {
        // Update specific shape by ID
        const shape = context.shapes.find((s) => s.id === shapeId);
        if (!shape) {
          return {
            success: false,
            message: `Shape with ID '${shapeId}' not found`,
          };
        }

        // Check if locked
        const lock = isShapeLockedByOther(shape, context.user.id);
        if (lock.locked) {
          return {
            success: false,
            message: `Cannot update ${shape.type} - locked by ${lock.userName}`,
          };
        }

        context.shapeActions.updateShape(shapeId, cleanUpdates);

        const updatesList = Object.keys(cleanUpdates).join(", ");
        return {
          success: true,
          message: `Updated ${shape.type} shape (${updatesList})`,
          data: { shapeId, updates: cleanUpdates },
        };
      }

      return {
        success: false,
        message: "No shape ID provided and no shapes selected",
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to update shape",
        error: error.message || "Unknown error",
      };
    }
  },
};

/**
 * Tool: Select Shape
 * Selects shapes based on various criteria
 */
export const selectShapeTool: Tool = {
  name: "select_shape",
  description:
    "Select shapes on the canvas by ID, type, color, or position. Can select single or multiple shapes.",
  parameters: {
    type: "object",
    properties: {
      shapeId: {
        type: "string",
        description: "The ID of a specific shape to select",
      },
      type: {
        type: "string",
        enum: ["rectangle", "circle", "triangle", "all"],
        description: "Select all shapes of this type",
      },
      color: {
        type: "string",
        description: "Select all shapes with this fill color",
      },
      deselectAll: {
        type: "boolean",
        description: "If true, deselect all shapes",
      },
    },
  },
  execute: async (
    args: Record<string, any>,
    context: AICommandContext
  ): Promise<AIToolResult> => {
    try {
      const { shapeId, type, color, deselectAll } = args;

      if (deselectAll) {
        context.shapeActions.selectShape(null);
        return {
          success: true,
          message: "Deselected all shapes",
        };
      }

      if (shapeId) {
        // Select specific shape by ID
        const shape = context.shapes.find((s) => s.id === shapeId);
        if (!shape) {
          return {
            success: false,
            message: `Shape with ID '${shapeId}' not found`,
          };
        }

        context.shapeActions.selectShape(shapeId);

        return {
          success: true,
          message: `Selected ${shape.type} shape`,
          data: { shapeId },
        };
      }

      if (type) {
        // Select all shapes of a type
        const typeStr = String(type).toLowerCase();
        const typeMap: Record<string, string[]> = {
          rectangle: ["rect", "rectangle"],
          rect: ["rect", "rectangle"],
          square: ["rect", "rectangle"],
          circle: ["ellipse", "circle"],
          ellipse: ["ellipse", "circle"],
          oval: ["ellipse", "circle"],
          triangle: ["triangle"],
        };

        const matchingTypes = typeMap[typeStr] || [typeStr];
        const matchingShapes = context.shapes.filter((s) =>
          matchingTypes.includes(s.type)
        );

        if (matchingShapes.length === 0) {
          return {
            success: false,
            message: `No ${type} shapes found`,
          };
        }

        // Select first matching shape (limitation: can only select one at a time with current API)
        context.shapeActions.selectShape(matchingShapes[0].id);

        return {
          success: true,
          message: `Selected ${matchingShapes.length} ${type} shape${
            matchingShapes.length > 1 ? "s" : ""
          }`,
          data: {
            count: matchingShapes.length,
            ids: matchingShapes.map((s) => s.id),
          },
        };
      }

      if (color) {
        // Select all shapes with a color
        const matchingShapes = context.shapes.filter((s: any) => {
          const c = (s.color || s.fill || "").toString().toLowerCase();
          return c === color.toLowerCase();
        });

        if (matchingShapes.length === 0) {
          return {
            success: false,
            message: `No shapes found with color '${color}'`,
          };
        }

        // Select first matching shape
        context.shapeActions.selectShape(matchingShapes[0].id);

        return {
          success: true,
          message: `Selected ${matchingShapes.length} ${color} shape${
            matchingShapes.length > 1 ? "s" : ""
          }`,
          data: {
            count: matchingShapes.length,
            ids: matchingShapes.map((s) => s.id),
          },
        };
      }

      return {
        success: false,
        message: "No selection criteria provided",
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to select shape",
        error: error.message || "Unknown error",
      };
    }
  },
};

/**
 * Tool: Select Many Shapes
 * Selects multiple shapes by IDs (requires selectShapes support)
 */
export const selectManyShapesTool: Tool = {
  name: "select_many_shapes",
  description: "Select multiple shapes by IDs in one operation.",
  parameters: {
    type: "object",
    properties: {
      shapeIds: { type: "array", items: { type: "string" } },
    },
    required: ["shapeIds"],
  },
  execute: async (args: Record<string, any>, context: AICommandContext) => {
    try {
      const { shapeIds } = args as { shapeIds: string[] };
      if (!Array.isArray(shapeIds) || shapeIds.length === 0) {
        return { success: false, message: "No shapeIds provided" };
      }

      if (typeof (context.shapeActions as any)?.selectShapes === "function") {
        await (context.shapeActions as any).selectShapes(shapeIds);
        return {
          success: true,
          message: `Selected ${shapeIds.length} shapes`,
          data: { count: shapeIds.length },
        };
      }

      // Fallback not supported since single-select API clears previous
      return {
        success: false,
        message:
          "Multi-select is not available. Please select shapes manually or update shapeActions.selectShapes.",
      };
    } catch (e: any) {
      return {
        success: false,
        message: "Failed to select many shapes",
        error: e?.message || "Unknown error",
      };
    }
  },
};

/**
 * Tool: Duplicate Shape
 * Duplicates a shape or selected shapes with an offset
 */
export const duplicateShapeTool: Tool = {
  name: "duplicate_shape",
  description:
    "Duplicate a shape or all selected shapes. Optionally specify offset.",
  parameters: {
    type: "object",
    properties: {
      shapeId: {
        type: "string",
        description:
          "ID of specific shape to duplicate (optional if shapes are selected)",
      },
      offsetX: {
        type: "number",
        description: "Horizontal offset for duplicated shape (default: 50)",
      },
      offsetY: {
        type: "number",
        description: "Vertical offset for duplicated shape (default: 50)",
      },
    },
  },
  execute: async (
    args: Record<string, any>,
    context: AICommandContext
  ): Promise<AIToolResult> => {
    try {
      const { shapeId, offsetX = 50, offsetY = 50 } = args;

      let shapesToDuplicate: Shape[] = [];

      if (shapeId) {
        const shape = context.shapes.find((s) => s.id === shapeId);
        if (!shape) {
          return {
            success: false,
            message: `Shape with ID '${shapeId}' not found`,
          };
        }
        shapesToDuplicate = [shape];
      } else if (context.selectedShapeIds.length > 0) {
        shapesToDuplicate = context.shapes.filter((s) =>
          context.selectedShapeIds.includes(s.id)
        );
      } else {
        return {
          success: false,
          message: "No shape selected to duplicate",
        };
      }

      const duplicatedIds: string[] = [];
      for (const shape of shapesToDuplicate) {
        const duplicate: any = {
          ...shape,
          id: undefined,
          x: shape.x + offsetX,
          y: shape.y + offsetY,
          createdBy: context.user.id,
        };
        delete duplicate.id;
        delete duplicate.createdAt;
        delete duplicate.updatedAt;
        delete duplicate.selectedBy;
        delete duplicate.selectedByName;
        delete duplicate.selectedByColor;
        delete duplicate.selectedAt;

        context.shapeActions.createShape(duplicate);
        duplicatedIds.push(shape.id);
      }

      return {
        success: true,
        message: `Duplicated ${shapesToDuplicate.length} shape${
          shapesToDuplicate.length > 1 ? "s" : ""
        }`,
        data: { count: shapesToDuplicate.length },
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to duplicate shape",
        error: error.message || "Unknown error",
      };
    }
  },
};

/**
 * Tool: Rotate Shape
 * Rotates selected shapes by a given angle
 */
export const rotateShapeTool: Tool = {
  name: "rotate_shape",
  description: "Rotate the selected shape(s) by a specified angle in degrees.",
  parameters: {
    type: "object",
    properties: {
      degrees: {
        type: "number",
        description: "Rotation angle in degrees (positive = clockwise)",
      },
      shapeId: {
        type: "string",
        description:
          "ID of specific shape to rotate (optional if shapes are selected)",
      },
    },
    required: ["degrees"],
  },
  execute: async (
    args: Record<string, any>,
    context: AICommandContext
  ): Promise<AIToolResult> => {
    try {
      const { degrees, shapeId } = args;

      let shapesToRotate: Shape[] = [];

      if (shapeId) {
        const shape = context.shapes.find((s) => s.id === shapeId);
        if (!shape) {
          return {
            success: false,
            message: `Shape with ID '${shapeId}' not found`,
          };
        }
        shapesToRotate = [shape];
      } else if (context.selectedShapeIds.length > 0) {
        shapesToRotate = context.shapes.filter((s) =>
          context.selectedShapeIds.includes(s.id)
        );
      } else {
        return {
          success: false,
          message: "No shape selected to rotate",
        };
      }

      for (const shape of shapesToRotate) {
        const currentRotation = (shape as any).rotation || 0;
        context.shapeActions.updateShape(shape.id, {
          rotation: currentRotation + degrees,
        });
      }

      return {
        success: true,
        message: `Rotated ${shapesToRotate.length} shape${
          shapesToRotate.length > 1 ? "s" : ""
        } by ${degrees}°`,
        data: { count: shapesToRotate.length, degrees },
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to rotate shape",
        error: error.message || "Unknown error",
      };
    }
  },
};

/**
 * Tool: Align Shapes
 * Aligns multiple shapes relative to each other
 */
export const alignShapesTool: Tool = {
  name: "align_shapes",
  description:
    "Align selected shapes. Options: left, center, right, top, middle, bottom.",
  parameters: {
    type: "object",
    properties: {
      alignment: {
        type: "string",
        enum: ["left", "center", "right", "top", "middle", "bottom"],
        description: "Alignment direction",
      },
    },
    required: ["alignment"],
  },
  execute: async (
    args: Record<string, any>,
    context: AICommandContext
  ): Promise<AIToolResult> => {
    try {
      const { alignment } = args;

      if (context.selectedShapeIds.length < 2) {
        return {
          success: false,
          message: "Need at least 2 selected shapes to align",
        };
      }

      const selectedShapes = context.shapes.filter((s) =>
        context.selectedShapeIds.includes(s.id)
      );

      let referenceValue = 0;

      switch (alignment) {
        case "left":
          referenceValue = Math.min(...selectedShapes.map((s) => s.x));
          selectedShapes.forEach((s) => {
            context.shapeActions.updateShape(s.id, { x: referenceValue });
          });
          break;
        case "right":
          referenceValue = Math.max(
            ...selectedShapes.map((s) => s.x + s.width)
          );
          selectedShapes.forEach((s) => {
            context.shapeActions.updateShape(s.id, {
              x: referenceValue - s.width,
            });
          });
          break;
        case "center":
          const minX = Math.min(...selectedShapes.map((s) => s.x));
          const maxX = Math.max(...selectedShapes.map((s) => s.x + s.width));
          referenceValue = (minX + maxX) / 2;
          selectedShapes.forEach((s) => {
            context.shapeActions.updateShape(s.id, {
              x: referenceValue - s.width / 2,
            });
          });
          break;
        case "top":
          referenceValue = Math.min(...selectedShapes.map((s) => s.y));
          selectedShapes.forEach((s) => {
            context.shapeActions.updateShape(s.id, { y: referenceValue });
          });
          break;
        case "bottom":
          referenceValue = Math.max(
            ...selectedShapes.map((s) => s.y + s.height)
          );
          selectedShapes.forEach((s) => {
            context.shapeActions.updateShape(s.id, {
              y: referenceValue - s.height,
            });
          });
          break;
        case "middle":
          const minY = Math.min(...selectedShapes.map((s) => s.y));
          const maxY = Math.max(...selectedShapes.map((s) => s.y + s.height));
          referenceValue = (minY + maxY) / 2;
          selectedShapes.forEach((s) => {
            context.shapeActions.updateShape(s.id, {
              y: referenceValue - s.height / 2,
            });
          });
          break;
      }

      return {
        success: true,
        message: `Aligned ${selectedShapes.length} shapes to ${alignment}`,
        data: { count: selectedShapes.length, alignment },
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to align shapes",
        error: error.message || "Unknown error",
      };
    }
  },
};

/**
 * Tool: Distribute Shapes
 * Distributes selected shapes evenly
 */
export const distributeShapesTool: Tool = {
  name: "distribute_shapes",
  description:
    "Distribute selected shapes evenly in horizontal or vertical direction.",
  parameters: {
    type: "object",
    properties: {
      direction: {
        type: "string",
        enum: ["horizontal", "vertical"],
        description: "Distribution direction",
      },
    },
    required: ["direction"],
  },
  execute: async (
    args: Record<string, any>,
    context: AICommandContext
  ): Promise<AIToolResult> => {
    try {
      const { direction } = args;

      if (context.selectedShapeIds.length < 3) {
        return {
          success: false,
          message: "Need at least 3 selected shapes to distribute",
        };
      }

      const selectedShapes = context.shapes.filter((s) =>
        context.selectedShapeIds.includes(s.id)
      );

      if (direction === "horizontal") {
        // Sort by x position
        const sorted = [...selectedShapes].sort((a, b) => a.x - b.x);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const totalWidth = last.x + last.width - first.x;
        const totalShapesWidth = sorted.reduce((sum, s) => sum + s.width, 0);
        const spacing = (totalWidth - totalShapesWidth) / (sorted.length - 1);

        let currentX = first.x + first.width + spacing;
        for (let i = 1; i < sorted.length - 1; i++) {
          context.shapeActions.updateShape(sorted[i].id, { x: currentX });
          currentX += sorted[i].width + spacing;
        }
      } else {
        // Sort by y position
        const sorted = [...selectedShapes].sort((a, b) => a.y - b.y);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const totalHeight = last.y + last.height - first.y;
        const totalShapesHeight = sorted.reduce((sum, s) => sum + s.height, 0);
        const spacing = (totalHeight - totalShapesHeight) / (sorted.length - 1);

        let currentY = first.y + first.height + spacing;
        for (let i = 1; i < sorted.length - 1; i++) {
          context.shapeActions.updateShape(sorted[i].id, { y: currentY });
          currentY += sorted[i].height + spacing;
        }
      }

      return {
        success: true,
        message: `Distributed ${selectedShapes.length} shapes ${direction}ly`,
        data: { count: selectedShapes.length, direction },
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to distribute shapes",
        error: error.message || "Unknown error",
      };
    }
  },
};

/**
 * Tool: Create From Template
 * Creates shapes from predefined templates
 */
export const createFromTemplateTool: Tool = {
  name: "create_from_template",
  description:
    "Create shapes from a predefined template. Available templates: card, button, login_form, navbar_4, card_layout, smiley_face.",
  parameters: {
    type: "object",
    properties: {
      templateName: {
        type: "string",
        enum: [
          "card",
          "button",
          "login_form",
          "navbar_4",
          "card_layout",
          "smiley_face",
        ],
        description: "Name of the template to use",
      },
      x: {
        type: "number",
        description: "X position for the template (optional, defaults to 400)",
      },
      y: {
        type: "number",
        description: "Y position for the template (optional, defaults to 600)",
      },
    },
    required: ["templateName"],
  },
  execute: async (
    args: Record<string, any>,
    context: AICommandContext
  ): Promise<AIToolResult> => {
    try {
      const { templateName, x = 400, y = 600 } = args;

      const template = memoryBank.getTemplate(templateName);
      if (!template) {
        return {
          success: false,
          message: `Template '${templateName}' not found. Available templates: ${memoryBank
            .getTemplateNames()
            .join(", ")}`,
        };
      }

      // Create all shapes from the template
      const groupId = `tpl-${Date.now()}`;
      const createdShapes: string[] = [];
      for (const templateShape of template.shapes) {
        const shapeData = {
          type: templateShape.type as any,
          x: x + (templateShape.x || 0),
          y: y + (templateShape.y || 0),
          width: templateShape.width || 100,
          height: templateShape.height || 100,
          color: colorNameToHex(templateShape.color || "#FF0000"),
          groupId,
        } as Partial<Shape>;

        // Add type-specific properties
        if (templateShape.text) {
          shapeData.text = templateShape.text;
          shapeData.fontSize = templateShape.fontSize || 14;
          shapeData.fontFamily = templateShape.fontFamily || "Arial";
        }

        if (templateShape.radius) {
          shapeData.width = templateShape.radius * 2;
          shapeData.height = templateShape.radius * 2;
        }

        context.shapeActions.createShape(shapeData);
        createdShapes.push(templateShape.type);
      }

      return {
        success: true,
        message: `Created ${template.name} template with ${createdShapes.length} shape(s)`,
        data: { template: template.name, shapesCreated: createdShapes.length },
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to create template",
        error: error.message || "Unknown error",
      };
    }
  },
};

/**
 * Get all basic tools
 */
export const getBasicTools = (): Tool[] => {
  return [
    selectManyShapesTool,
    createShapeTool,
    deleteShapeTool,
    updateShapeTool,
    selectShapeTool,
    duplicateShapeTool,
    // new bulk tools
    updateManyShapesTool,
    deleteManyShapesTool,
    duplicateManyShapesTool,
    rotateManyShapesTool,
    rotateShapeTool,
    alignShapesTool,
    distributeShapesTool,
    createFromTemplateTool,
    clearCanvasTool,
  ];
};

/**
 * Tool: Update Many Shapes
 * Applies the same updates to multiple shapes without requiring selection.
 */
export const updateManyShapesTool: Tool = {
  name: "update_many_shapes",
  description:
    "Update multiple shapes by IDs. Skips shapes locked by other users.",
  parameters: {
    type: "object",
    properties: {
      shapeIds: { type: "array", items: { type: "string" } },
      updates: { type: "object" },
    },
    required: ["shapeIds", "updates"],
  },
  execute: async (args: Record<string, any>, context: AICommandContext) => {
    try {
      const { shapeIds, updates } = args as {
        shapeIds: string[];
        updates: Partial<Shape>;
      };
      if (!Array.isArray(shapeIds) || shapeIds.length === 0) {
        return { success: false, message: "No shapeIds provided" };
      }

      // Normalize color names
      const normalized: Partial<Shape> = { ...updates };
      if (typeof (normalized as any).fill === "string") {
        (normalized as any).fill = colorNameToHex((normalized as any).fill);
      }
      if (typeof (normalized as any).color === "string") {
        (normalized as any).color = colorNameToHex(
          (normalized as any).color as string
        );
      }

      const beforeItems: Array<{ id: string; before: Partial<Shape> }> = [];
      let updated = 0;
      const skipped: string[] = [];
      const shapes = context.shapes.filter((s) => shapeIds.includes(s.id));
      for (const s of shapes) {
        const lock = isShapeLockedByOther(s, context.user.id);
        if (lock.locked) {
          skipped.push(s.id);
          continue;
        }
        const before: Partial<Shape> = {};
        Object.keys(updates).forEach(
          (k) => ((before as any)[k] = (s as any)[k])
        );
        beforeItems.push({ id: s.id, before });
        context.shapeActions.updateShape(s.id, normalized);
        updated += 1;
      }
      if (beforeItems.length) {
        pushCheckpoint({
          id: String(Date.now()),
          action: "update_many_shapes",
          items: beforeItems,
        });
      }

      return {
        success: true,
        message: `Updated ${updated} shape${updated === 1 ? "" : "s"}`,
        data: { updated, skipped },
      };
    } catch (e: any) {
      return {
        success: false,
        message: "Failed to update many shapes",
        error: e?.message || "Unknown error",
      };
    }
  },
};

export const deleteManyShapesTool: Tool = {
  name: "delete_many_shapes",
  description:
    "Delete multiple shapes by IDs. Skips shapes locked by other users.",
  parameters: {
    type: "object",
    properties: { shapeIds: { type: "array", items: { type: "string" } } },
    required: ["shapeIds"],
  },
  execute: async (args: Record<string, any>, context: AICommandContext) => {
    try {
      const { shapeIds } = args as { shapeIds: string[] };
      if (!Array.isArray(shapeIds) || shapeIds.length === 0) {
        return { success: false, message: "No shapeIds provided" };
      }
      const beforeItemsDel: Array<{ id: string; before: Partial<Shape> }> = [];
      let deleted = 0;
      const skipped: string[] = [];
      const shapes = context.shapes.filter((s) => shapeIds.includes(s.id));
      for (const s of shapes) {
        const lock = isShapeLockedByOther(s, context.user.id);
        if (lock.locked) {
          skipped.push(s.id);
          continue;
        }
        beforeItemsDel.push({ id: s.id, before: { ...s } });
        context.shapeActions.deleteShape(s.id);
        deleted += 1;
      }
      if (beforeItemsDel.length) {
        pushCheckpoint({
          id: String(Date.now()),
          action: "delete_many_shapes",
          items: beforeItemsDel,
        });
      }
      return {
        success: true,
        message: `Deleted ${deleted} shape${deleted === 1 ? "" : "s"}`,
        data: { deleted, skipped },
      };
    } catch (e: any) {
      return {
        success: false,
        message: "Failed to delete many shapes",
        error: e?.message || "Unknown error",
      };
    }
  },
};

export const duplicateManyShapesTool: Tool = {
  name: "duplicate_many_shapes",
  description: "Duplicate multiple shapes with optional offsets.",
  parameters: {
    type: "object",
    properties: {
      shapeIds: { type: "array", items: { type: "string" } },
      offsetX: { type: "number" },
      offsetY: { type: "number" },
    },
    required: ["shapeIds"],
  },
  execute: async (args: Record<string, any>, context: AICommandContext) => {
    try {
      const {
        shapeIds,
        offsetX = 50,
        offsetY = 50,
      } = args as {
        shapeIds: string[];
        offsetX?: number;
        offsetY?: number;
      };
      if (!Array.isArray(shapeIds) || shapeIds.length === 0) {
        return { success: false, message: "No shapeIds provided" };
      }
      let created = 0;
      const shapes = context.shapes.filter((s) => shapeIds.includes(s.id));
      for (const s of shapes) {
        const lock = isShapeLockedByOther(s, context.user.id);
        if (lock.locked) continue;
        const duplicate: Partial<Shape> = {
          ...s,
          id: undefined as any,
          x: (s.x || 0) + offsetX,
          y: (s.y || 0) + offsetY,
        } as any;
        delete (duplicate as any).id;
        context.shapeActions.createShape(duplicate);
        created += 1;
      }
      return {
        success: true,
        message: `Duplicated ${created} shape${created === 1 ? "" : "s"}`,
        data: { created },
      };
    } catch (e: any) {
      return {
        success: false,
        message: "Failed to duplicate many shapes",
        error: e?.message || "Unknown error",
      };
    }
  },
};

export const rotateManyShapesTool: Tool = {
  name: "rotate_many_shapes",
  description: "Rotate multiple shapes by degrees.",
  parameters: {
    type: "object",
    properties: {
      shapeIds: { type: "array", items: { type: "string" } },
      degrees: { type: "number" },
    },
    required: ["shapeIds", "degrees"],
  },
  execute: async (args: Record<string, any>, context: AICommandContext) => {
    try {
      const { shapeIds, degrees } = args as {
        shapeIds: string[];
        degrees: number;
      };
      const shapes = context.shapes.filter((s) => shapeIds.includes(s.id));
      for (const s of shapes) {
        const lock = isShapeLockedByOther(s, context.user.id);
        if (lock.locked) continue;
        const currentRotation = (s as any).rotation || 0;
        context.shapeActions.updateShape(s.id, {
          rotation: currentRotation + degrees,
        } as any);
      }
      return { success: true, message: `Rotated ${shapes.length} shapes` };
    } catch (e: any) {
      return {
        success: false,
        message: "Failed to rotate many shapes",
        error: e?.message || "Unknown error",
      };
    }
  },
};

/**
 * Tool: Clear Canvas
 * Clears all shapes from the current canvas quickly (local only).
 */
export const clearCanvasTool: Tool = {
  name: "clear_canvas",
  description: "Clear all shapes from the current canvas (local, fast).",
  parameters: { type: "object", properties: {} },
  execute: async (_args: Record<string, any>, context: AICommandContext) => {
    try {
      const ids = context.shapes.map((s) => s.id);
      for (const id of ids) {
        try {
          context.shapeActions.deleteShape(id);
        } catch {}
      }
      try {
        context.shapeActions.selectShape(null);
      } catch {}

      // Request an auto-save from the app (CanvasPage listens for this event)
      try {
        window.dispatchEvent(
          new CustomEvent("ai:autoSaveRequested", {
            detail: { reason: "clear_canvas" },
          })
        );
      } catch {}

      return {
        success: true,
        message: "Canvas cleared",
        data: { removed: ids.length },
      };
    } catch (e: any) {
      return {
        success: false,
        message: "Failed to clear canvas",
        error: e?.message || "Unknown error",
      };
    }
  },
};
