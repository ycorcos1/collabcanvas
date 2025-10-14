import { useState, useCallback, useEffect } from "react";
import { PresenceData } from "../types/canvas";
import * as presenceService from "../services/presence";
import { useAuth } from "../components/Auth/AuthProvider";

export const usePresence = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceData[]>([]);

  // Set user as online and subscribe to presence
  useEffect(() => {
    if (!user) return;

    let isActive = true;

    // Set current user as online with error handling
    presenceService
      .setUserOnline(user.id, user.displayName, user.color)
      .then(() => {
        // User successfully set as online
      })
      .catch((error) => {
        console.error("Failed to set user online:", error);
        // Don't crash - presence is not critical for core functionality
      });

    // Subscribe to presence changes with error handling
    const unsubscribe = presenceService.subscribeToPresence(
      (users) => {
        if (!isActive) return;

        // Filter out current user from the online users list since we show them separately
        const otherUsers = users.filter((u) => {
          return u.userId !== user.id;
        });

        setOnlineUsers(otherUsers);
      },
      (error) => {
        console.error("Presence subscription error:", error);
        // Don't crash - just log the error and keep existing presence data
        if (
          error?.code === "unavailable" ||
          error?.code === "permission-denied"
        ) {
          // Presence temporarily unavailable, keeping existing data
        }
      }
    );

    // Update activity periodically with error handling
    const activityInterval = setInterval(() => {
      try {
        presenceService.updateUserActivity(user.id);
      } catch (error) {
        console.error("Error updating user activity:", error);
      }
    }, 30000); // Update every 30 seconds

    return () => {
      isActive = false;
      try {
        unsubscribe();
        clearInterval(activityInterval);
        presenceService.setUserOffline(user.id);
      } catch (error) {
        console.error("Error during presence cleanup:", error);
      }
    };
  }, [user]);

  const getUserCount = useCallback(() => {
    // Include current user in count
    return onlineUsers.length + (user ? 1 : 0);
  }, [onlineUsers.length, user]);

  return {
    onlineUsers,
    currentUser: user,
    getUserCount,
  };
};
