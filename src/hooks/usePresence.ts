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

    console.log("Setting up presence for user:", user.displayName);

    // Set current user as online
    presenceService
      .setUserOnline(user.id, user.displayName, user.color)
      .then(() => {
        console.log("User set as online:", user.displayName);
      })
      .catch((error) => {
        console.error("Failed to set user online:", error);
      });

    // Subscribe to presence changes
    const unsubscribe = presenceService.subscribeToPresence((users) => {
      console.log("🔥 PRESENCE UPDATE - Raw users received:", users);
      console.log("🔥 PRESENCE UPDATE - Number of users:", users.length);
      console.log("🔥 PRESENCE UPDATE - Current user ID:", user.id);

      // Filter out current user from the online users list since we show them separately
      const otherUsers = users.filter((u) => {
        console.log(
          "🔥 PRESENCE UPDATE - Checking user:",
          u.userId,
          "vs current:",
          user.id
        );
        return u.userId !== user.id;
      });
      console.log("🔥 PRESENCE UPDATE - Other users (filtered):", otherUsers);
      console.log(
        "🔥 PRESENCE UPDATE - Setting state with",
        otherUsers.length,
        "other users"
      );

      setOnlineUsers(otherUsers);
      console.log("🔥 PRESENCE UPDATE - State updated!");
    });

    // Update activity periodically
    const activityInterval = setInterval(() => {
      presenceService.updateUserActivity(user.id);
    }, 30000); // Update every 30 seconds

    return () => {
      console.log("Cleaning up presence for user:", user.displayName);
      unsubscribe();
      clearInterval(activityInterval);
      presenceService.setUserOffline(user.id);
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
