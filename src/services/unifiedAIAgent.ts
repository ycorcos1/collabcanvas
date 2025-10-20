/**
 * Unified AI Agent
 *
 * Combines canvas manipulation and dashboard management into a single AI agent
 * Routes commands to appropriate tool sets based on command intent
 */

import { AICommand, AIResponse, AICommandContext } from "../types/ai";
import { processCommand as processCanvasCommand } from "./aiAgent";
import {
  processDashboardCommand,
  DashboardAIContext,
} from "./dashboardAIAgent";
import { detectCommandType } from "./unifiedAITools";

/**
 * Extended context that includes both canvas and dashboard capabilities
 */
export interface UnifiedAIContext extends AICommandContext {
  // Dashboard context (optional)
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
 * Process a unified AI command
 * Intelligently routes to canvas or dashboard tools based on command intent
 */
export async function processUnifiedCommand(
  command: AICommand,
  context: UnifiedAIContext
): Promise<AIResponse> {
  const startTime = Date.now();

  // Detect command type
  const commandType = detectCommandType(command.text);

  // If dashboard command and dashboard actions available, use dashboard agent
  if (
    commandType === "dashboard" &&
    context.dashboardActions &&
    context.navigate
  ) {
    try {
      const dashboardContext: DashboardAIContext = {
        user: {
          id: context.user.id,
          email: "", // Email not available in canvas user context
          displayName: context.user.name || "User",
        },
        navigate: context.navigate,
        dashboardActions: {
          ...context.dashboardActions,
          // Stub functions for save/load project (not used in unified context)
          saveProject: async () => false,
          loadProject: async () => null,
        } as any,
      };

      return await processDashboardCommand(command, dashboardContext);
    } catch (error: any) {
      console.error("Dashboard command error:", error);
      return {
        success: false,
        message: `Failed to execute dashboard command: ${error.message}`,
        error: error.message,
        command: command.text,
        executionTime: Date.now() - startTime,
      };
    }
  }

  // Otherwise, use canvas agent (default)
  try {
    return await processCanvasCommand(command, context);
  } catch (error: any) {
    console.error("Canvas command error:", error);
    return {
      success: false,
      message: `Failed to execute command: ${error.message}`,
      error: error.message,
      command: command.text,
      executionTime: Date.now() - startTime,
    };
  }
}
