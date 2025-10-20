/**
 * AI Chat Component
 *
 * Chat interface for interacting with the AI agent
 * Displays conversation history in chat bubble format
 */

import React, { useState, useRef, useEffect } from "react";
import "./AIChat.css";

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: number;
  status?: "success" | "error" | "processing";
}

interface AIChatProps {
  /** Chat message history */
  messages: ChatMessage[];
  /** Whether AI is currently processing */
  isProcessing: boolean;
  /** Callback when user submits a message */
  onSendMessage: (message: string) => void;
  /** Whether AI is enabled */
  isEnabled?: boolean;
}

/**
 * AIChat - Chat interface for AI agent interaction
 */
export const AIChat: React.FC<AIChatProps> = ({
  messages,
  isProcessing,
  onSendMessage,
  isEnabled = true,
}) => {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing || !isEnabled) return;

    onSendMessage(inputValue.trim());
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (!isEnabled) {
    return (
      <div className="ai-chat-disabled">
        <div className="ai-chat-disabled-icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <p className="ai-chat-disabled-title">AI Assistant Not Available</p>
        <p className="ai-chat-disabled-text">
          AI features are currently disabled. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="ai-chat-container">
      {/* Chat Messages */}
      <div className="ai-chat-messages" ref={chatContainerRef}>
        {messages.length === 0 ? (
          <div className="ai-chat-empty">
            <div className="ai-chat-empty-icon">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3 className="ai-chat-empty-title">AI Assistant</h3>
            <p className="ai-chat-empty-text">
              Ask me to help with your canvas. I can create shapes, modify
              objects, and more!
            </p>
            <div className="ai-chat-examples">
              <p className="ai-chat-examples-title">Try asking:</p>
              <button
                className="ai-chat-example"
                onClick={() =>
                  setInputValue("Create a red rectangle at 200, 200")
                }
              >
                Create a red rectangle at 200, 200
              </button>
              <button
                className="ai-chat-example"
                onClick={() => setInputValue("Make all circles blue")}
              >
                Make all circles blue
              </button>
              <button
                className="ai-chat-example"
                onClick={() => setInputValue("Delete the selected shape")}
              >
                Delete the selected shape
              </button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`ai-chat-message ${message.role}`}
              >
                <div className="ai-chat-message-bubble">
                  <div className="ai-chat-message-content">
                    {message.content}
                  </div>
                  <div className="ai-chat-message-meta">
                    <span className="ai-chat-message-time">
                      {formatTime(message.timestamp)}
                    </span>
                    {message.status === "error" && (
                      <span className="ai-chat-message-status error">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line
                            x1="12"
                            y1="8"
                            x2="12"
                            y2="12"
                            stroke="white"
                            strokeWidth="2"
                          />
                          <line
                            x1="12"
                            y1="16"
                            x2="12.01"
                            y2="16"
                            stroke="white"
                            strokeWidth="2"
                          />
                        </svg>
                      </span>
                    )}
                    {message.status === "success" && message.role === "ai" && (
                      <span className="ai-chat-message-status success">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="ai-chat-message ai processing">
                <div className="ai-chat-message-bubble">
                  <div className="ai-chat-message-content">
                    <div className="ai-chat-typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form className="ai-chat-input-form" onSubmit={handleSubmit}>
        <textarea
          className="ai-chat-input"
          role="textbox"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI to help with your canvas..."
          disabled={isProcessing}
          rows={1}
        />
        <button
          type="submit"
          className="ai-chat-send-button"
          disabled={!inputValue.trim() || isProcessing}
          aria-label="Send message"
        >
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
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
};

