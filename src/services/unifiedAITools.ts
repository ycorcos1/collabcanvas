/**
 * Unified AI Tools
 *
 * Combines canvas manipulation tools with dashboard management tools
 * for a unified AI experience on the project/canvas page
 */

import { Tool } from "../types/ai";
import { getBasicTools } from "./aiTools";
import { DashboardAITool } from "./dashboardAITools";

/**
 * Extended context that includes both canvas and dashboard capabilities
 */
export interface UnifiedAIContext {
  // Canvas context
  shapes: any[];
  selectedShapeIds: string[];
  canvasDimensions: { width: number; height: number };
  shapeActions: {
    createShape: (shape: any) => void;
    updateShape: (id: string, updates: any) => void;
    deleteShape: (id: string) => void;
    selectShape: (id: string | null) => void;
    deleteSelectedShapes: () => void;
  };
  user: {
    id: string;
    name: string;
    color: string;
  };

  // Dashboard context (optional - only available on project page)
  dashboardActions?: {
    createProject: (data: any) => Promise<any>;
    deleteProject: (id: string) => Promise<boolean>;
    searchProjects: (query: string) => Promise<any[]>;
    getTrashedProjects: () => Promise<any[]>;
    batchDeleteProjects: (projectIds: string[]) => Promise<void>;
    sendCollaborationRequest: (
      projectId: string,
      projectName: string,
      recipientEmail: string,
      message?: string
    ) => Promise<void>;
  };
  navigate?: (path: string) => void;
  currentProject?: {
    id: string;
    name: string;
    ownerId: string;
  };
}

/**
 * Convert DashboardAITool to standard Tool format
 */
function convertDashboardToolToStandard(dashboardTool: DashboardAITool): Tool {
  return {
    name: dashboardTool.name,
    description: dashboardTool.description,
    parameters: dashboardTool.parameters as any,
    execute: async (params: any, context: any) => {
      // Create dashboard context from unified context
      const dashboardContext = {
        user: {
          id: context.user.id,
          email: context.user.email || "",
          displayName: context.user.name || "User",
        },
        navigate: context.navigate || (() => {}),
        dashboardActions: context.dashboardActions || {},
      };

      return await dashboardTool.execute(params, dashboardContext as any);
    },
  };
}

/**
 * Get all available tools for unified AI agent
 * Includes both canvas manipulation and project management tools
 */
export function getUnifiedTools(
  _context: UnifiedAIContext, // Reserved for future context-aware tool filtering
  dashboardTools: DashboardAITool[] = []
): Tool[] {
  // Get canvas tools
  const canvasTools = getBasicTools();

  // Convert and add dashboard tools if available
  const convertedDashboardTools = dashboardTools.map(
    convertDashboardToolToStandard
  );

  // Combine all tools
  return [...canvasTools, ...convertedDashboardTools];
}

/**
 * Detect if command is dashboard-related or canvas-related
 */
export function detectCommandType(
  command: string
): "canvas" | "dashboard" | "mixed" {
  const lowerCommand = command.toLowerCase();

  // Dashboard keywords
  const dashboardKeywords = [
    "create project",
    "delete project",
    "empty trash",
    "send invitation",
    "invite",
    "share project",
    "go to",
    "navigate",
    "switch theme",
    "dark mode",
    "light mode",
  ];

  // Canvas keywords
  const canvasKeywords = [
    "create shape",
    "create circle",
    "create rectangle",
    "create text",
    "move",
    "resize",
    "delete shape",
    "change color",
    "rotate",
    "align",
    "distribute",
    "duplicate",
    "clear canvas",
  ];

  const hasDashboard = dashboardKeywords.some((keyword) =>
    lowerCommand.includes(keyword)
  );
  const hasCanvas = canvasKeywords.some((keyword) =>
    lowerCommand.includes(keyword)
  );

  if (hasDashboard && hasCanvas) return "mixed";
  if (hasDashboard) return "dashboard";
  return "canvas"; // Default to canvas
}
