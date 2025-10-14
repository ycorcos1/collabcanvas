import { ref, set, onValue, onDisconnect, remove } from "firebase/database";
import { database } from "./firebase";
import { PresenceData } from "../types/canvas";

const CANVAS_ID = "default"; // For MVP, we'll use a single canvas

// Set user as online
export const setUserOnline = async (
  userId: string,
  userName: string,
  userColor: string
): Promise<void> => {
  try {
    console.log("Setting user online:", { userId, userName, userColor });
    const userPresenceRef = ref(database, `presence/${CANVAS_ID}/${userId}`);

    const presenceData: PresenceData = {
      userId,
      userName,
      userColor,
      isOnline: true,
      lastSeen: Date.now(),
    };

    await set(userPresenceRef, presenceData);
    console.log("User presence data set successfully");

    // Remove user from presence when they disconnect
    onDisconnect(userPresenceRef).remove();
  } catch (error) {
    console.error("Error setting user online:", error);
    throw error;
  }
};

// Set user as offline
export const setUserOffline = async (userId: string): Promise<void> => {
  const userPresenceRef = ref(database, `presence/${CANVAS_ID}/${userId}`);
  await remove(userPresenceRef);
};

// Subscribe to presence changes
export const subscribeToPresence = (
  callback: (users: PresenceData[]) => void
): (() => void) => {
  console.log("🔥 STARTING - Subscribing to presence changes");
  const presenceRef = ref(database, `presence/${CANVAS_ID}`);
  console.log("🔥 STARTING - Presence ref path:", `presence/${CANVAS_ID}`);

  const unsubscribe = onValue(
    presenceRef,
    (snapshot) => {
      console.log("🔥 FIREBASE - Presence snapshot received:", {
        exists: snapshot.exists(),
        size: snapshot.size,
        val: snapshot.val(),
      });

      const users: PresenceData[] = [];

      if (snapshot.exists()) {
        const presenceData = snapshot.val();
        console.log("🔥 FIREBASE - Raw presence data:", presenceData);
        Object.entries(presenceData).forEach(([userId, userData]) => {
          console.log(
            "🔥 FIREBASE - Processing presence for user:",
            userId,
            userData
          );
          if (userData && typeof userData === "object") {
            users.push(userData as PresenceData);
            console.log("🔥 FIREBASE - Added user to presence:", userId);
          } else {
            console.log(
              "🔥 FIREBASE - Skipped invalid presence data for user:",
              userId
            );
          }
        });
      } else {
        console.log("🔥 FIREBASE - No presence data exists yet");
      }

      console.log("🔥 FIREBASE - Final parsed online users:", users);
      console.log("🔥 FIREBASE - Calling callback with", users.length, "users");
      callback(users);
    },
        (error) => {
          console.error("🔥 ERROR - Error listening to presence:", error);
          console.error("🔥 ERROR - Error message:", error.message);
        }
  );

  return unsubscribe;
};

// Update user's last seen timestamp
export const updateUserActivity = async (userId: string): Promise<void> => {
  const userPresenceRef = ref(
    database,
    `presence/${CANVAS_ID}/${userId}/lastSeen`
  );
  await set(userPresenceRef, Date.now());
};
