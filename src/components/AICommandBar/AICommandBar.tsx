/**
 * AI Command Bar Component
 *
 * A floating command input for natural language canvas manipulation
 * Activated with Cmd/Ctrl+K keyboard shortcut
 */

import React, { useState, useEffect, useRef, KeyboardEvent } from "react";
import "./AICommandBar.css";

interface AICommandBarProps {
  /** Whether the command bar is visible */
  isOpen: boolean;
  /** Callback when the command bar should close */
  onClose: () => void;
  /** Callback when a command is submitted */
  onSubmit: (command: string) => void;
  /** Whether a command is currently being processed */
  isProcessing?: boolean;
  /** Last response message to display */
  lastMessage?: string;
  /** Whether the last command was successful */
  lastSuccess?: boolean;
  /** Placeholder text for the input */
  placeholder?: string;
}

/**
 * AICommandBar - Floating command input with keyboard shortcuts
 */
export const AICommandBar: React.FC<AICommandBarProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isProcessing = false,
  lastMessage,
  lastSuccess,
  placeholder = "Ask AI to manipulate the canvas...",
}) => {
  const [command, setCommand] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Handle ESC to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!command.trim() || isProcessing) return;

    // Add to history
    setCommandHistory((prev) => [...prev, command]);
    setHistoryIndex(-1);

    // Submit command
    onSubmit(command.trim());

    // Clear input
    setCommand("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Arrow up - previous command
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length === 0) return;

      const newIndex =
        historyIndex === -1
          ? commandHistory.length - 1
          : Math.max(0, historyIndex - 1);

      setHistoryIndex(newIndex);
      setCommand(commandHistory[newIndex]);
    }

    // Arrow down - next command
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;

      const newIndex = historyIndex + 1;

      if (newIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setCommand("");
      } else {
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-command-bar-overlay">
      <div className="ai-command-bar-container" ref={containerRef}>
        {/* Header */}
        <div className="ai-command-bar-header">
          <div className="ai-command-bar-title">
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
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span>AI Assistant</span>
          </div>
          <button
            className="ai-command-bar-close"
            onClick={onClose}
            aria-label="Close"
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="ai-command-bar-form">
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isProcessing}
            className="ai-command-bar-input"
          />
          <button
            type="submit"
            disabled={!command.trim() || isProcessing}
            className="ai-command-bar-submit"
            aria-label="Submit command"
          >
            {isProcessing ? (
              <div className="ai-command-bar-spinner" />
            ) : (
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
            )}
          </button>
        </form>

        {/* Status Message */}
        {lastMessage && (
          <div
            className={`ai-command-bar-message ${
              lastSuccess ? "success" : "error"
            }`}
          >
            <div className="ai-command-bar-message-icon">
              {lastSuccess ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
            </div>
            <span className="ai-command-bar-message-text">{lastMessage}</span>
          </div>
        )}

        {/* Keyboard Hints */}
        <div className="ai-command-bar-hints">
          <span className="ai-command-bar-hint">
            <kbd>↑</kbd>
            <kbd>↓</kbd>
            <span>Navigate history</span>
          </span>
          <span className="ai-command-bar-hint">
            <kbd>Esc</kbd>
            <span>Close</span>
          </span>
          <span className="ai-command-bar-hint">
            <kbd>Enter</kbd>
            <span>Submit</span>
          </span>
        </div>

        {/* Example Commands */}
        {!lastMessage && !isProcessing && (
          <div className="ai-command-bar-examples">
            <div className="ai-command-bar-examples-title">Try asking:</div>
            <button
              className="ai-command-bar-example"
              onClick={() => setCommand("Create a red rectangle at 200,200")}
            >
              Create a red rectangle at 200,200
            </button>
            <button
              className="ai-command-bar-example"
              onClick={() => setCommand("Make all circles blue")}
            >
              Make all circles blue
            </button>
            <button
              className="ai-command-bar-example"
              onClick={() => setCommand("Delete the selected shape")}
            >
              Delete the selected shape
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

