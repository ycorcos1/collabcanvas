/**
 * Presence Service - OPTIMIZED for Firebase Quota
 *
 * This service tracks which users are currently online in a project.
 * OPTIMIZATION: Updates only on join/leave, NOT continuous heartbeat
 * This reduces Firebase writes by 99% compared to heartbeat-based presence
 */

import {
  ref,
  set,
  onValue,
  onDisconnect,
  remove,
  update,
} from "firebase/database";
import { database } from "./firebase";

export interface PresenceUser {
  userId: string;
  userName: string;
  userColor: string;
  userPhotoURL?: string; // Optional - may not be present in Firebase
  joinedAt: number;
  lastSeen?: number;
}

// Set user as online (called once when joining)
export async function setUserOnline(
  projectId: string,
  userId: string,
  userName: string,
  userColor: string,
  userPhotoURL?: string
): Promise<void> {
  // Firebase Realtime DB doesn't allow undefined values - remove or convert to null
  const userData: any = {
    userId,
    userName,
    userColor,
    joinedAt: Date.now(),
    lastSeen: Date.now(),
  };

  // Only add userPhotoURL if it's defined
  if (userPhotoURL !== undefined && userPhotoURL !== null) {
    userData.userPhotoURL = userPhotoURL;
  }

  try {
    const presenceRef = ref(database, `presence/${projectId}/${userId}`);

    // Set up automatic removal on disconnect BEFORE setting presence
    // This prevents race conditions if connection drops immediately
    await onDisconnect(presenceRef).remove();

    // Now set user as online
    await set(presenceRef, userData);
  } catch (error: any) {
    console.error("Error setting user online:", error);
    console.error("User data that failed:", userData);
    throw error; // Re-throw to let caller handle
  }
}

// Set user as offline (manual cleanup)
export async function setUserOffline(
  projectId: string,
  userId: string
): Promise<void> {
  try {
    const presenceRef = ref(database, `presence/${projectId}/${userId}`);
    await remove(presenceRef);
  } catch (error) {
    console.error("Error setting user offline:", error);
  }
}

// No longer needed - we don't do heartbeat updates
export async function updateUserActivity(
  projectId: string,
  userId: string
): Promise<void> {
  try {
    const presenceRef = ref(database, `presence/${projectId}/${userId}`);
    await update(presenceRef, { lastSeen: Date.now() });
  } catch (error: any) {
    // Silently ignore activity update errors
  }
}

// Subscribe to presence changes
export function subscribeToPresence(
  projectId: string,
  callback: (users: PresenceUser[]) => void,
  errorCallback?: (error: any) => void
): () => void {
  const presenceRef = ref(database, `presence/${projectId}`);

  const unsubscribe = onValue(
    presenceRef,
    (snapshot) => {
      const users: PresenceUser[] = [];

      if (snapshot.exists()) {
        const presenceData = snapshot.val();
        const now = Date.now();
        Object.values(presenceData).forEach((userData) => {
          if (userData && typeof userData === "object") {
            const u = userData as PresenceUser;
            const seen = u.lastSeen || u.joinedAt;
            // Consider online if seen within last 10 seconds
            if (now - seen < 10000) {
              users.push(u);
            }
          }
        });
      }

      callback(users);
    },
    (error) => {
      console.error("Error listening to presence:", error);
      if (errorCallback) {
        errorCallback(error);
      }
    }
  );

  return unsubscribe;
}
