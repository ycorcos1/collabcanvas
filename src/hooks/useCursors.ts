import { useState, useCallback, useEffect } from "react";
import { CursorState } from "../types/cursor";
import * as cursorsService from "../services/cursors";
import { useAuth } from "../components/Auth/AuthProvider";

export const useCursors = () => {
  const { user } = useAuth();
  const [cursors, setCursors] = useState<CursorState>({});

  // Subscribe to cursor updates
  useEffect(() => {
    if (!user) return;

    console.log("Setting up cursors for user:", user.displayName);

    // Set up disconnection cleanup
    cursorsService.setupCursorDisconnection(user.id);

    // Subscribe to other users' cursors
    const unsubscribe = cursorsService.subscribeToCursors(
      user.id,
      (newCursors) => {
        console.log("Cursor update received:", newCursors);
        setCursors(newCursors);
      }
    );

    return () => {
      console.log("Cleaning up cursors for user:", user.displayName);
      unsubscribe();
      cursorsService.removeCursor(user.id);
    };
  }, [user]);

  const updateCursorPosition = useCallback(
    (x: number, y: number) => {
      if (!user) return;

      console.log("Updating cursor position:", {
        x,
        y,
        user: user.displayName,
      });
      cursorsService.updateCursorPosition(
        user.id,
        x,
        y,
        user.displayName,
        user.color
      );
    },
    [user]
  );

  return {
    cursors,
    updateCursorPosition,
  };
};
