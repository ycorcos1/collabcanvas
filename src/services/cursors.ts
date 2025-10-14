import { ref, set, onValue, onDisconnect, remove } from "firebase/database";
import { database } from "./firebase";
import { CursorPosition, CursorState } from "../types/cursor";
import { throttle } from "../utils/throttle";

const CANVAS_ID = "default"; // For MVP, we'll use a single canvas
const CURSOR_UPDATE_THROTTLE = 50; // 50ms = 20 FPS for cursor updates

// Update cursor position (throttled)
const updateCursorPositionThrottled = throttle(
  async (
    userId: string,
    x: number,
    y: number,
    userName: string,
    userColor: string
  ): Promise<void> => {
    try {
      const cursorRef = ref(database, `cursors/${CANVAS_ID}/${userId}`);

      const cursorData: CursorPosition = {
        x,
        y,
        userId,
        userName,
        userColor,
        timestamp: Date.now(),
      };

      console.log("Setting cursor data:", cursorData);
      await set(cursorRef, cursorData);
      console.log("Cursor data set successfully");
    } catch (error) {
      console.error("Error setting cursor position:", error);
    }
  },
  CURSOR_UPDATE_THROTTLE
);

// Update cursor position
export const updateCursorPosition = (
  userId: string,
  x: number,
  y: number,
  userName: string,
  userColor: string
): void => {
  updateCursorPositionThrottled(userId, x, y, userName, userColor);
};

// Remove cursor when user disconnects
export const setupCursorDisconnection = (userId: string): void => {
  const cursorRef = ref(database, `cursors/${CANVAS_ID}/${userId}`);
  onDisconnect(cursorRef).remove();
};

// Remove cursor manually
export const removeCursor = async (userId: string): Promise<void> => {
  const cursorRef = ref(database, `cursors/${CANVAS_ID}/${userId}`);
  await remove(cursorRef);
};

// Subscribe to cursor changes
export const subscribeToCursors = (
  currentUserId: string,
  callback: (cursors: CursorState) => void
): (() => void) => {
  const cursorsRef = ref(database, `cursors/${CANVAS_ID}`);
  console.log("Subscribing to cursors for user:", currentUserId);
  console.log("Cursors ref path:", `cursors/${CANVAS_ID}`);

  const unsubscribe = onValue(
    cursorsRef,
    (snapshot) => {
      const cursors: CursorState = {};

      console.log("Cursor snapshot received:", {
        exists: snapshot.exists(),
        val: snapshot.val(),
        key: snapshot.key,
      });

      if (snapshot.exists()) {
        const cursorsData = snapshot.val();
        console.log("Cursors data:", cursorsData);
        Object.entries(cursorsData).forEach(([userId, cursorData]) => {
          console.log(
            "Processing cursor for user:",
            userId,
            "current user:",
            currentUserId
          );
          // Don't include current user's cursor
          if (
            userId !== currentUserId &&
            cursorData &&
            typeof cursorData === "object"
          ) {
            cursors[userId] = cursorData as CursorPosition;
            console.log("Added cursor for user:", userId);
          } else {
            console.log(
              "Skipped cursor for user:",
              userId,
              "reason:",
              userId === currentUserId ? "current user" : "invalid data"
            );
          }
        });
      }

      console.log("Final filtered cursors (excluding current user):", cursors);
      callback(cursors);
    },
    (error) => {
      console.error("Error listening to cursors:", error);
    }
  );

  return unsubscribe;
};
