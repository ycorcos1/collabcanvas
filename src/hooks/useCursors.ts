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

    // Set up disconnection cleanup
    cursorsService.setupCursorDisconnection(user.id);

    // Subscribe to other users' cursors
    const unsubscribe = cursorsService.subscribeToCursors(
      user.id,
      (newCursors) => {
        setCursors(newCursors);
      }
    );

    return () => {
      unsubscribe();
      cursorsService.removeCursor(user.id);
    };
  }, [user]);

  const updateCursorPosition = useCallback(
    (x: number, y: number) => {
      if (!user) return;

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
