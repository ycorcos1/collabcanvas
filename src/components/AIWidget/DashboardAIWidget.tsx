/**
 * Dashboard AI Widget
 *
 * Floating AI assistant for dashboard-wide control
 * Features:
 * - Bottom-right floating position
 * - Minimize/maximize functionality
 * - Persistent state (localStorage)
 * - Keyboard shortcut (Cmd/Ctrl+K)
 * - Dashboard-specific AI commands
 */

import React, { useState, useEffect, useCallback } from "react";
import { AIChat, ChatMessage } from "../AIChat/AIChat";
import { useDashboardAI } from "../../hooks/useDashboardAI";
import "./DashboardAIWidget.css";

interface DashboardAIWidgetProps {
  /** Whether the widget is open */
  isOpen?: boolean;
  /** Callback when widget open state changes */
  onToggle?: (isOpen: boolean) => void;
}

/**
 * DashboardAIWidget - Floating AI assistant for dashboard
 */
export const DashboardAIWidget: React.FC<DashboardAIWidgetProps> = ({
  isOpen: controlledIsOpen,
  onToggle,
}) => {
  // State management
  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorage.getItem("dashboard-ai-minimized");
    return saved === "true";
  });

  const [internalIsOpen, setInternalIsOpen] = useState(() => {
    const saved = localStorage.getItem("dashboard-ai-open");
    return saved === "true";
  });

  // Use controlled or internal state
  const isOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Dashboard AI hook
  const { executeCommand, isProcessing, isEnabled } = useDashboardAI();

  // Persist minimized state
  useEffect(() => {
    localStorage.setItem("dashboard-ai-minimized", String(isMinimized));
  }, [isMinimized]);

  // Persist open state (if not controlled)
  useEffect(() => {
    if (controlledIsOpen === undefined) {
      localStorage.setItem("dashboard-ai-open", String(internalIsOpen));
    }
  }, [internalIsOpen, controlledIsOpen]);

  // Handle open/close
  const handleToggle = useCallback(() => {
    const newState = !isOpen;
    if (onToggle) {
      onToggle(newState);
    } else {
      setInternalIsOpen(newState);
    }
  }, [isOpen, onToggle]);

  // Handle minimize/maximize
  const handleMinimize = useCallback(() => {
    setIsMinimized(!isMinimized);
  }, [isMinimized]);

  // Handle sending message
  const handleSendMessage = useCallback(
    async (messageText: string) => {
      // Add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: messageText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Add processing message
      const processingId = `ai-${Date.now()}`;
      const processingMessage: ChatMessage = {
        id: processingId,
        role: "ai",
        content: "Processing...",
        timestamp: Date.now(),
        status: "processing",
      };

      setMessages((prev) => [...prev, processingMessage]);

      try {
        // Execute command
        const response = await executeCommand(messageText);

        // Update with actual response
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === processingId
              ? {
                  ...msg,
                  content: response.message || "Done!",
                  status: response.success ? "success" : "error",
                }
              : msg
          )
        );

        // NEW: If response includes refresh trigger, schedule it
        if (response.success && response.data?._triggerRefresh) {
          setTimeout(() => {
            console.log("Dashboard AI: Refreshing to show new content");
            window.location.reload();
          }, 2000); // 2 seconds - enough time to see the success message
        }
      } catch (error: any) {
        // Update with error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === processingId
              ? {
                  ...msg,
                  content: error.message || "An error occurred",
                  status: "error",
                }
              : msg
          )
        );
      }
    },
    [executeCommand]
  );

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        handleToggle();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleToggle]);

  // Don't render if not open
  if (!isOpen) {
    return (
      <button
        className="dashboard-ai-fab"
        onClick={handleToggle}
        aria-label="Open AI Assistant"
        title="AI Assistant (⌘K)"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" />
        </svg>
      </button>
    );
  }

  return (
    <div
      className={`dashboard-ai-widget ${isMinimized ? "minimized" : ""}`}
      style={{ zIndex: 9999 }}
    >
      {/* Widget Header */}
      <div className="dashboard-ai-header">
        <div className="dashboard-ai-header-left">
          <div className="dashboard-ai-header-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" />
            </svg>
          </div>
          <h3 className="dashboard-ai-header-title">AI Assistant</h3>
          {!isEnabled && (
            <span className="dashboard-ai-header-badge disabled">Disabled</span>
          )}
        </div>

        <div className="dashboard-ai-header-actions">
          <button
            className="dashboard-ai-header-button"
            onClick={handleMinimize}
            aria-label={isMinimized ? "Maximize" : "Minimize"}
            title={isMinimized ? "Maximize" : "Minimize"}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {isMinimized ? (
                <polyline points="4 14 10 14 10 20" />
              ) : (
                <polyline points="4 14 10 14 10 8" />
              )}
            </svg>
          </button>

          <button
            className="dashboard-ai-header-button"
            onClick={handleToggle}
            aria-label="Close AI Assistant"
            title="Close (⌘K)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Widget Body */}
      {!isMinimized && (
        <div className="dashboard-ai-body">
          <AIChat
            messages={messages}
            isProcessing={isProcessing}
            onSendMessage={handleSendMessage}
            isEnabled={isEnabled}
          />
        </div>
      )}

      {/* Minimized hint */}
      {isMinimized && (
        <div className="dashboard-ai-minimized-hint">
          <p>Click to expand or press ⌘K</p>
        </div>
      )}
    </div>
  );
};
