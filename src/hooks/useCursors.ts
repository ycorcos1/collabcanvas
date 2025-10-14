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

    let isActive = true;

    // Set up disconnection cleanup with error handling
    try {
      cursorsService.setupCursorDisconnection(user.id);
    } catch (error) {
      console.error("Failed to setup cursor disconnection:", error);
    }

    // Subscribe to other users' cursors with error handling
    const unsubscribe = cursorsService.subscribeToCursors(
      user.id,
      (newCursors) => {
        if (isActive) {
          setCursors(newCursors);
        }
      },
      (error) => {
        console.error("Cursor subscription error:", error);
        // Don't crash the app - just log the error and keep existing cursors
        if ((error as any)?.code === 'unavailable' || (error as any)?.code === 'permission-denied') {
          console.log("Cursors temporarily unavailable, keeping existing");
        }
      }
    );

    return () => {
      isActive = false;
      try {
        unsubscribe();
        cursorsService.removeCursor(user.id);
      } catch (error) {
        console.error("Error during cursor cleanup:", error);
      }
    };
  }, [user]);

  const updateCursorPosition = useCallback(
    (x: number, y: number) => {
      if (!user) return;

      try {
        cursorsService.updateCursorPosition(
          user.id,
          x,
          y,
          user.displayName,
          user.color
        );
      } catch (error) {
        console.error("Error updating cursor position:", error);
        // Don't crash the app - cursor updates are not critical
      }
    },
    [user]
  );

  return {
    cursors,
    updateCursorPosition,
  };
};
