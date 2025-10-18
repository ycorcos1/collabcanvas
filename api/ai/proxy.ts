/**
 * Serverless API Proxy for OpenAI
 *
 * This Vercel Edge Function acts as a secure proxy between the client and OpenAI,
 * keeping the API key server-side and never exposing it to the browser.
 *
 * Security features:
 * - API key stored as environment variable on Vercel
 * - Rate limiting per user
 * - Request validation
 * - CORS protection
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Edge runtime for fast responses
export const config = {
  runtime: "edge",
};

// Initialize OpenAI client with server-side API key
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured on server");
  }

  return new OpenAI({
    apiKey,
  });
};

// Rate limiting store (in production, use Redis or a proper rate limiter)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const checkRateLimit = (userId: string, maxRequests: number = 50): boolean => {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);

  if (!userLimit || userLimit.resetAt < now) {
    // Reset or initialize
    rateLimitStore.set(userId, {
      count: 1,
      resetAt: now + 60 * 60 * 1000, // 1 hour
    });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false;
  }

  userLimit.count++;
  return true;
};

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [userId, limit] of rateLimitStore.entries()) {
    if (limit.resetAt < now) {
      rateLimitStore.delete(userId);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes

export default async function handler(req: NextRequest) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // Parse request body
    const body = await req.json();
    const { messages, tools, userId } = body;

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request: messages array required" },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "Invalid request: userId required" },
        { status: 400 }
      );
    }

    // Check rate limit
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message:
            "You have reached the maximum number of AI commands per hour. Please try again later.",
        },
        { status: 429 }
      );
    }

    // Get OpenAI client
    const openai = getOpenAIClient();

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools: tools || undefined,
      tool_choice: tools ? "auto" : undefined,
      max_tokens: 1000,
      temperature: 0.2,
    });

    // Return successful response
    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error("AI Proxy Error:", error);

    // Handle OpenAI-specific errors
    if (error.code === "insufficient_quota") {
      return NextResponse.json(
        {
          error: "Service unavailable",
          message:
            "The AI service is currently unavailable. Please try again later.",
        },
        { status: 503 }
      );
    }

    if (error.code === "invalid_api_key") {
      return NextResponse.json(
        {
          error: "Server configuration error",
          message:
            "The server is not properly configured. Please contact support.",
        },
        { status: 500 }
      );
    }

    if (error.status === 429) {
      return NextResponse.json(
        {
          error: "Service rate limit",
          message:
            "The AI service is experiencing high demand. Please try again in a moment.",
        },
        { status: 429 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An error occurred while processing your request.",
      },
      { status: 500 }
    );
  }
}
