import { ref, set, onValue, onDisconnect, remove } from "firebase/database";
import { database } from "./firebase";
import { PresenceData } from "../types/canvas";

const CANVAS_ID = "default"; // For MVP, we'll use a single canvas

// Set user as online
export const setUserOnline = async (
  userId: string,
  userName: string,
  userColor: string,
  photoURL?: string
): Promise<void> => {
  try {
    const userPresenceRef = ref(database, `presence/${CANVAS_ID}/${userId}`);

    const presenceData: PresenceData = {
      userId,
      userName,
      userColor,
      photoURL,
      isOnline: true,
      lastSeen: Date.now(),
    };

    await set(userPresenceRef, presenceData);

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
  callback: (users: PresenceData[]) => void,
  errorCallback?: (error: any) => void
): (() => void) => {
  const presenceRef = ref(database, `presence/${CANVAS_ID}`);

  const unsubscribe = onValue(
    presenceRef,
    (snapshot) => {
      const users: PresenceData[] = [];

      if (snapshot.exists()) {
        const presenceData = snapshot.val();
        Object.entries(presenceData).forEach(([_userId, userData]) => {
          if (userData && typeof userData === "object") {
            users.push(userData as PresenceData);
          }
        });
      }

      callback(users);
    },
    (error) => {
      console.error("🔥 ERROR - Error listening to presence:", error);
      console.error("🔥 ERROR - Error message:", error.message);
      if (errorCallback) {
        errorCallback(error);
      }
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
