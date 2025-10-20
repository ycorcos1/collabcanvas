import { useEffect, useCallback } from "react";

/**
 * Keyboard Shortcuts Hook - Handles global keyboard shortcuts
 *
 * Features:
 * - Undo/Redo (Cmd+Z/Cmd+Y)
 * - Delete selected shapes (Delete/Backspace)
 * - Duplicate shapes (Cmd+D)
 * - Select All (Cmd+A)
 * - Copy/Paste (Cmd+C/Cmd+V)
 * - Arrow keys for shape movement
 */

interface KeyboardShortcutsHandlers {
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onSelectAll?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  onEscape?: () => void;
  onSave?: () => void;
}

export const useKeyboardShortcuts = (handlers: KeyboardShortcutsHandlers) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs, textareas, or contentEditable elements
      const target = event.target as HTMLElement;
      const isInputElement =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.contentEditable === "true" ||
        target.isContentEditable;

      // Also skip when the focused element is our AI chat input explicitly
      const activeEl = document.activeElement as HTMLElement | null;
      const isAIChatInput =
        !!activeEl && activeEl.classList?.contains("ai-chat-input");

      if (isInputElement || isAIChatInput) {
        // Allow all default behavior in input fields (incl. AI chat)
        return;
      }

      // If user has a text selection, allow native copy/cut/paste
      const selection = window.getSelection?.();
      const hasSelection = !!selection && selection.toString().length > 0;

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdKey = isMac ? event.metaKey : event.ctrlKey;

      // Save
      if (cmdKey && event.key === "s") {
        if (handlers.onSave) {
          event.preventDefault();
          handlers.onSave();
          return;
        }
      }

      // Undo/Redo
      if (cmdKey && event.key === "z") {
        event.preventDefault();
        if (handlers.onUndo) {
          handlers.onUndo();
        }
        return;
      }

      // Redo with Cmd+Y
      if (cmdKey && event.key === "y") {
        event.preventDefault();
        if (handlers.onRedo) {
          handlers.onRedo();
        }
        return;
      }

      // Redo (alternative shortcut)
      if (cmdKey && event.key === "y" && handlers.onRedo) {
        event.preventDefault();
        handlers.onRedo();
        return;
      }

      // Delete
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        handlers.onDelete
      ) {
        event.preventDefault();
        handlers.onDelete();
        return;
      }

      // Duplicate
      if (cmdKey && event.key === "d" && handlers.onDuplicate) {
        event.preventDefault();
        handlers.onDuplicate();
        return;
      }

      // Select All
      if (cmdKey && event.key === "a" && handlers.onSelectAll) {
        event.preventDefault();
        handlers.onSelectAll();
        return;
      }

      // Copy
      if (cmdKey && event.key === "c") {
        if (hasSelection) return; // let browser copy selected text
        if (handlers.onCopy) {
          event.preventDefault();
          handlers.onCopy();
          return;
        }
      }

      // Cut (optional if consumer chooses to map delete)
      if (cmdKey && event.key === "x") {
        if (hasSelection) return; // let browser cut selected text
        if (handlers.onDelete) {
          event.preventDefault();
          handlers.onDelete();
          return;
        }
      }

      // Paste
      if (cmdKey && event.key === "v") {
        if (hasSelection) return; // let browser paste over selected text if in editable
        if (handlers.onPaste) {
          event.preventDefault();
          handlers.onPaste();
          return;
        }
      }

      // Arrow keys for movement (only when shapes are selected)
      if (!cmdKey) {
        switch (event.key) {
          case "ArrowUp":
            event.preventDefault();
            handlers.onMoveUp?.();
            break;
          case "ArrowDown":
            event.preventDefault();
            handlers.onMoveDown?.();
            break;
          case "ArrowLeft":
            event.preventDefault();
            handlers.onMoveLeft?.();
            break;
          case "ArrowRight":
            event.preventDefault();
            handlers.onMoveRight?.();
            break;
          case "Escape":
            event.preventDefault();
            handlers.onEscape?.();
            break;
        }
      }
    },
    [handlers]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
};
