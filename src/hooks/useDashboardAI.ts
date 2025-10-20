/**
 * Dashboard AI Hook
 *
 * Provides AI command execution for dashboard-level actions
 * Separate from canvas AI agent for different context and capabilities
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/Auth/AuthProvider";
import { useProjectManagement } from "./useProjectManagement";
import { processDashboardCommand } from "../services/dashboardAIAgent";
import {
  searchProjectsByName,
  getTrashedProjects,
  batchDeleteProjects,
} from "../services/projects";
import { sendCollaborationInvitation } from "../services/collaboration";
import type { AIResponse } from "../types/ai";

interface UseDashboardAIResult {
  /** Execute a dashboard AI command */
  executeCommand: (command: string) => Promise<AIResponse>;
  /** Whether AI is currently processing */
  isProcessing: boolean;
  /** Whether AI is enabled */
  isEnabled: boolean;
  /** Last error if any */
  error: string | null;
}

/**
 * useDashboardAI - Hook for dashboard-level AI commands
 */
export const useDashboardAI = (): UseDashboardAIResult => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createProject, saveProject, loadProject, deleteProject } =
    useProjectManagement();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if AI is enabled
  const isEnabled =
    import.meta.env.VITE_ENABLE_AI_AGENT === "true" &&
    !!import.meta.env.VITE_OPENAI_API_KEY;

  /**
   * Execute a dashboard command
   */
  const executeCommand = useCallback(
    async (command: string): Promise<AIResponse> => {
      if (!user) {
        const errorResponse: AIResponse = {
          success: false,
          message: "You must be signed in to use the AI assistant",
          command,
          executionTime: 0,
        };
        setError(errorResponse.message);
        return errorResponse;
      }

      if (!isEnabled) {
        const errorResponse: AIResponse = {
          success: false,
          message: "AI assistant is not enabled",
          command,
          executionTime: 0,
        };
        setError(errorResponse.message);
        return errorResponse;
      }

      setIsProcessing(true);
      setError(null);

      try {
        // Create dashboard context with robust navigate wrapper
        const context = {
          user: {
            id: user.id,
            email: user.email || "",
            displayName: user.displayName || user.email || "User",
          },
          navigate: (path: string) => {
            // Use setTimeout to ensure navigation happens after current execution context
            setTimeout(() => {
              try {
                // Check if navigate function is still valid
                if (typeof navigate === "function") {
                  navigate(path);
                } else {
                  // Fallback to window.location
                  window.location.href = path;
                }
              } catch (error) {
                console.error("Navigation error:", error);
                // Ultimate fallback: use window.location
                window.location.href = path;
              }
            }, 0);
          },
          dashboardActions: {
            createProject,
            saveProject,
            loadProject,
            deleteProject,

            // NEW ACTIONS:
            searchProjects: async (query: string) => {
              return await searchProjectsByName(user.id, query);
            },

            getTrashedProjects: async () => {
              return await getTrashedProjects(user.id);
            },

            batchDeleteProjects: async (projectIds: string[]) => {
              await batchDeleteProjects(projectIds);
            },

            sendCollaborationRequest: async (
              projectId: string,
              projectName: string,
              recipientEmail: string,
              message?: string
            ) => {
              await sendCollaborationInvitation(
                projectId,
                projectName,
                user.id,
                user.displayName || user.email || "User",
                recipientEmail,
                message
              );
            },
          },
        };

        // Process command through dashboard AI agent
        const response = await processDashboardCommand(
          { text: command, timestamp: Date.now() },
          context
        );

        if (!response.success && response.error) {
          setError(response.error);
        }

        return response;
      } catch (err: any) {
        const errorMessage = err.message || "An unexpected error occurred";
        setError(errorMessage);

        return {
          success: false,
          message: errorMessage,
          command,
          error: errorMessage,
          executionTime: 0,
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [
      user,
      isEnabled,
      navigate,
      createProject,
      saveProject,
      loadProject,
      deleteProject,
    ]
  );

  return {
    executeCommand,
    isProcessing,
    isEnabled,
    error,
  };
};
