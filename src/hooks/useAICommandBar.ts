/**
 * useAICommandBar Hook
 *
 * Manages the AI command bar state and keyboard shortcut
 */

import { useState, useEffect, useCallback } from "react";

interface UseAICommandBarReturn {
  /** Whether the command bar is open */
  isOpen: boolean;
  /** Open the command bar */
  open: () => void;
  /** Close the command bar */
  close: () => void;
  /** Toggle the command bar */
  toggle: () => void;
}

/**
 * Hook to manage AI command bar state and keyboard shortcuts
 */
export const useAICommandBar = (): UseAICommandBarReturn => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Global keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault(); // Prevent browser's default search
        toggle();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  // Prevent body scroll when command bar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
};

