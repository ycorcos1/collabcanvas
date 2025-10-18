/**
 * useAIAgent Hook
 *
 * React hook for managing AI agent state and executing commands
 */

import { useState, useCallback, useRef } from "react";
import { processCommand } from "../services/aiAgent";
import { isOpenAIConfigured } from "../services/openai";
import {
  AICommand,
  AIResponse,
  AIAgentState,
  AICommandContext,
} from "../types/ai";

interface UseAIAgentOptions {
  /** Maximum commands per hour (rate limiting) */
  maxCommandsPerHour?: number;
  /** Optional scope ID to isolate state per project (e.g., projectId) */
  scopeId?: string;
  /** Callback when a command is successfully executed */
  onSuccess?: (response: AIResponse) => void;
  /** Callback when a command fails */
  onError?: (error: string) => void;
}

interface UseAIAgentReturn extends AIAgentState {
  /** Execute an AI command */
  executeCommand: (
    text: string,
    context: AICommandContext
  ) => Promise<AIResponse>;
  /** Whether the AI agent is enabled and configured */
  isEnabled: boolean;
  /** Clear command history */
  clearHistory: () => void;
  /** Get command count for the current hour */
  getCommandCount: () => number;
}

/**
 * Hook for AI agent functionality
 */
export const useAIAgent = (
  options: UseAIAgentOptions = {}
): UseAIAgentReturn => {
  const { maxCommandsPerHour = 50, scopeId, onSuccess, onError } = options;

  // State
  const [state, setState] = useState<AIAgentState>({
    isProcessing: false,
    history: [],
  });

  // Track command timestamps for rate limiting (per scope)
  const commandTimestamps = useRef<number[]>([]);
  const lastScopeId = useRef<string | undefined>(undefined);

  // Reset state when scope changes (project isolation)
  if (lastScopeId.current !== scopeId) {
    lastScopeId.current = scopeId;
    commandTimestamps.current = [];
    // Reset agent state history for new scope
    state.history = [];
  }

  /**
   * Check if AI agent is properly configured
   */
  const isEnabled = isOpenAIConfigured();

  /**
   * Get number of commands executed in the last hour
   */
  const getCommandCount = useCallback((): number => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    // Filter out timestamps older than 1 hour
    commandTimestamps.current = commandTimestamps.current.filter(
      (timestamp) => timestamp > oneHourAgo
    );
    return commandTimestamps.current.length;
  }, []);

  /**
   * Check if rate limit is exceeded
   */
  const isRateLimited = useCallback((): boolean => {
    return getCommandCount() >= maxCommandsPerHour;
  }, [getCommandCount, maxCommandsPerHour]);

  /**
   * Execute an AI command
   */
  const executeCommand = useCallback(
    async (text: string, context: AICommandContext): Promise<AIResponse> => {
      // Validate input
      if (!text || text.trim().length === 0) {
        const errorResponse: AIResponse = {
          success: false,
          message: "Please enter a command",
          error: "Empty command",
          command: text,
        };
        setState((prev) => ({ ...prev, lastResponse: errorResponse }));
        return errorResponse;
      }

      // Check if enabled
      if (!isEnabled) {
        const errorResponse: AIResponse = {
          success: false,
          message:
            "AI agent is not enabled. Please configure your OpenAI API key.",
          error: "AI agent not configured",
          command: text,
        };
        setState((prev) => ({ ...prev, lastResponse: errorResponse }));
        if (onError) onError(errorResponse.error!);
        return errorResponse;
      }

      // Check rate limit
      if (isRateLimited()) {
        const errorResponse: AIResponse = {
          success: false,
          message: `Rate limit exceeded. Please wait before sending more commands. (${maxCommandsPerHour} commands per hour)`,
          error: "Rate limit exceeded",
          command: text,
        };
        setState((prev) => ({ ...prev, lastResponse: errorResponse }));
        if (onError) onError(errorResponse.error!);
        return errorResponse;
      }

      // Update state to processing
      setState((prev) => ({
        ...prev,
        isProcessing: true,
        currentCommand: text,
        error: undefined,
      }));

      try {
        // Create command object
        const command: AICommand = {
          text,
          timestamp: Date.now(),
          context: {
            selectedShapeIds: context.selectedShapeIds,
            shapes: context.shapes,
            canvasSize: context.canvasDimensions,
          },
        };

        // Process the command
        const response = await processCommand(command, context);

        // Track command timestamp for rate limiting
        commandTimestamps.current.push(Date.now());

        // Update state with response
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          currentCommand: undefined,
          lastResponse: response,
          history: [...prev.history, command],
        }));

        // Call callbacks
        if (response.success && onSuccess) {
          onSuccess(response);
        } else if (!response.success && onError) {
          onError(response.error || "Command failed");
        }

        return response;
      } catch (error: any) {
        const errorResponse: AIResponse = {
          success: false,
          message: "An error occurred while processing your command",
          error: error.message || "Unknown error",
          command: text,
        };

        setState((prev) => ({
          ...prev,
          isProcessing: false,
          currentCommand: undefined,
          lastResponse: errorResponse,
          error: error.message,
        }));

        if (onError) onError(error.message);

        return errorResponse;
      }
    },
    [isEnabled, isRateLimited, maxCommandsPerHour, onSuccess, onError]
  );

  /**
   * Clear command history
   */
  const clearHistory = useCallback(() => {
    setState((prev) => ({
      ...prev,
      history: [],
    }));
  }, []);

  return {
    ...state,
    isEnabled,
    executeCommand,
    clearHistory,
    getCommandCount,
  };
};
