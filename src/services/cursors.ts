import { ref, set, onValue, onDisconnect, remove } from "firebase/database";
import { database } from "./firebase";
import { CursorPosition, CursorState } from "../types/cursor";
import { throttle } from "../utils/throttle";

// No longer using a hardcoded CANVAS_ID - each project has its own cursors
// OPTIMIZED: Reduced cursor update frequency to save Firebase quota
const CURSOR_UPDATE_THROTTLE = 80; // ~12.5 updates per second (~80ms)
// Balanced for responsiveness (<100ms perceived latency) and quota

// Update cursor position (throttled)
const updateCursorPositionThrottled = throttle(
  async (
    projectId: string,
    userId: string,
    x: number,
    y: number,
    userName: string,
    userColor: string
  ): Promise<void> => {
    try {
      const cursorRef = ref(database, `cursors/${projectId}/${userId}`);

      const cursorData: CursorPosition = {
        x,
        y,
        userId,
        userName,
        userColor,
        timestamp: Date.now(),
      };

      await set(cursorRef, cursorData);
    } catch (error: any) {
      // Silently handle errors - Realtime Database might not be set up yet
    }
  },
  CURSOR_UPDATE_THROTTLE
);

// Update cursor position
export const updateCursorPosition = (
  projectId: string,
  userId: string,
  x: number,
  y: number,
  userName: string,
  userColor: string
): void => {
  updateCursorPositionThrottled(projectId, userId, x, y, userName, userColor);
};

// Remove cursor when user disconnects
export const setupCursorDisconnection = (
  projectId: string,
  userId: string
): void => {
  const cursorRef = ref(database, `cursors/${projectId}/${userId}`);
  onDisconnect(cursorRef).remove();
};

// Remove cursor manually
export const removeCursor = async (
  projectId: string,
  userId: string
): Promise<void> => {
  const cursorRef = ref(database, `cursors/${projectId}/${userId}`);
  await remove(cursorRef);
};

// Subscribe to cursor changes
export const subscribeToCursors = (
  projectId: string,
  currentUserId: string,
  callback: (cursors: CursorState) => void,
  errorCallback?: (error: any) => void
): (() => void) => {
  const cursorsRef = ref(database, `cursors/${projectId}`);

  const unsubscribe = onValue(
    cursorsRef,
    (snapshot) => {
      const cursors: CursorState = {};

      if (snapshot.exists()) {
        const cursorsData = snapshot.val();
        Object.entries(cursorsData).forEach(([userId, cursorData]) => {
          // Don't include current user's cursor
          if (
            userId !== currentUserId &&
            cursorData &&
            typeof cursorData === "object"
          ) {
            cursors[userId] = cursorData as CursorPosition;
          }
        });
      }

      callback(cursors);
    },
    (error) => {
      console.error("Error listening to cursors:", error);
      if (errorCallback) {
        errorCallback(error);
      }
    }
  );

  return unsubscribe;
};
