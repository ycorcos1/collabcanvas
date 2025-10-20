/**
 * Dashboard AI Agent Service
 *
 * Handles AI commands for dashboard-level actions
 * Separate from canvas AI agent with different tools and context
 */

import { executeCompletionWithRetry } from "./openai";
import type { AICommand, AIResponse } from "../types/ai";
import { getDashboardTools } from "./dashboardAITools";

/**
 * Dashboard AI Context
 */
export interface DashboardAIContext {
  user: {
    id: string;
    email: string;
    displayName: string;
  };
  navigate: (path: string) => void;
  dashboardActions: {
    createProject: (data: any) => Promise<any>;
    saveProject: (id: string, data: any) => Promise<boolean>;
    loadProject: (id: string) => Promise<any>;
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
}

/**
 * System prompt for dashboard AI agent
 */
const DASHBOARD_AI_PROMPT = `You are a helpful AI assistant for a collaborative design platform dashboard.

AVAILABLE ACTIONS:
- **Create projects** with custom names
- **Navigate** to different sections (recent, shared, all, trash, settings)
- **Delete projects** (move to trash with confirmation)
- **Empty trash** (permanently delete ALL trashed projects - strong confirmation required)
- **Send collaboration invitations** by email
- **Change settings** (theme, appearance)
- **Search and help** users find what they need

CONVERSATIONAL FLOW - Ask for missing information naturally:
• "Can you send an invitation?" 
  → "Sure! Which project would you like to share, and what's the recipient's email address?"
  
• "Delete my project"
  → "Which project would you like to delete?"
  
• "Share my website"
  → "I can help with that! What's the email address of the person you want to invite?"

SAFETY RULES - Destructive Actions:
• **Delete project**: ALWAYS ask for confirmation first
• **Empty trash**: Require EXPLICIT "Yes, empty my trash" confirmation
• Use ⚠️ and 🚨 symbols for warnings
• Never assume - wait for clear user confirmation

SMART BEHAVIOR:
• If project name is ambiguous (multiple matches), list them and ask which one
• If email format is invalid, tell user and ask for correct email
• For "already exists" errors, explain clearly what's already there
• Always confirm successful actions with ✅

COMMAND EXAMPLES:
✅ Creation:
- "Create a project called Mobile App Redesign"
- "Make a new project named Landing Page"

✅ Deletion:
- "Delete the project called Old Design"
- "Move Test Project to trash"
- "Empty my trash" (requires strong confirmation!)

✅ Collaboration:
- "Send an invitation for Homepage to john@example.com"
- "Invite sarah@company.com to my Landing Page project"
- "Share Mobile App with the team" (will ask for email)
- "Can you send an invitation?" (will ask for project and email)

✅ Navigation:
- "Go to all projects"
- "Show me recent projects"
- "Take me to settings"

✅ Settings:
- "Switch to dark mode"
- "Change to light theme"

RESPONSE STYLE:
- Destructive actions: Use strong warnings with ⚠️ 🚨
- Success: Use ✅ and be encouraging
- Errors: Be helpful and suggest what to do next
- Multi-step: Ask ONE clarifying question at a time
- Be conversational, friendly, and professional`;

/**
 * Process a dashboard AI command
 */
export const processDashboardCommand = async (
  command: AICommand,
  context: DashboardAIContext
): Promise<AIResponse> => {
  const startTime = Date.now();

  try {
    // Get available tools
    const tools = getDashboardTools(context);

    if (tools.length === 0) {
      return {
        success: false,
        message: "Dashboard AI is not properly configured",
        command: command.text,
        error: "No tools available",
        executionTime: Date.now() - startTime,
      };
    }

    // Simple intent routing for common commands
    const text = command.text.toLowerCase();

    // Navigation commands (instant, no AI needed)
    if (
      /\b(go to|show me|navigate to|open)\s+(recent|shared|all projects?|trash|settings)\b/.test(
        text
      )
    ) {
      let path = "/dashboard/recent";
      if (/recent/.test(text)) path = "/dashboard/recent";
      else if (/shared/.test(text)) path = "/dashboard/shared";
      else if (/all/.test(text)) path = "/dashboard/all";
      else if (/trash/.test(text)) path = "/dashboard/trash";
      else if (/settings?/.test(text)) path = "/dashboard/settings";

      try {
        context.navigate(path);
        const section = path.split("/").pop();
        return {
          success: true,
          message: `Navigated to ${section}`,
          command: command.text,
          executionTime: Date.now() - startTime,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Navigation failed: ${error.message}. Please try again.`,
          command: command.text,
          error: error.message,
          executionTime: Date.now() - startTime,
        };
      }
    }

    // Help/info commands
    if (/\b(help|what can you|how do i|show me what)\b/.test(text)) {
      return {
        success: true,
        message: `I can help you with:
• Creating projects: "Create a project called [name]"
• Opening projects: "Open my most recent project"
• Navigation: "Go to settings" or "Show me all projects"
• Searching: "Find projects with 'login'"
• Deleting: "Delete the project called [name]"

What would you like to do?`,
        command: command.text,
        executionTime: Date.now() - startTime,
      };
    }

    // Prepare messages for OpenAI
    const messages: any[] = [
      {
        role: "system",
        content: DASHBOARD_AI_PROMPT,
      },
      {
        role: "user",
        content: command.text,
      },
    ];

    // Call OpenAI with function calling (tools will be converted internally)
    const completion = await executeCompletionWithRetry(messages, tools as any);

    const responseMessage = completion.choices[0]?.message;

    if (!responseMessage) {
      throw new Error("No response from AI");
    }

    // Check for tool calls
    const toolCalls = responseMessage.tool_calls || [];

    if (toolCalls.length === 0) {
      // No tool call, return text response
      return {
        success: true,
        message:
          responseMessage.content || "I'm not sure how to help with that.",
        command: command.text,
        executionTime: Date.now() - startTime,
      };
    }

    // Execute tool calls
    const results: string[] = [];

    for (const toolCall of toolCalls) {
      const functionName =
        (toolCall as any).function?.name || (toolCall as any).function_?.name;
      const functionArgs =
        (toolCall as any).function?.arguments ||
        (toolCall as any).function_?.arguments;

      if (!functionName) continue;

      const tool = tools.find((t) => t.name === functionName);
      if (!tool) {
        results.push(`Tool ${functionName} not found`);
        continue;
      }

      let args: any = {};
      try {
        args =
          typeof functionArgs === "string"
            ? JSON.parse(functionArgs)
            : functionArgs;
      } catch (parseError) {
        results.push(`Failed to parse arguments for ${functionName}`);
        continue;
      }

      // Execute tool
      try {
        const result = await tool.execute(args, context);
        results.push(result.message || `Executed ${functionName}`);

        if (!result.success) {
          return {
            success: false,
            message: result.message || `Failed to execute ${functionName}`,
            command: command.text,
            error: result.error,
            executionTime: Date.now() - startTime,
          };
        }
      } catch (toolError: any) {
        results.push(`Error executing ${functionName}: ${toolError.message}`);
      }
    }

    return {
      success: true,
      message: results.join("\n") || "Action completed",
      command: command.text,
      executionTime: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "An error occurred processing your command",
      command: command.text,
      error: error.message,
      executionTime: Date.now() - startTime,
    };
  }
};
