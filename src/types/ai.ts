/**
 * AI Agent Type Definitions
 *
 * Types for natural language canvas manipulation using OpenAI function calling
 */

import { Shape } from "./shape";

/**
 * Command sent to the AI agent
 */
export interface AICommand {
  /** The natural language command from the user */
  text: string;
  /** Timestamp when the command was issued */
  timestamp: number;
  /** Optional context about the current canvas state */
  context?: {
    selectedShapeIds?: string[];
    shapes?: Shape[];
    canvasSize?: { width: number; height: number };
  };
}

/**
 * Response from the AI agent
 */
export interface AIResponse {
  /** Whether the command was executed successfully */
  success: boolean;
  /** Human-readable message about what happened */
  message: string;
  /** Optional error details if the command failed */
  error?: string;
  /** The original command that was processed */
  command: string;
  /** Execution time in milliseconds */
  executionTime?: number;
  /** Actions that were taken */
  actions?: AIAction[];
}

/**
 * Action performed by the AI agent
 */
export interface AIAction {
  /** Type of action */
  type:
    | "create"
    | "update"
    | "delete"
    | "select"
    | "duplicate"
    | "rotate"
    | "align"
    | "distribute";
  /** Target shape ID (if applicable) */
  shapeId?: string;
  /** Parameters used for the action */
  params?: Record<string, any>;
  /** Result of the action */
  result?: "success" | "failed" | "skipped";
  /** Reason if failed or skipped */
  reason?: string;
}

/**
 * Tool call request from OpenAI
 */
export interface ToolCall {
  /** Unique ID for this tool call */
  id: string;
  /** Name of the tool to execute */
  name: string;
  /** Arguments for the tool (JSON string from OpenAI) */
  arguments: string;
}

/**
 * Tool definition for OpenAI function calling
 */
export interface Tool {
  /** Tool name */
  name: string;
  /** Description for the AI model */
  description: string;
  /** JSON Schema for parameters */
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
  /** The actual function to execute */
  execute: (params: any, context: AICommandContext) => Promise<AIToolResult>;
}

/**
 * Context provided to tool execution functions
 */
export interface AICommandContext {
  /** Current shapes on the canvas */
  shapes: Shape[];
  /** Currently selected shape IDs */
  selectedShapeIds: string[];
  /** Canvas dimensions */
  canvasDimensions: { width: number; height: number };
  /** Functions from useShapes hook */
  shapeActions: {
    createShape: (shape: Partial<Shape>) => void;
    updateShape: (id: string, updates: Partial<Shape>) => void;
    deleteShape: (id: string) => void;
    selectShape: (id: string | null) => void;
    deleteSelectedShapes: () => void;
  };
  /** Current user info */
  user: {
    id: string;
    name: string;
    color: string;
  };
}

/**
 * Result from a tool execution
 */
export interface AIToolResult {
  /** Whether the tool executed successfully */
  success: boolean;
  /** Message about what happened */
  message: string;
  /** Optional error details */
  error?: string;
  /** Data returned by the tool (e.g., created shape ID) */
  data?: any;
}

/**
 * Configuration for the AI agent
 */
export interface AIAgentConfig {
  /** OpenAI API key */
  apiKey: string;
  /** Model to use (default: gpt-4o-mini) */
  model?: string;
  /** Maximum tokens per request */
  maxTokens?: number;
  /** Temperature (0-2, lower is more deterministic) */
  temperature?: number;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * State of the AI agent
 */
export interface AIAgentState {
  /** Whether the agent is currently processing a command */
  isProcessing: boolean;
  /** Current command being processed */
  currentCommand?: string;
  /** Last response from the agent */
  lastResponse?: AIResponse;
  /** Command history (for context and undo) */
  history: AICommand[];
  /** Error state */
  error?: string;
}

