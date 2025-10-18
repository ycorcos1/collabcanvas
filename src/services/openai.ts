/**
 * OpenAI Service
 *
 * Wrapper for OpenAI API interactions with function calling support
 */

import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import { Tool, AIAgentConfig } from "../types/ai";

// Default configuration
const DEFAULT_CONFIG: Partial<AIAgentConfig> = {
  model: "gpt-4o-mini",
  maxTokens: 1000,
  temperature: 0.2,
  timeout: 5000, // 5 second timeout
};

/**
 * Initialize OpenAI client
 */
let openaiClient: OpenAI | null = null;

export const initializeOpenAI = (apiKey: string): OpenAI => {
  if (!apiKey || !apiKey.startsWith("sk-")) {
    throw new Error(
      "Invalid OpenAI API key. Please check your environment variables."
    );
  }

  openaiClient = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true, // Note: In production, use a serverless proxy
  });

  return openaiClient;
};

/**
 * Get or initialize the OpenAI client
 */
export const getOpenAIClient = (): OpenAI => {
  if (!openaiClient) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file."
      );
    }
    return initializeOpenAI(apiKey);
  }
  return openaiClient;
};

/**
 * Convert our Tool type to OpenAI's ChatCompletionTool format
 */
export const toolToOpenAIFormat = (tool: Tool): ChatCompletionTool => {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  };
};

/**
 * Check if we should use the serverless proxy (production) or direct client (development)
 */
const shouldUseProxy = (): boolean => {
  // Use proxy in production (Vercel) or when explicitly enabled
  return (
    process.env.NODE_ENV === "production" ||
    import.meta.env.VITE_USE_AI_PROXY === "true"
  );
};

/**
 * Get the current user ID from auth context (for rate limiting)
 * In a real implementation, this would get the actual user ID from Firebase Auth
 */
const getUserId = (): string => {
  // This is a placeholder - in production, get from auth context
  // For now, use a session-based identifier
  let userId = sessionStorage.getItem("ai-user-id");
  if (!userId) {
    userId = `user_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("ai-user-id", userId);
  }
  return userId;
};

/**
 * Execute a chat completion via serverless proxy (secure, production)
 */
const executeViaProxy = async (
  messages: ChatCompletionMessageParam[],
  tools: Tool[],
  config: Partial<AIAgentConfig> = {}
): Promise<OpenAI.Chat.Completions.ChatCompletion> => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    const response = await fetch("/api/ai/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        tools: tools.map(toolToOpenAIFormat),
        userId: getUserId(),
        config: {
          model: finalConfig.model,
          maxTokens: finalConfig.maxTokens,
          temperature: finalConfig.temperature,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || "Proxy request failed");
    }

    const result = await response.json();
    return result.data;
  } catch (error: any) {
    throw new Error(`AI Proxy error: ${error.message || "Unknown error"}`);
  }
};

/**
 * Execute a chat completion directly (development only)
 */
const executeDirectly = async (
  messages: ChatCompletionMessageParam[],
  tools: Tool[],
  config: Partial<AIAgentConfig> = {}
): Promise<OpenAI.Chat.Completions.ChatCompletion> => {
  const client = getOpenAIClient();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    const response = await client.chat.completions.create({
      model: finalConfig.model!,
      messages,
      tools: tools.map(toolToOpenAIFormat),
      tool_choice: "auto", // Let the model decide which tools to use
      max_tokens: finalConfig.maxTokens,
      temperature: finalConfig.temperature,
    });

    return response;
  } catch (error: any) {
    // Enhanced error handling
    if (error.code === "insufficient_quota") {
      throw new Error("OpenAI API quota exceeded. Please check your billing.");
    } else if (error.code === "invalid_api_key") {
      throw new Error(
        "Invalid OpenAI API key. Please check your configuration."
      );
    } else if (error.status === 429) {
      throw new Error(
        "Too many requests to OpenAI. Please try again in a moment."
      );
    } else if (error.message?.includes("timeout")) {
      throw new Error("OpenAI request timed out. Please try again.");
    }

    throw new Error(`OpenAI API error: ${error.message || "Unknown error"}`);
  }
};

/**
 * Execute a chat completion with function calling
 */
export const executeCompletion = async (
  messages: ChatCompletionMessageParam[],
  tools: Tool[],
  config: Partial<AIAgentConfig> = {}
): Promise<OpenAI.Chat.Completions.ChatCompletion> => {
  if (shouldUseProxy()) {
    return executeViaProxy(messages, tools, config);
  } else {
    return executeDirectly(messages, tools, config);
  }
};

/**
 * Execute a completion with retry logic
 */
export const executeCompletionWithRetry = async (
  messages: ChatCompletionMessageParam[],
  tools: Tool[],
  config: Partial<AIAgentConfig> = {},
  maxRetries: number = 3
): Promise<OpenAI.Chat.Completions.ChatCompletion> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await executeCompletion(messages, tools, config);
    } catch (error: any) {
      lastError = error;

      // Don't retry on certain errors
      if (
        error.message?.includes("quota") ||
        error.message?.includes("invalid_api_key") ||
        error.message?.includes("API key")
      ) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Failed to execute completion after retries");
};

/**
 * Check if the OpenAI API is properly configured
 */
export const isOpenAIConfigured = (): boolean => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const enabled = import.meta.env.VITE_ENABLE_AI_AGENT;

  return !!(apiKey && apiKey.startsWith("sk-") && enabled === "true");
};

/**
 * Validate an API key format (doesn't check if it's active)
 */
export const validateApiKey = (apiKey: string): boolean => {
  return (
    typeof apiKey === "string" && apiKey.startsWith("sk-") && apiKey.length > 20
  );
};
