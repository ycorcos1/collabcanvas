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
import { memoryBank } from "./memoryBank";
import { segmentCommands, detectAnchor, anchorXY } from "./aiPlanner";
import { runGraphPlan } from "./agentGraph";
import { normalizeColor } from "../utils/colorHelpers";

/**
 * System prompt for the AI agent
 * Now supports both canvas manipulation AND project management
 */
const SYSTEM_PROMPT = `You are a helpful AI assistant for a collaborative design platform. You can help users with BOTH canvas manipulation AND project management.

CONTEXT AWARENESS:
- You can see the current canvas state including all shapes and selected shapes
- When the user says "this", "the", "it", "that", they're referring to SELECTED shapes
- **CRITICAL**: If user refers to a shape by type/color (e.g., "the red circle") and there's only ONE match on the canvas, automatically target it - DON'T ask for ID or selection
- **CRITICAL**: Only ask for clarification if there are MULTIPLE shapes matching the description AND user didn't say "all"
- If command says "all X shapes" (e.g., "all circles", "all red shapes"), act on all matching shapes using the appropriate bulk tool
- Example: "resize the red circle twice as big" → if only 1 red circle exists, update it directly; if multiple exist and no "all", ask user to select which one

CANVAS TOOLS - You can manipulate shapes on the canvas:
- Create shapes (rectangles, circles, triangles, lines, arrows, text, images) with specified positions, sizes, colors, and content
- Create from templates (card, button, login_form, navbar, card_layout, smiley_face) - predefined shape compositions
- Delete single shapes or multiple shapes at once (delete_shape, delete_many_shapes)
- Update single or multiple shape properties (position, size, color, text, font, rotation) using update_shape or update_many_shapes
- Select shapes by criteria (type, color, position) - use this to help user disambiguate when multiple matches exist
- Duplicate shapes with optional offset (duplicate_shape, duplicate_many_shapes)
- Rotate shapes by degrees (rotate_shape, rotate_many_shapes)
- Align multiple shapes (left, right, center, top, middle, bottom) - requires 2+ shapes
- Distribute multiple shapes evenly (horizontal or vertical) - requires 3+ shapes
- Clear entire canvas (clear_canvas)

PROJECT MANAGEMENT TOOLS - You can also manage projects:
- Create new projects with custom names
- Delete projects (move to trash with confirmation)
- Empty trash (permanently delete all trashed projects - requires strong confirmation)
- Send collaboration invitations by email
- Navigate to different sections of the app
- Change application theme/settings

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
- **NEVER ask for shape IDs** - always use descriptive targeting (type, color, position) or select_shape to help user choose
- If the user says "create", "make", or "add", call create_shape or create_from_template
- If the user says "delete" or "remove", call delete_shape (single) or delete_many_shapes (multiple/all)
- If the user says "select" or "highlight", call select_shape with type/color criteria
- If the user says "change", "set", or modifies color/size/position, call update_shape (single) or update_many_shapes (multiple/all)
- If the user says "duplicate", "copy", or "clone", call duplicate_shape (single) or duplicate_many_shapes (multiple/all)
- If the user says "rotate", "turn", or "spin", call rotate_shape (single) or rotate_many_shapes (multiple/all)
- If the user says "align", call align_shapes (requires 2+ shapes selected)
- If the user says "distribute", "space", or "spread", call distribute_shapes (requires 3+ shapes selected)
- If the user says "clear" or "delete everything", call clear_canvas
- Treat rectangle/rect/square as the same; circle/ellipse/oval as the same
- If something fails, explain why clearly in user-friendly terms

CANVAS Examples:
- "create a red circle at 100, 200" → create_shape with x=100, y=200, fill="red", type="circle"
- "make a 200x300 rectangle" → create_shape with width=200, height=300, type="rectangle"
- "add a text layer that says 'Hello World'" → create_shape with type="text", text="Hello World"
- "create a login form" → create_from_template with templateName="login_form"
- "create a card template" → create_from_template with templateName="card"
- "move the blue rectangle to the center" → if only 1 blue rectangle exists, update_shape with center coordinates
- "resize the circle to be twice as big" → if only 1 circle exists, update_shape with width*2 and height*2
- "rotate the text 45 degrees" → if only 1 text shape exists, rotate_shape with angle=45
- "delete all red ellipses" → delete_many_shapes with type filter for ellipse/circle and color="red"
- "make all the circles blue" → update_many_shapes with color filter and new fill="blue"
- "duplicate this shape" → if shape selected, duplicate_shape; if only 1 shape on canvas, duplicate it
- "arrange these shapes in a horizontal row" → if 2+ shapes selected, use distribute_shapes with direction="horizontal"
- "create a grid of 3x3 squares" → create 9 rectangle shapes in a 3x3 grid pattern
- "align them to the left" → if 2+ shapes selected, align_shapes with alignment="left"
- "clear canvas" or "delete everything" → clear_canvas

PROJECT MANAGEMENT Examples:
- "create a new project called Homepage Design" → Uses dashboard tools to create project
- "delete this project" → Uses dashboard tools with confirmation
- "send invitation to john@example.com" → Sends collaboration invite
- "go to dashboard" → Navigates to dashboard
- "switch to dark mode" → Changes theme
- "empty my trash" → Permanently deletes trashed projects (strong confirmation required)

NOTE: For project management commands, you'll use different tools that handle navigation and project operations.`;

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

  if (import.meta.env.DEV) {
    console.log(
      `AI Agent initialized with ${basicTools.length} tools:`,
      basicTools.map((t) => t.name)
    );
  }
};

/** Ensure tools are registered (defensive for HMR/late init) */
const ensureToolsRegistered = (): void => {
  if (getRegisteredTools().length === 0) {
    try {
      const basicTools = getBasicTools();
      registerTools(basicTools);
      if (import.meta.env.DEV) {
        console.log(
          `AI Agent auto-initialized with ${basicTools.length} tools:`,
          basicTools.map((t) => t.name)
        );
      }
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

  // Define anchors/edges and relational flags UP FRONT to avoid TDZ issues
  const hasUnder = /\bunder|below\b/.test(t);
  const hasAbove = /\babove\b/.test(t);
  const hasLeft = /\bleft of\b/.test(t);
  const hasRight = /\bright of\b/.test(t);
  const edgeTop = /\btop\b/.test(t);
  const edgeBottom = /\bbottom\b/.test(t);
  const edgeLeft = /\bleft\b/.test(t);
  const edgeRight = /\bright\b/.test(t);
  const hasCenterWord = /\b(center|centre|middle)\b/.test(t);

  // Helpers: numeric parsing and scale parsing
  const WORD_NUM: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    half: 0.5,
    quarter: 0.25,
    double: 2,
    triple: 3,
  };
  const numFrom = (s?: string): number | null => {
    if (!s) return null;
    if (/^\d+(?:\.\d+)?$/.test(s)) return Number(s);
    return WORD_NUM[s] ?? null;
  };
  const parseScale = (
    text: string
  ):
    | { mode: "to"; width: number; height: number }
    | { mode: "byPercent"; percent: number | null }
    | { mode: "byPx"; dw?: number; dh?: number }
    | { mode: "factor"; factor: number | null }
    | null => {
    const toWH = text.match(/\bto\s*(\d+)\s*x\s*(\d+)\b/);
    if (toWH)
      return { mode: "to", width: Number(toWH[1]), height: Number(toWH[2]) };
    const byPct = text.match(
      /(?:by|increase|decrease|reduce|grow|shrink)\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*%/
    );
    if (byPct) return { mode: "byPercent", percent: numFrom(byPct[1]) };
    const byPxW = text.match(/(?:width|w)\s*(?:by)?\s*(\+|-)?\s*(\d+)\b/);
    const byPxH = text.match(/(?:height|h)\s*(?:by)?\s*(\+|-)?\s*(\d+)\b/);
    if (byPxW || byPxH)
      return {
        mode: "byPx",
        dw: byPxW ? (byPxW[1] === "-" ? -1 : 1) * Number(byPxW[2]) : 0,
        dh: byPxH ? (byPxH[1] === "-" ? -1 : 1) * Number(byPxH[2]) : 0,
      };
    const times = text.match(
      /(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:x|times)/
    );
    if (times) return { mode: "factor", factor: numFrom(times[1]) };
    if (/\btwice|double\b/.test(text)) return { mode: "factor", factor: 2 };
    if (/\btriple\b/.test(text)) return { mode: "factor", factor: 3 };
    if (/\bhalf\b/.test(text)) return { mode: "factor", factor: 0.5 };
    return null;
  };

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
  const primaryColorRaw = colorTokens[0];
  const targetColorRaw = colorTokens.length
    ? colorTokens[colorTokens.length - 1]
    : undefined;
  let filterColorRaw: string | undefined =
    colorTokens.length > 1 ? primaryColorRaw : undefined;

  // Target color used by downstream code (now safely initialized after tokens)
  const color = targetColorRaw || undefined;

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

  // If this looks like a center/edge move and there's a single color, use it as filter
  const looksLikeCenteredMove =
    /\bmove\b/.test(t) ||
    hasCenterWord ||
    edgeTop ||
    edgeBottom ||
    edgeLeft ||
    edgeRight;
  if (!filterColorRaw && looksLikeCenteredMove) {
    filterColorRaw = targetColorRaw;
  }
  const isArrangeRow = /\b(arrange).*(row|horizontal)\b/.test(t);
  const isArrangeCol = /\b(arrange).*(column|vertical)\b/.test(t);
  const isSpaceEvenly = /\b(space).*(evenly)\b/.test(t);
  const gridMatch = t.match(
    /\bgrid\s+(?:of\s+)?(\d+)\s*x\s*(\d+)(?:\s*(squares|rectangles))?\b/
  );

  // Quoted identifier support (e.g., "Hello World")
  const quotedMatch = text.match(/["'“”]([^"'“”]+)["'“”]/);
  const quotedTextRaw = quotedMatch ? quotedMatch[1] : undefined;
  const quotedText = quotedTextRaw ? quotedTextRaw.toLowerCase() : undefined;

  // 1) Parse type first
  const typeCircle = /(circle|ellipse|oval)/.test(t) ? "circle" : null;
  const typeRect = /(rectangle|rect|square)/.test(t) ? "rectangle" : null;
  const typeTriangle = /\btriangle\b/.test(t) ? "triangle" : null;
  const typeLine = /\bline\b/.test(t) ? "line" : null;
  const typeArrow = /\barrow\b/.test(t) ? "arrow" : null;
  const typeText = /\b(text|label|title)\b/.test(t) ? "text" : null;
  const typeImage = /\b(image|img|photo|picture)\b/.test(t) ? "image" : null;
  const shapeType =
    typeCircle ||
    typeRect ||
    typeTriangle ||
    typeLine ||
    typeArrow ||
    typeText ||
    typeImage ||
    null;

  // 2) Position and dimension parsing
  const posMatch = t.match(
    /\b(?:at\s+position|position|at)\s*(\d+)\s*,\s*(\d+)\b/
  );
  const x = posMatch ? Number(posMatch[1]) : undefined;
  const y = posMatch ? Number(posMatch[2]) : undefined;

  const dimMatch = t.match(/\b(\d+)\s*x\s*(\d+)\b/i);
  const customWidth = dimMatch ? Number(dimMatch[1]) : undefined;
  const customHeight = dimMatch ? Number(dimMatch[2]) : undefined;

  // 3) Relational and anchor parsing already defined above

  // Target color used by downstream code (set after parsing tokens below)

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
    line: ["line"],
    arrow: ["arrow"],
    text: ["text"],
    image: ["image", "img", "picture", "photo"],
  };

  const wantedTypes = shapeType ? TYPE_MAP[shapeType] || [shapeType] : null;

  const resolveCandidates = (
    wanted: string[] | null,
    filterColorRaw?: string,
    quoted?: string
  ): Shape[] => {
    const filterColor = normalizeColor(filterColorRaw || "");
    let pool = context.shapes.filter((s) =>
      wanted ? wanted.includes(s.type) : true
    );
    if (filterColor) {
      pool = pool.filter(
        (s) =>
          (
            ((s as any).color || (s as any).fill || "") as string
          ).toUpperCase() === filterColor
      );
    }
    if (quoted) {
      const q = quoted.toLowerCase();
      pool = pool.filter((s) => {
        const txt = ((s as any).text || (s as any).name || "")
          .toString()
          .toLowerCase();
        return txt.includes(q);
      });
    }

    // Relational resolution: "next to/near/beside/closest to <color> <type>"
    const relMatch = t.match(
      /(next to|near|beside|closest to)\s+(?:the\s+)?(red|blue|green|black|white|yellow|purple|orange|pink|gray|grey)?\s*(rectangle|rect|square|circle|ellipse|oval|triangle|line|arrow|text|image|photo|picture|img)/
    );
    if (relMatch && pool.length > 1) {
      // Relation type (relMatch[1]) reserved for future distance-based filtering
      const relColor = normalizeColor(relMatch[2] || "");
      const relTypeToken = relMatch[3];
      const relMap: Record<string, string[]> = {
        rectangle: ["rect", "rectangle", "square"],
        circle: ["ellipse", "circle", "oval"],
        triangle: ["triangle"],
        line: ["line"],
        arrow: ["arrow"],
        text: ["text"],
        image: ["image", "img", "picture", "photo"],
      };
      let relType: string | null = null;
      if (/rect|square|rectangle/.test(relTypeToken)) relType = "rectangle";
      else if (/circle|ellipse|oval/.test(relTypeToken)) relType = "circle";
      else if (/triangle/.test(relTypeToken)) relType = "triangle";
      else if (/line/.test(relTypeToken)) relType = "line";
      else if (/arrow/.test(relTypeToken)) relType = "arrow";
      else if (/text/.test(relTypeToken)) relType = "text";
      else if (/image|img|photo|picture/.test(relTypeToken)) relType = "image";

      const relWanted = relType ? relMap[relType] || [relType] : null;
      let anchors = context.shapes.filter(
        (s) =>
          (relWanted ? relWanted.includes(s.type) : true) &&
          (relColor
            ? (
                ((s as any).color || (s as any).fill || "") as string
              ).toUpperCase() === relColor
            : true)
      );
      if (anchors.length) {
        const score = (a: Shape, b: Shape) => {
          const ax = a.x + (a.width || 0) / 2;
          const ay = a.y + (a.height || 0) / 2;
          const bx = b.x + (b.width || 0) / 2;
          const by = b.y + (b.height || 0) / 2;
          const dx = ax - bx;
          const dy = ay - by;
          const dist = Math.hypot(dx, dy);
          return dist;
        };
        // Pick the candidate with minimal distance to any anchor
        let best: { s: Shape; d: number } | null = null;
        for (const s of pool) {
          const d = Math.min(...anchors.map((a) => score(s, a)));
          if (!best || d < best.d) best = { s, d };
        }
        if (best) {
          return [best.s];
        }
      }
    }

    return pool;
  };

  // Shape-agnostic: "move ... to the center"
  if (/\bmove\b/.test(t) && hasCenterWord) {
    const candidates = resolveCandidates(
      wantedTypes,
      filterColorRaw,
      quotedText
    );
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
      const textQuoted = text.match(
        /(?:says?|that says?|with text|reading|content)\s*["'“”]([^"'“”]+)["'“”]/i
      );
      const textWords = text.match(
        /(?:says?|that says?|with text|reading|content)\s+([A-Za-z0-9][A-Za-z0-9\s!?.,'“”\-]*)/i
      );
      if (textQuoted) args.text = textQuoted[1];
      else if (textWords) args.text = textWords[1];
      else if (quotedTextRaw) args.text = quotedTextRaw;
      else {
        const loose = text.match(
          /(?:says?|that says?|with text|reading|content)\s*(?:["'“”])?(.+?)$/i
        );
        if (loose && loose[1]) {
          let content = loose[1].trim();
          content = content.replace(/["'“”]+$/g, "").trim();
          args.text = content.length > 0 ? content.slice(0, 200) : "Text";
        } else {
          args.text = "Text";
        }
      }
      args.width = 200;
      args.height = 40;
      args.fontSize = 18;
    } else if (shapeType === "circle") {
      // Default sizes for circle
      args.radius = customWidth ?? 50; // Use customWidth as radius if specified
    } else if (shapeType === "image") {
      // For images, expect src to be provided by UI upload flow; if not, no-op with helpful message
      if (!(args as any).src) {
        return [
          {
            tool: "select_shape",
            intentType: "select",
            args: {},
          },
        ];
      }
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

  // CREATE GRID NxM squares/rectangles/circles
  if (gridMatch) {
    const rows = Number(gridMatch[1]);
    const cols = Number(gridMatch[2]);
    const cw = context.canvasDimensions?.width ?? 800;
    const ch = context.canvasDimensions?.height ?? 600;
    const gap = 10;
    const cellW =
      customWidth ?? Math.max(10, Math.floor((cw - gap * (cols + 1)) / cols));
    const cellH =
      customHeight ?? Math.max(10, Math.floor((ch - gap * (rows + 1)) / rows));
    const startX = x ?? gap;
    const startY = y ?? gap;
    const steps: RoutedStep[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        steps.push({
          tool: "create_shape",
          intentType: "create",
          args: {
            type: shapeType || "rectangle",
            x: startX + c * (cellW + gap),
            y: startY + r * (cellH + gap),
            width: shapeType === "circle" ? cellW : cellW,
            height: shapeType === "circle" ? cellW : cellH,
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

    // Center or edge-align selected shapes (only when no explicit type/color was given)
    if (
      (hasCenterWord || edgeTop || edgeBottom || edgeLeft || edgeRight) &&
      context.selectedShapeIds?.length &&
      !shapeType &&
      colorTokens.length === 0
    ) {
      const steps: RoutedStep[] = [];
      const cw = context.canvasDimensions?.width ?? 800;
      const ch = context.canvasDimensions?.height ?? 600;
      const selectedShapes = context.shapes.filter((s) =>
        context.selectedShapeIds.includes(s.id)
      );
      selectedShapes.forEach((s) => {
        const w = s.width || 100;
        const h = s.height || 100;
        let nx = s.x;
        let ny = s.y;
        if (hasCenterWord) {
          nx = Math.max(0, Math.round((cw - w) / 2));
          ny = Math.max(0, Math.round((ch - h) / 2));
        }
        const margin = 20;
        if (edgeLeft) nx = margin;
        if (edgeRight) nx = Math.max(0, cw - w - margin);
        if (edgeTop) ny = margin;
        if (edgeBottom) ny = Math.max(0, ch - h - margin);
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

    // General scaling phrases: factor/percent/by px/to WxH
    const scale = parseScale(t);
    if (scale && hasSelected && context.selectedShapeIds.length > 0) {
      // Get the first selected shape to calculate new size
      const shape = context.shapes.find(
        (s) => s.id === context.selectedShapeIds[0]
      );
      if (shape) {
        const w0 = shape.width || 100;
        const h0 = shape.height || 100;
        if (scale.mode === "factor" && scale.factor) {
          args.width = Math.max(1, Math.round(w0 * scale.factor));
          args.height = Math.max(1, Math.round(h0 * scale.factor));
        } else if (scale.mode === "byPercent" && scale.percent != null) {
          const f = 1 + scale.percent / 100;
          args.width = Math.max(1, Math.round(w0 * f));
          args.height = Math.max(1, Math.round(h0 * f));
        } else if (scale.mode === "byPx") {
          args.width = Math.max(1, w0 + (scale.dw || 0));
          args.height = Math.max(1, h0 + (scale.dh || 0));
        } else if (scale.mode === "to") {
          args.width = scale.width;
          args.height = scale.height;
        }
        // Keep circles uniform
        if (shape.type === "circle" || shape.type === "ellipse") {
          const side = Math.min(args.width || w0, args.height || h0);
          args.width = side;
          args.height = side;
        }
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
                ? (
                    ((s as any).color || (s as any).fill || "") as string
                  ).toUpperCase() === wantedColor
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
        // center or edge handling if requested
        if (hasCenterWord || edgeTop || edgeBottom || edgeLeft || edgeRight) {
          const cw = context.canvasDimensions?.width ?? 800;
          const ch = context.canvasDimensions?.height ?? 600;
          const theShape = context.shapes.find((s) => s.id === ids[0]);
          const w = theShape?.width || 100;
          const h = theShape?.height || 100;
          let nx = theShape?.x ?? 0;
          let ny = theShape?.y ?? 0;
          if (hasCenterWord) {
            nx = Math.max(0, Math.round((cw - w) / 2));
            ny = Math.max(0, Math.round((ch - h) / 2));
          }
          const margin = 20;
          if (edgeLeft) nx = margin;
          if (edgeRight) nx = Math.max(0, cw - w - margin);
          if (edgeTop) ny = margin;
          if (edgeBottom) ny = Math.max(0, ch - h - margin);
          return [
            {
              tool: "update_shape",
              intentType: "update",
              args: { shapeId: ids[0], x: nx, y: ny },
            },
          ];
        }
        // if scaling phrase with no selection, compute target size now
        const scale = parseScale(t);
        if (scale) {
          const target = context.shapes.find((s) => s.id === ids[0]);
          if (target) {
            const w0 = target.width || 100;
            const h0 = target.height || 100;
            const upd: any = {};
            if (scale.mode === "factor" && scale.factor) {
              upd.width = Math.max(1, Math.round(w0 * scale.factor));
              upd.height = Math.max(1, Math.round(h0 * scale.factor));
            } else if (scale.mode === "byPercent" && scale.percent != null) {
              const f = 1 + scale.percent / 100;
              upd.width = Math.max(1, Math.round(w0 * f));
              upd.height = Math.max(1, Math.round(h0 * f));
            } else if (scale.mode === "byPx") {
              upd.width = Math.max(1, w0 + (scale.dw || 0));
              upd.height = Math.max(1, h0 + (scale.dh || 0));
            } else if (scale.mode === "to") {
              upd.width = scale.width;
              upd.height = scale.height;
            }
            if (target.type === "circle" || target.type === "ellipse") {
              const side = Math.min(upd.width || w0, upd.height || h0);
              upd.width = side;
              upd.height = side;
            }
            return [
              {
                tool: "update_shape",
                intentType: "update",
                args: { shapeId: ids[0], ...upd },
              },
            ];
          }
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
  if (isArrangeRow) {
    if (!context.selectedShapeIds?.length && shapeType) {
      // Select all shapes of inferred type before arranging
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
      if (ids.length >= 2) {
        return [
          {
            tool: "select_many_shapes",
            intentType: "select",
            args: { shapeIds: ids },
          },
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
    }
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

  if (isArrangeCol) {
    if (!context.selectedShapeIds?.length && shapeType) {
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
      if (ids.length >= 2) {
        return [
          {
            tool: "select_many_shapes",
            intentType: "select",
            args: { shapeIds: ids },
          },
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
    }
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
        filterColorRaw || color,
        quotedText
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

  // Define all shape types and their synonyms
  const shapePatterns = [
    {
      pattern: /\bthe\s+(circle|ellipse|oval)\b/,
      types: ["circle", "ellipse"],
      name: "circle",
    },
    {
      pattern: /\bthe\s+(rectangle|rect|square)\b/,
      types: ["rect", "rectangle"],
      name: "rectangle",
    },
    { pattern: /\bthe\s+(triangle)\b/, types: ["triangle"], name: "triangle" },
    { pattern: /\bthe\s+(line)\b/, types: ["line"], name: "line" },
    { pattern: /\bthe\s+(arrow)\b/, types: ["arrow"], name: "arrow" },
    { pattern: /\bthe\s+(text)\b/, types: ["text"], name: "text" },
    {
      pattern: /\bthe\s+(image|img|picture|photo)\b/,
      types: ["image"],
      name: "image",
    },
  ];

  // Check for commands referencing "the <shape>" when multiple exist
  for (const { pattern, types, name } of shapePatterns) {
    if (pattern.test(t)) {
      const count = context.shapes.filter((s) => types.includes(s.type)).length;
      if (count > 1) {
        return `Which ${name}? There are ${count} ${name}s on the canvas. Please select one first or be more specific (e.g., "the red ${name}").`;
      }
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

  // 1) Try planner: segment multi-verb commands and run sequentially
  const parts = segmentCommands(command.text);
  if (parts.length > 1) {
    const actions: AIAction[] = [];
    for (const part of parts) {
      const routedPart = routeIntent(part.text, context);
      if (!routedPart) continue;
      for (const step of routedPart) {
        // Anchor override for create/move
        if (
          (step.tool === "create_shape" || step.tool === "update_shape") &&
          context.canvasDimensions
        ) {
          const a = detectAnchor(part.text);
          if (a) {
            const cw = context.canvasDimensions.width ?? 800;
            const ch = context.canvasDimensions.height ?? 600;
            const w =
              step.args.width ??
              (step.args.radius ? step.args.radius * 2 : 100);
            const h =
              step.args.height ??
              (step.args.radius ? step.args.radius * 2 : 100);
            const { x, y } = anchorXY(a, cw, ch, w, h);
            step.args.x = x;
            step.args.y = y;
          }
        }
        const result = await executeTool(step.tool, step.args, context);
        actions.push({
          type: step.intentType as any,
          params: step.args,
          result: result.success ? "success" : "failed",
          reason: result.error,
        });
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
    }
    return {
      success: actions.length > 0,
      message: actions.length ? "Executed action(s)" : "Nothing to do",
      command: command.text,
      actions,
      executionTime: Date.now() - startTime,
    };
  }

  // 2) Try client-side intent router (deterministic & fast)
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

  // 3) Try LangGraph planner as a fallback orchestrator (if available)
  try {
    const graphResult = await runGraphPlan(command.text, {
      ...context,
      executeTool,
    });
    if (graphResult && graphResult.results && graphResult.results.length) {
      const ok = graphResult.results.every((r) => r.ok);
      return {
        success: ok,
        message: ok ? "Executed planned action(s)" : "Some actions failed",
        command: command.text,
        executionTime: Date.now() - startTime,
      };
    }
  } catch {
    // fall through to normal OpenAI function-calling
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

    // Type for OpenAI tool calls to avoid any[]
    type ToolCall = {
      function?: { name: string; arguments: string };
      function_?: { name: string; arguments: string };
    };

    // Check if the model wants to call functions
    if (message.tool_calls && message.tool_calls.length > 0) {
      const actions: AIAction[] = [];
      const results: AIToolResult[] = [];

      // Execute all tool calls
      for (const toolCall of message.tool_calls as ToolCall[]) {
        // Handle SDK variants where the property may be named 'function' or 'function_'
        const fn =
          (toolCall as any)["function"] || (toolCall as any)["function_"];
        const functionName = fn?.name as string | undefined;
        const functionArgs = fn?.arguments ? JSON.parse(fn.arguments) : {};

        if (!functionName) {
          // Skip unrecognized tool call shapes
          continue;
        }

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
