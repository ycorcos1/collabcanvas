/**
 * AI Agent Service
 *
 * Core logic for natural language canvas manipulation using OpenAI function calling
 */

import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { executeCompletionWithRetry } from "./openai";
import {
  AICommand,
  AIResponse,
  AIAction,
  Tool,
  AICommandContext,
  AIToolResult,
} from "../types/ai";
import { getBasicTools } from "./aiTools";
import type { Shape } from "../types/shape";
import { memorySync } from "./memorySync";

// Normalize color names to hex for matching
const normalizeColor = (c?: string) => {
  if (!c) return undefined;
  const map: Record<string, string> = {
    red: "#FF0000",
    blue: "#0000FF",
    green: "#00FF00",
    yellow: "#FFFF00",
    orange: "#FFA500",
    purple: "#800080",
    pink: "#FFC0CB",
    black: "#000000",
    white: "#FFFFFF",
    gray: "#808080",
    grey: "#808080",
    brown: "#A52A2A",
    cyan: "#00FFFF",
    magenta: "#FF00FF",
  };
  if (/^#[0-9a-f]{3,6}$/i.test(c)) return c.toUpperCase();
  return (map[c.toLowerCase()] || c).toUpperCase();
};

/**
 * System prompt for the AI agent
 */
const SYSTEM_PROMPT = `You are a helpful AI assistant that helps users manipulate shapes on a canvas through natural language commands.

CONTEXT AWARENESS:
- You can see the current canvas state including all shapes and selected shapes
- When the user says "this", "the", "it", "that", they're referring to SELECTED shapes
- If NO shapes are selected and they use contextual words, politely ask them to select a shape first
- If the command is ambiguous (e.g., "delete the circle" when there are multiple circles), ask for clarification: "Which circle? There are 3 circles on the canvas."
- Example: "resize the red circle twice as big" → if red circle is selected, resize it; otherwise, select it first

You have access to tools that can:
- Create shapes (rectangles, circles, triangles, text) with specified positions, sizes, colors, and content
- Create from templates (card, button) - predefined shape compositions
- Delete shapes by ID or selection
- Update shape properties (position, size, color, text, font, rotation)
- Select shapes by various criteria (type, color, position)
- Duplicate shapes with optional offset
- Rotate selected shapes by degrees
- Align multiple shapes (left, right, center, top, middle, bottom)
- Distribute multiple shapes evenly (horizontal or vertical)

Guidelines:
- Always confirm actions with clear, concise messages
- If a command is ambiguous, ask for clarification
- Use tool calls to execute actions on the canvas
- Be helpful and friendly
- If multiple shapes match a query, clarify which one
- Default colors: Use red if not specified
- Default positions: Use center of canvas (400, 600) if not specified
- **IMPORTANT**: Respect collaborative locks - if a shape is locked by another user, mention their name
- For alignment: Need at least 2 selected shapes
- For distribution: Need at least 3 selected shapes
- IMPORTANT: When user says "resize X twice as big", multiply current dimensions by 2
- IMPORTANT: When user refers to "this/the/it", they mean the SELECTED shape(s)

When responding:
- Be concise and action-oriented
- Confirm what you did, not what you're about to do
- Prefer calling a single best-fitting tool; chain minimal steps
- If the user says "create", "make", or "add", call create_shape
- If the user says "delete" or "remove", call delete_shape
- If the user says "select" or "highlight", call select_shape
- If the user says "change", "set", or modifies color/size/position, call update_shape
- If the user says "duplicate", "copy", or "clone", call duplicate_shape
- If the user says "rotate", "turn", or "spin", call rotate_shape
- If the user says "align", call align_shapes
- If the user says "distribute", "space", or "spread", call distribute_shapes
- Treat rectangle/rect/square as the same; circle/ellipse/oval as the same
- If something fails, explain why clearly

Examples:
- "create a red circle at 100, 200" → create_shape
- "create a card template" or "add a button" → create_from_template
- "duplicate this shape" → if shape selected, duplicate_shape; else ask to select
- "rotate 45 degrees" → if shape selected, rotate_shape; else ask to select
- "align them to the left" → if 2+ shapes selected, align_shapes
- "resize the red circle twice as big" → if red circle selected, update_shape with width*2 and height*2
- "add text that says Hello World" → create_shape with type="text" and text="Hello World"`;

/**
 * Tool registry - will be populated with actual tools
 */
let toolRegistry: Map<string, Tool> = new Map();

/**
 * Register a tool for the AI agent
 */
export const registerTool = (tool: Tool): void => {
  toolRegistry.set(tool.name, tool);
};

/**
 * Register multiple tools at once
 */
export const registerTools = (tools: Tool[]): void => {
  tools.forEach(registerTool);
};

/**
 * Get all registered tools
 */
export const getRegisteredTools = (): Tool[] => {
  return Array.from(toolRegistry.values());
};

/**
 * Clear all registered tools (for testing)
 */
export const clearTools = (): void => {
  toolRegistry.clear();
};

/**
 * Initialize AI agent with basic tools
 * Call this once when the app starts
 */
export const initializeAIAgent = (): void => {
  // Clear existing tools
  clearTools();

  // Register basic tools
  const basicTools = getBasicTools();
  registerTools(basicTools);

  console.log(
    `AI Agent initialized with ${basicTools.length} tools:`,
    basicTools.map((t) => t.name)
  );
};

/** Ensure tools are registered (defensive for HMR/late init) */
const ensureToolsRegistered = (): void => {
  if (getRegisteredTools().length === 0) {
    try {
      const basicTools = getBasicTools();
      registerTools(basicTools);
      console.log(
        `AI Agent auto-initialized with ${basicTools.length} tools:`,
        basicTools.map((t) => t.name)
      );
    } catch (e) {
      // swallow - processCommand will surface lack of tools if still empty
    }
  }
};

/**
 * Lightweight intent router: maps common phrasing to tool calls deterministically
 */
type RoutedStep = {
  tool: string;
  intentType: string;
  args: Record<string, any>;
};

const routeIntent = (
  text: string,
  context: AICommandContext
): RoutedStep[] | null => {
  if (!text) return null;
  const t = text.toLowerCase().trim();

  // Clear canvas command
  if (/\b(clear|empty|reset)\s+(canvas|page)\b/.test(t)) {
    return [{ tool: "clear_canvas", intentType: "delete", args: {} }];
  }

  // Check for contextual references (this, the, it, that)
  const hasContextRef = /\b(this|the|it|that|them|these)\b/.test(t);
  const hasSelected =
    context.selectedShapeIds && context.selectedShapeIds.length > 0;

  // Extract colors (all tokens) and build intent flags
  const colorTokenRe =
    /#([0-9a-f]{3}|[0-9a-f]{6})\b|\b(red|blue|green|black|white|yellow|purple|orange|pink|gray|grey)\b/g;
  const colorTokens = Array.from(t.matchAll(colorTokenRe)).map((m) => m[0]);
  const targetColorRaw = colorTokens.length
    ? colorTokens[colorTokens.length - 1]
    : undefined;
  const filterColorRaw = colorTokens.length > 1 ? colorTokens[0] : undefined;

  const isColorMake =
    /\b(make|turn|paint)\b/.test(t) && colorTokens.length >= 1;
  const isCreate =
    /\b(create|make|add)\b/.test(t) &&
    !/\b(make|twice|double|bigger|smaller|larger)\s+(it|the|this)/.test(t) &&
    !isColorMake &&
    !/\ball\b/.test(t);
  const isDelete = /\b(delete|remove|trash|clear selected)\b/.test(t);
  const isSelect = /\b(select|highlight|pick)\b/.test(t);
  const isUpdate =
    isColorMake ||
    /\b(change|set|resize|move|color|colour|width|height|size|position|bigger|smaller|larger|twice|double|scale)\b/.test(
      t
    );
  const isDuplicate = /\b(duplicate|copy|clone)\b/.test(t);
  const isRotate = /\b(rotate|turn|spin)\b/.test(t);
  const isAlign = /\b(align)\b/.test(t);
  const isDistribute = /\b(distribute|space|spread)\b/.test(t);
  const isArrangeRow = /\b(arrange).*(row|horizontal)\b/.test(t);
  const isArrangeCol = /\b(arrange).*(column|vertical)\b/.test(t);
  const isSpaceEvenly = /\b(space).*(evenly)\b/.test(t);
  const gridMatch = t.match(
    /\bgrid\s+(?:of\s+)?(\d+)\s*x\s*(\d+)(?:\s*(squares|rectangles))?\b/
  );

  const typeCircle = /(circle|ellipse|oval)/.test(t) ? "circle" : null;
  const typeRect = /(rectangle|rect|square)/.test(t) ? "rectangle" : null;
  const typeTriangle = /triangle/.test(t) ? "triangle" : null;
  const typeText = /\b(text|label|title)\b/.test(t) ? "text" : null;
  const shapeType = typeCircle || typeRect || typeTriangle || typeText || null;

  // Target color used by downstream code
  const color = targetColorRaw || undefined;

  // Basic position parsing: "at x, y"
  const posMatch = t.match(/\bat\s*(\d+)\s*,\s*(\d+)\b/);
  const x = posMatch ? Number(posMatch[1]) : undefined;
  const y = posMatch ? Number(posMatch[2]) : undefined;

  // Dimension parsing: "200x300" or "200 x 300"
  const dimMatch = t.match(/\b(\d+)\s*x\s*(\d+)\b/i);
  const customWidth = dimMatch ? Number(dimMatch[1]) : undefined;
  const customHeight = dimMatch ? Number(dimMatch[2]) : undefined;

  // Relative phrases using currently selected shape
  const hasUnder = /\bunder|below\b/.test(t);
  const hasAbove = /\babove\b/.test(t);
  const hasLeft = /\bleft of\b/.test(t);
  const hasRight = /\bright of\b/.test(t);
  // Edges/anchors on canvas
  const edgeTop = /\btop\b/.test(t);
  const edgeBottom = /\bbottom\b/.test(t);
  const edgeLeft = /\bleft\b/.test(t);
  const edgeRight = /\bright\b/.test(t);
  const hasCenterWord = /\b(center|centre|middle)\b/.test(t);

  // Helper: selected shape if any
  const selectedId = context.selectedShapeIds?.[0];
  const selected: Shape | undefined = selectedId
    ? context.shapes.find((s) => s.id === selectedId)
    : undefined;

  // Unified type map
  const TYPE_MAP: Record<string, string[]> = {
    rectangle: ["rect", "rectangle", "square"],
    circle: ["ellipse", "circle", "oval"],
    triangle: ["triangle"],
    text: ["text"],
    image: ["image", "img", "picture", "photo"],
  };

  const wantedTypes = shapeType ? TYPE_MAP[shapeType] || [shapeType] : null;

  const resolveCandidates = (
    wanted: string[] | null,
    filterColorRaw?: string
  ): Shape[] => {
    const filterColor = normalizeColor(filterColorRaw || "");
    return context.shapes.filter(
      (s) =>
        (wanted ? wanted.includes(s.type) : true) &&
        (filterColor ? (s.color || "").toUpperCase() === filterColor : true)
    );
  };

  // Shape-agnostic: "move ... to the center"
  if (/\bmove\b/.test(t) && hasCenterWord) {
    const candidates = resolveCandidates(wantedTypes, filterColorRaw);
    const cw = context.canvasDimensions?.width ?? 800;
    const ch = context.canvasDimensions?.height ?? 600;
    const centerArgs = (sh: Shape) => {
      const w = sh.width || 100;
      const h = sh.height || 100;
      const nx = Math.max(0, Math.round((cw - w) / 2));
      const ny = Math.max(0, Math.round((ch - h) / 2));
      return { shapeId: sh.id, x: nx, y: ny };
    };
    if (candidates.length === 1) {
      return [
        {
          tool: "update_shape",
          intentType: "update",
          args: centerArgs(candidates[0]),
        },
      ];
    }
    if (candidates.length > 1) {
      if (/\ball\b/.test(t)) {
        return candidates.map((s) => ({
          tool: "update_shape",
          intentType: "update",
          args: centerArgs(s),
        }));
      }
      return [
        {
          tool: "select_shape",
          intentType: "select",
          args: {
            type: shapeType || "all",
            color: filterColorRaw || undefined,
          },
        },
      ];
    }
    if (context.shapes.length === 1) {
      return [
        {
          tool: "update_shape",
          intentType: "update",
          args: centerArgs(context.shapes[0]),
        },
      ];
    }
  }

  // CREATE
  if (isCreate && shapeType) {
    const args: any = { type: shapeType, x: x ?? 200, y: y ?? 200 };
    if (color) args.fill = color;

    // Extract text content for text shapes
    if (shapeType === "text") {
      const textMatch = t.match(
        /(?:says?|that says?|with text|reading|content)\s*['"]([^'"]+)['"]/
      );
      const textMatch2 = t.match(
        /(?:says?|that says?|with text|reading|content)\s+(\w+(?:\s+\w+)*)/
      );
      if (textMatch) {
        args.text = textMatch[1];
      } else if (textMatch2) {
        args.text = textMatch2[1];
      } else {
        args.text = "Text";
      }
      args.width = 200;
      args.height = 40;
      args.fontSize = 18;
    } else if (shapeType === "circle") {
      // Default sizes for circle
      args.radius = customWidth ?? 50; // Use customWidth as radius if specified
    } else {
      // rectangle/triangle defaults - use custom dimensions if provided
      args.width = customWidth ?? 100;
      args.height = customHeight ?? 100;
    }

    // Anchoring on canvas (center/top/bottom/left/right)
    if (context.canvasDimensions) {
      const cw = context.canvasDimensions.width;
      const ch = context.canvasDimensions.height;
      const w = args.width ?? (args.radius ? args.radius * 2 : 100);
      const h = args.height ?? (args.radius ? args.radius * 2 : 100);
      const margin = 20;

      if (hasCenterWord) {
        args.x = Math.max(0, Math.round((cw - w) / 2));
        args.y = Math.max(0, Math.round((ch - h) / 2));
      }

      if (edgeLeft) args.x = margin;
      if (edgeRight) args.x = Math.max(0, cw - w - margin);
      if (edgeTop) args.y = margin;
      if (edgeBottom) args.y = Math.max(0, ch - h - margin);
    }

    // Relative positioning to currently selected shape
    if (selected && (hasUnder || hasAbove || hasLeft || hasRight)) {
      const margin = 20;
      const sx = selected.x;
      const sy = selected.y;
      const sw = selected.width || 100;
      const sh = selected.height || 100;
      if (hasUnder) {
        args.x = sx;
        args.y = sy + sh + margin;
      } else if (hasAbove) {
        args.x = sx;
        args.y = Math.max(0, sy - (args.height || 100) - margin);
      } else if (hasLeft) {
        args.x = Math.max(0, sx - (args.width || 100) - margin);
        args.y = sy;
      } else if (hasRight) {
        args.x = sx + sw + margin;
        args.y = sy;
      }
    }

    // Count parsing for multi-create: "add 2 blue circles"
    const countMatch = t.match(/\b(\d{1,2})\b/);
    const count = countMatch
      ? Math.min(20, Math.max(1, Number(countMatch[1])))
      : 1;
    if (count > 1) {
      const steps: RoutedStep[] = [];
      const gap = 20;
      const w = args.width ?? (args.radius ? args.radius * 2 : 100);
      for (let i = 0; i < count; i++) {
        const stepArgs = { ...args } as any;
        stepArgs.x = (args.x ?? 200) + i * (w + gap);
        steps.push({
          tool: "create_shape",
          intentType: "create",
          args: stepArgs,
        });
      }
      return steps;
    }

    return [{ tool: "create_shape", intentType: "create", args }];
  }

  // CREATE from natural phrases (templates)
  if (/\bsmiley\b/.test(t)) {
    return [
      {
        tool: "create_from_template",
        intentType: "create",
        args: { templateName: "smiley_face", x: x ?? 200, y: y ?? 200 },
      },
    ];
  }

  // CREATE GRID NxM squares/rectangles
  if (gridMatch) {
    const rows = Number(gridMatch[1]);
    const cols = Number(gridMatch[2]);
    const cellW = customWidth ?? 100;
    const cellH = customHeight ?? 100;
    const gap = 20;
    const startX = x ?? 200;
    const startY = y ?? 200;
    const steps: RoutedStep[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        steps.push({
          tool: "create_shape",
          intentType: "create",
          args: {
            type: "rectangle",
            x: startX + c * (cellW + gap),
            y: startY + r * (cellH + gap),
            width: cellW,
            height: cellH,
            fill: color || undefined,
          },
        });
      }
    }
    return steps;
  }

  // DELETE
  if (isDelete) {
    if (/\bselected\b/.test(t)) {
      return [
        {
          tool: "delete_shape",
          intentType: "delete",
          args: { deleteSelected: true },
        },
      ];
    }
    // Resolve by type/color (shape-agnostic)
    const candidates = resolveCandidates(wantedTypes, color);
    if (candidates.length === 1) {
      return [
        {
          tool: "delete_shape",
          intentType: "delete",
          args: { shapeId: candidates[0].id },
        },
      ];
    }
    if (candidates.length > 1) {
      if (/\ball\b/.test(t)) {
        return [
          {
            tool: "delete_many_shapes",
            intentType: "delete",
            args: { shapeIds: candidates.map((s) => s.id) },
          },
        ];
      }
      return [
        {
          tool: "select_shape",
          intentType: "select",
          args: { type: shapeType || "all", color },
        },
      ];
    }
    // Fallback: single shape on canvas
    if (context.shapes.length === 1) {
      return [
        {
          tool: "delete_shape",
          intentType: "delete",
          args: { shapeId: context.shapes[0].id },
        },
      ];
    }
    return null;
  }

  // UPDATE (color/size/resize)
  if (isUpdate) {
    const args: any = {
      updateSelected: /\bselected\b/.test(t) || hasContextRef || !!selected,
    };
    if (color) args.fill = color;

    // Center selected shapes
    if (hasCenterWord && context.selectedShapeIds?.length) {
      const steps: RoutedStep[] = [];
      const cw = context.canvasDimensions?.width ?? 800;
      const ch = context.canvasDimensions?.height ?? 600;
      const selectedShapes = context.shapes.filter((s) =>
        context.selectedShapeIds.includes(s.id)
      );
      selectedShapes.forEach((s) => {
        const nx = Math.max(0, Math.round((cw - (s.width || 100)) / 2));
        const ny = Math.max(0, Math.round((ch - (s.height || 100)) / 2));
        steps.push({
          tool: "update_shape",
          intentType: "update",
          args: { shapeId: s.id, x: nx, y: ny },
        });
      });
      if (steps.length) return steps;
    }

    // Relative movement: move|nudge (up|down|left|right) N
    const moveMatch = t.match(
      /\b(move|nudge)\s+(up|down|left|right)\s*(\d+)\b/
    );
    if (moveMatch && context.selectedShapeIds?.length) {
      const dir = moveMatch[2];
      const amt = Number(moveMatch[3]);
      const dx = dir === "left" ? -amt : dir === "right" ? amt : 0;
      const dy = dir === "up" ? -amt : dir === "down" ? amt : 0;
      const steps: RoutedStep[] = [];
      const selectedShapes = context.shapes.filter((s) =>
        context.selectedShapeIds.includes(s.id)
      );
      selectedShapes.forEach((s) => {
        steps.push({
          tool: "update_shape",
          intentType: "update",
          args: { shapeId: s.id, x: (s.x || 0) + dx, y: (s.y || 0) + dy },
        });
      });
      if (steps.length) return steps;
    }

    // Check for scaling phrases (twice, 2x, 3 times, etc.)
    const twiceMatch = /\b(twice|double)\b/.test(t);
    const timesMatch = t.match(/(\d+)\s*times/);
    const xMatch = t.match(/(\d+)x/);

    const scaleFactor = twiceMatch
      ? 2
      : timesMatch
      ? Number(timesMatch[1])
      : xMatch
      ? Number(xMatch[1])
      : null;

    if (scaleFactor && hasSelected && context.selectedShapeIds.length > 0) {
      // Get the first selected shape to calculate new size
      const shape = context.shapes.find(
        (s) => s.id === context.selectedShapeIds[0]
      );
      if (shape) {
        args.width = (shape.width || 100) * scaleFactor;
        args.height = (shape.height || 100) * scaleFactor;
      }
    } else {
      // Direct size specification - check for "WxH" format first
      if (customWidth !== undefined) args.width = customWidth;
      if (customHeight !== undefined) args.height = customHeight;

      // Also check for "width X" and "height Y" format
      const sizeMatch = t.match(/(width|w)\s*(\d+)/);
      const heightMatch = t.match(/(height|h)\s*(\d+)/);
      if (sizeMatch && !args.width) args.width = Number(sizeMatch[2]);
      if (heightMatch && !args.height) args.height = Number(heightMatch[2]);
    }

    if (Object.keys(args).length > 1) {
      // If specific target set is implied, prefer bulk tool
      const ids = (() => {
        const typeMap: Record<string, string[]> = {
          rectangle: ["rect", "rectangle"],
          triangle: ["triangle"],
          circle: ["ellipse", "circle"],
          text: ["text"],
        };
        const wantedTypes = shapeType
          ? typeMap[shapeType] || [shapeType]
          : null;
        const wantedColor = normalizeColor(filterColorRaw || "");
        if (!wantedTypes && !wantedColor) return [] as string[];
        return context.shapes
          .filter(
            (s) =>
              (wantedTypes ? wantedTypes.includes(s.type) : true) &&
              (wantedColor
                ? (s.color || "").toUpperCase() === wantedColor
                : true)
          )
          .map((s) => s.id);
      })();
      if (ids.length > 1) {
        const updates: any = {};
        if (typeof args.width === "number") updates.width = args.width;
        if (typeof args.height === "number") updates.height = args.height;
        if (typeof args.x === "number") updates.x = args.x;
        if (typeof args.y === "number") updates.y = args.y;
        if ((args as any).fill) updates.fill = (args as any).fill;
        if (/\ball\b/.test(t)) {
          return [
            {
              tool: "update_many_shapes",
              intentType: "update",
              args: { shapeIds: ids, updates },
            },
          ];
        }
        // ask for selection when multiple match and no 'all'
        return [
          {
            tool: "select_shape",
            intentType: "select",
            args: {
              type: shapeType || "all",
              color: filterColorRaw || undefined,
            },
          },
        ];
      }
      if (ids.length === 1) {
        // center handling if requested
        if (hasCenterWord) {
          const cw = context.canvasDimensions?.width ?? 800;
          const ch = context.canvasDimensions?.height ?? 600;
          const theShape = context.shapes.find((s) => s.id === ids[0]);
          const w = theShape?.width || 100;
          const h = theShape?.height || 100;
          const nx = Math.max(0, Math.round((cw - w) / 2));
          const ny = Math.max(0, Math.round((ch - h) / 2));
          return [
            {
              tool: "update_shape",
              intentType: "update",
              args: { shapeId: ids[0], x: nx, y: ny },
            },
          ];
        }
        return [
          {
            tool: "update_shape",
            intentType: "update",
            args: { ...args, updateSelected: false, shapeId: ids[0] },
          },
        ];
      }
      // Fallback: if exactly one match by type only
      if (!ids.length && shapeType) {
        const typeMapOnly: Record<string, string[]> = {
          rectangle: ["rect", "rectangle"],
          triangle: ["triangle"],
          circle: ["ellipse", "circle"],
          text: ["text"],
        };
        const types = typeMapOnly[shapeType] || [shapeType];
        const byType = context.shapes.filter((s) => types.includes(s.type));
        if (byType.length === 1) {
          if (hasCenterWord) {
            const cw = context.canvasDimensions?.width ?? 800;
            const ch = context.canvasDimensions?.height ?? 600;
            const sh = byType[0];
            const w = sh.width || 100;
            const h = sh.height || 100;
            const nx = Math.max(0, Math.round((cw - w) / 2));
            const ny = Math.max(0, Math.round((ch - h) / 2));
            return [
              {
                tool: "update_shape",
                intentType: "update",
                args: { shapeId: sh.id, x: nx, y: ny },
              },
            ];
          }
          return [
            {
              tool: "update_shape",
              intentType: "update",
              args: { ...args, updateSelected: false, shapeId: byType[0].id },
            },
          ];
        }
      }
      // Unique canvas fallback
      if (context.shapes.length === 1) {
        const sh = context.shapes[0];
        if (hasCenterWord) {
          const cw = context.canvasDimensions?.width ?? 800;
          const ch = context.canvasDimensions?.height ?? 600;
          const w = sh.width || 100;
          const h = sh.height || 100;
          const nx = Math.max(0, Math.round((cw - w) / 2));
          const ny = Math.max(0, Math.round((ch - h) / 2));
          return [
            {
              tool: "update_shape",
              intentType: "update",
              args: { shapeId: sh.id, x: nx, y: ny },
            },
          ];
        }
        return [
          {
            tool: "update_shape",
            intentType: "update",
            args: { ...args, updateSelected: false, shapeId: sh.id },
          },
        ];
      }
      return [{ tool: "update_shape", intentType: "update", args }];
    }
  }

  // SELECT
  if (isSelect) {
    if (/\bdeselect all|clear selection\b/.test(t)) {
      return [
        {
          tool: "select_shape",
          intentType: "select",
          args: { deselectAll: true },
        },
      ];
    }
    if (shapeType) {
      return [
        {
          tool: "select_shape",
          intentType: "select",
          args: { type: shapeType },
        },
      ];
    }
    if (/\btext\b/.test(t)) {
      return [
        {
          tool: "select_shape",
          intentType: "select",
          args: { type: "text" },
        },
      ];
    }
  }

  // LAYOUT COMPOSITES
  if (isArrangeRow && context.selectedShapeIds?.length >= 2) {
    return [
      {
        tool: "align_shapes",
        intentType: "align",
        args: { alignment: "middle" },
      },
      {
        tool: "distribute_shapes",
        intentType: "distribute",
        args: { direction: "horizontal" },
      },
    ];
  }

  if (isArrangeCol && context.selectedShapeIds?.length >= 2) {
    return [
      {
        tool: "align_shapes",
        intentType: "align",
        args: { alignment: "center" },
      },
      {
        tool: "distribute_shapes",
        intentType: "distribute",
        args: { direction: "vertical" },
      },
    ];
  }

  if (isSpaceEvenly && context.selectedShapeIds?.length >= 3) {
    // Decide axis by spread
    const selectedShapes = context.shapes.filter((s) =>
      context.selectedShapeIds.includes(s.id)
    );
    const xSpread =
      Math.max(...selectedShapes.map((s) => s.x)) -
      Math.min(...selectedShapes.map((s) => s.x));
    const ySpread =
      Math.max(...selectedShapes.map((s) => s.y)) -
      Math.min(...selectedShapes.map((s) => s.y));
    const direction = xSpread >= ySpread ? "horizontal" : "vertical";
    return [
      {
        tool: "distribute_shapes",
        intentType: "distribute",
        args: { direction },
      },
    ];
  }

  // DUPLICATE (shape-agnostic)
  if (isDuplicate) {
    // Check if user is referring to a specific shape or selected shapes
    if (hasContextRef || hasSelected) {
      const args: any = {};
      const offsetMatch = t.match(/offset\s*(\d+)/);
      if (offsetMatch) {
        args.offsetX = Number(offsetMatch[1]);
        args.offsetY = Number(offsetMatch[1]);
      }
      return [{ tool: "duplicate_shape", intentType: "duplicate", args }];
    }
    // Resolve by type/color when no selection
    const cand = resolveCandidates(wantedTypes, filterColorRaw || color);
    if (cand.length === 1) {
      return [
        {
          tool: "duplicate_shape",
          intentType: "duplicate",
          args: { shapeId: cand[0].id },
        },
      ];
    }
    if (cand.length > 1) {
      if (/\ball\b/.test(t)) {
        return [
          {
            tool: "duplicate_many_shapes",
            intentType: "duplicate",
            args: { shapeIds: cand.map((s) => s.id) },
          },
        ];
      }
      return [
        {
          tool: "select_shape",
          intentType: "select",
          args: {
            type: shapeType || "all",
            color: filterColorRaw || color || undefined,
          },
        },
      ];
    }
  }

  // ROTATE (shape-agnostic)
  if (isRotate) {
    const degreeMatch = t.match(/(-?\d+)\s*(degrees?|°)?/);
    const cw = /\b(clockwise|right)\b/.test(t);
    const ccw = /\b(counter[-\s]?clockwise|anti[-\s]?clockwise|left)\b/.test(t);
    const degrees = degreeMatch
      ? Number(degreeMatch[1])
      : cw
      ? 90
      : ccw
      ? -90
      : 90;

    // 1) If user refers to selected shape(s), rotate selection
    if ((hasContextRef || hasSelected) && degrees !== undefined) {
      return [
        { tool: "rotate_shape", intentType: "rotate", args: { degrees } },
      ];
    }

    // 2) Try to resolve by type/color (e.g., "rotate the red square 45 degrees")
    if (degrees !== undefined) {
      const candidates = resolveCandidates(
        wantedTypes,
        filterColorRaw || color
      );

      if (candidates.length === 1) {
        return [
          {
            tool: "rotate_shape",
            intentType: "rotate",
            args: { degrees, shapeId: candidates[0].id },
          },
        ];
      }
      if (candidates.length > 1) {
        if (/\ball\b/.test(t)) {
          return [
            {
              tool: "rotate_many_shapes",
              intentType: "rotate",
              args: { shapeIds: candidates.map((s) => s.id), degrees },
            },
          ];
        }
        return [
          {
            tool: "select_shape",
            intentType: "select",
            args: {
              type: shapeType || "all",
              color: filterColorRaw || color || undefined,
            },
          },
        ];
      }
    }
  }

  // ALIGN
  if (isAlign) {
    const alignMatch = t.match(/\b(left|right|center|top|bottom|middle)\b/);
    if (alignMatch) {
      const alignment = alignMatch[1];
      return [
        { tool: "align_shapes", intentType: "align", args: { alignment } },
      ];
    }
  }

  // DISTRIBUTE
  if (isDistribute) {
    const dirMatch = t.match(/\b(horizontal|vertical)ly?\b/);
    if (dirMatch) {
      const direction = dirMatch[1];
      // If no selection, try distributing all shapes of inferred type
      if (!hasSelected && shapeType) {
        const typeMap: Record<string, string[]> = {
          rectangle: ["rect", "rectangle"],
          triangle: ["triangle"],
          circle: ["ellipse", "circle"],
          text: ["text"],
        };
        const wanted = typeMap[shapeType] || [shapeType];
        const ids = context.shapes
          .filter((s) => wanted.includes(s.type))
          .map((s) => s.id);
        if (ids.length >= 3) {
          // First align on perpendicular axis for nicer result
          const align = direction === "horizontal" ? "middle" : "center";
          return [
            {
              tool: "select_shape",
              intentType: "select",
              args: { type: shapeType },
            },
            {
              tool: "align_shapes",
              intentType: "align",
              args: { alignment: align },
            },
            {
              tool: "distribute_shapes",
              intentType: "distribute",
              args: { direction },
            },
          ];
        }
      }
      return [
        {
          tool: "distribute_shapes",
          intentType: "distribute",
          args: { direction },
        },
      ];
    }
    // Default to horizontal if not specified
    if (/\bhorizontal|even|space/.test(t)) {
      return [
        {
          tool: "distribute_shapes",
          intentType: "distribute",
          args: { direction: "horizontal" },
        },
      ];
    }
  }

  return null; // fall back to OpenAI
};

/**
 * Execute a tool by name
 */
export const executeTool = async (
  toolName: string,
  params: any,
  context: AICommandContext
): Promise<AIToolResult> => {
  const tool = toolRegistry.get(toolName);

  if (!tool) {
    return {
      success: false,
      message: `Tool '${toolName}' not found`,
      error: `Unknown tool: ${toolName}`,
    };
  }

  try {
    return await tool.execute(params, context);
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to execute ${toolName}`,
      error: error.message || "Unknown error",
    };
  }
};

/**
 * Provide helpful suggestions for invalid or unclear commands
 */
const suggestCorrection = (text: string): string | null => {
  const t = text.toLowerCase().trim();

  // Common misspellings or variations
  if (/\bdraw\s+a\b/.test(t)) {
    return 'Did you mean "create a shape"? Try: "create a rectangle", "create a circle", or "create text that says..."';
  }

  if (
    /\bmake\s+bigger|make\s+smaller/.test(t) &&
    !/\btwice|2x|\d+\s*times/.test(t)
  ) {
    return 'Please specify how much bigger or smaller. Try: "make it twice as big" or "resize to 200x200"';
  }

  if (/\bremove\b/.test(t) && !/\bdelete|shape|circle|rectangle/.test(t)) {
    return 'Did you mean "delete the selected shape" or "delete the [shape type]"?';
  }

  return null;
};

/**
 * Detect if a command is ambiguous and needs clarification
 */
const detectAmbiguity = (
  text: string,
  context: AICommandContext
): string | null => {
  const t = text.toLowerCase();

  // First check for invalid/unclear commands
  const suggestion = suggestCorrection(t);
  if (suggestion) return suggestion;

  // Check for commands referencing "the circle" when multiple circles exist
  if (/\bthe\s+(circle|ellipse|oval)\b/.test(t)) {
    const circleCount = context.shapes.filter((s) =>
      ["circle", "ellipse"].includes(s.type)
    ).length;
    if (circleCount > 1) {
      return `Which circle? There are ${circleCount} circles on the canvas. Please select one first or be more specific (e.g., "the red circle").`;
    }
  }

  // Check for commands referencing "the rectangle" when multiple exist
  if (/\bthe\s+(rectangle|rect|square)\b/.test(t)) {
    const rectCount = context.shapes.filter((s) =>
      ["rect", "rectangle"].includes(s.type)
    ).length;
    if (rectCount > 1) {
      return `Which rectangle? There are ${rectCount} rectangles on the canvas. Please select one first or be more specific.`;
    }
  }

  // Check for commands referencing "the shape" when multiple exist
  if (/\bthe\s+shape\b/.test(t) && !context.selectedShapeIds.length) {
    if (context.shapes.length > 1) {
      return `Which shape? There are ${context.shapes.length} shapes on the canvas. Please be more specific or select a shape first.`;
    }
  }

  return null;
};

/**
 * Process an AI command
 */
export const processCommand = async (
  command: AICommand,
  context: AICommandContext
): Promise<AIResponse> => {
  const startTime = Date.now();
  // Ensure tools exist (covers cases where App init hasn't run yet or HMR cleared registry)
  ensureToolsRegistered();
  const tools = getRegisteredTools();

  if (tools.length === 0) {
    return {
      success: false,
      message: "AI agent is not properly initialized. No tools available.",
      error: "No tools registered",
      command: command.text,
      executionTime: Date.now() - startTime,
    };
  }

  // Check for ambiguity before processing
  const ambiguityMessage = detectAmbiguity(command.text, context);
  if (ambiguityMessage) {
    return {
      success: false,
      message: ambiguityMessage,
      command: command.text,
      executionTime: Date.now() - startTime,
    };
  }

  // 1) Try client-side intent router first (deterministic & fast)
  const routed = routeIntent(command.text, context);
  if (routed) {
    const actions: AIAction[] = [];
    for (const step of routed) {
      const result = await executeTool(step.tool, step.args, context);
      actions.push({
        type: step.intentType as any,
        params: step.args,
        result: result.success ? "success" : "failed",
        reason: result.error,
      });
      // Emit minimal progress to UI via memory (optional)
      try {
        memorySync.recordEvent({
          type: "AI_COMMAND",
          summary: `Step: ${step.tool} -> ${result.success ? "ok" : "error"}`,
          details: { args: step.args, error: result.error },
        });
      } catch {}
      // If a selection step succeeded, update local context snapshot
      if (step.tool === "select_shape") {
        // No-op: UI state is already updated by tools via context.shapeActions
      }
      if (!result.success) {
        return {
          success: false,
          message: result.message,
          error: result.error,
          command: command.text,
          actions,
          executionTime: Date.now() - startTime,
        };
      }
    }
    // Record memory progress entry
    try {
      memorySync.recordEvent({
        type: "AI_COMMAND",
        summary: `Executed: ${command.text}`,
        details: {
          actions: actions.length,
          tools: actions.map((a) => a.type),
          canvas: `${context.canvasDimensions.width}x${context.canvasDimensions.height}`,
          selected: context.selectedShapeIds?.length ?? 0,
        },
      });
    } catch {}
    return {
      success: true,
      message: actions.length ? "Executed action(s)" : "Nothing to do",
      command: command.text,
      actions,
      executionTime: Date.now() - startTime,
    };
  }

  try {
    // Prepare messages for OpenAI
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      // memory preface for model grounding (cheap, fixed size)
      {
        role: "system",
        content: (() => {
          try {
            const defs = memoryBank.getDefaults();
            const templates = memoryBank.getTemplateNames();
            return [
              "Memory:",
              `Canvas defaults: ${defs.canvas.defaultWidth}x${defs.canvas.defaultHeight}`,
              `Shape defaults: rect ${defs.shapes.rectangle.defaultWidth}x${defs.shapes.rectangle.defaultHeight}, circle r=${defs.shapes.circle.defaultRadius}, text size=${defs.shapes.text.defaultFontSize}`,
              `Duplicate offset: ${defs.duplicateOffset.x},${defs.duplicateOffset.y}`,
              `Templates: ${templates.join(", ")}`,
            ].join("\n");
          } catch {
            return "";
          }
        })(),
      },
      {
        role: "user",
        content: command.text,
      },
    ];

    // Add context about current canvas state
    const contextInfo: string[] = [];

    // Selected shapes info
    if (context.selectedShapeIds && context.selectedShapeIds.length > 0) {
      const selectedShapes = context.shapes.filter((s) =>
        context.selectedShapeIds.includes(s.id)
      );
      contextInfo.push(
        `Currently selected: ${context.selectedShapeIds.length} shape(s)`
      );
      selectedShapes.forEach((shape, i) => {
        contextInfo.push(
          `  - Selected shape ${i + 1}: ${shape.type} at (${shape.x}, ${
            shape.y
          }), size: ${shape.width || "N/A"}x${shape.height || "N/A"}, color: ${
            shape.color
          }`
        );
      });
    } else {
      contextInfo.push("No shapes currently selected");
    }

    // Total shapes
    if (context.shapes && context.shapes.length > 0) {
      contextInfo.push(`Total shapes on canvas: ${context.shapes.length}`);

      // Add shape details for better context
      const shapeTypes = context.shapes.reduce((acc, shape) => {
        acc[shape.type] = (acc[shape.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      contextInfo.push(`Shape breakdown: ${JSON.stringify(shapeTypes)}`);
    } else {
      contextInfo.push("Canvas is empty");
    }

    // Canvas dimensions
    if (context.canvasDimensions) {
      contextInfo.push(
        `Canvas size: ${context.canvasDimensions.width}x${context.canvasDimensions.height}`
      );
    }

    if (contextInfo.length > 0) {
      messages.push({
        role: "system",
        content: `Current canvas state:\n${contextInfo.join("\n")}`,
      });
    }

    // Call OpenAI with function calling
    const response = await executeCompletionWithRetry(messages, tools);

    const choice = response.choices[0];
    const message = choice.message;

    // Check if the model wants to call functions
    if (message.tool_calls && message.tool_calls.length > 0) {
      const actions: AIAction[] = [];
      const results: AIToolResult[] = [];

      // Execute all tool calls
      for (const toolCall of message.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        const result = await executeTool(functionName, functionArgs, context);
        results.push(result);

        actions.push({
          type: functionName as any, // Type will be validated by tool registry
          params: functionArgs,
          result: result.success ? "success" : "failed",
          reason: result.error,
        });
      }

      // Check if all actions succeeded
      const allSucceeded = results.every((r) => r.success);
      const successfulCount = results.filter((r) => r.success).length;

      // Generate response message
      let responseMessage = message.content || "";
      if (!responseMessage) {
        if (allSucceeded) {
          responseMessage = results.map((r) => r.message).join(". ");
        } else {
          responseMessage = `Completed ${successfulCount} of ${
            results.length
          } actions. ${results
            .filter((r) => !r.success)
            .map((r) => r.message)
            .join(". ")}`;
        }
      }

      return {
        success: allSucceeded,
        message: responseMessage,
        error: allSucceeded ? undefined : "Some actions failed",
        command: command.text,
        executionTime: Date.now() - startTime,
        actions,
      };
    }

    // No function calls, just a text response
    return {
      success: false,
      message:
        message.content ||
        "I could not understand that command. Please try rephrasing.",
      error: "No actions taken",
      command: command.text,
      executionTime: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Failed to process command",
      error: error.message || "Unknown error",
      command: command.text,
      executionTime: Date.now() - startTime,
    };
  }
};

/**
 * Parse common patterns locally for faster response (optional optimization)
 */
export const quickParse = (
  text: string
): { action?: string; params?: any } | null => {
  const lowercaseText = text.toLowerCase();

  // Quick patterns for common commands
  const patterns = [
    {
      regex: /create\s+(a\s+)?(\w+)\s+(?:at\s+)?(\d+),\s*(\d+)/i,
      action: "createShape",
      extract: (match: RegExpMatchArray) => ({
        type: match[2],
        x: parseInt(match[3]),
        y: parseInt(match[4]),
      }),
    },
    {
      regex: /delete\s+(?:the\s+)?selected/i,
      action: "deleteSelected",
      extract: () => ({}),
    },
    {
      regex: /select\s+all/i,
      action: "selectAll",
      extract: () => ({}),
    },
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (match) {
      return {
        action: pattern.action,
        params: pattern.extract(match),
      };
    }
  }

  return null;
};
