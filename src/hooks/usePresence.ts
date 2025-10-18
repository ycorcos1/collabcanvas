import { useState, useCallback, useEffect } from "react";
import { PresenceData } from "../types/canvas";
import * as presenceService from "../services/presence";
import { PresenceUser } from "../services/presence";
import { useAuth } from "../components/Auth/AuthProvider";

export const usePresence = (projectId: string) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceData[]>([]);

  // Set user as online and subscribe to presence
  useEffect(() => {
    if (!user) return;

    let isActive = true;
    const currentUserId = user.id; // Capture user properties to avoid null access during cleanup
    const currentUserName = user.displayName;
    const currentUserColor = user.color;
    const currentUserPhotoURL = user.photoURL;

    // Set current user as online with error handling
    presenceService
      .setUserOnline(
        projectId,
        currentUserId,
        currentUserName,
        currentUserColor,
        currentUserPhotoURL
      )
      .then(() => {
        // User successfully set as online
      })
      .catch((error) => {
        console.error("Failed to set user online:", error);
        console.error("User data:", {
          projectId,
          userId: currentUserId,
          userName: currentUserName,
          userColor: currentUserColor,
          photoURL: currentUserPhotoURL,
        });
      });

    // Subscribe to presence changes with error handling
    const unsubscribe = presenceService.subscribeToPresence(
      projectId,
      (users: PresenceUser[]) => {
        if (!isActive) return;

        // Filter out current user from the online users list since we show them separately
        const otherUsers = users
          .filter((u) => u.userId !== currentUserId)
          .map((u) => ({
            userId: u.userId,
            userName: u.userName,
            userColor: u.userColor,
            photoURL: u.userPhotoURL,
            isOnline: true,
            lastSeen: u.joinedAt,
          }));

        setOnlineUsers(otherUsers);
      },
      (_error) => {
        // Silently handle presence subscription errors - keep existing data
      }
    );

    // Update activity periodically with error handling
    const activityInterval = setInterval(() => {
      try {
        presenceService.updateUserActivity(projectId, currentUserId);
      } catch (_error) {
        // Silently handle activity update errors
      }
    }, 30000); // Update every 30 seconds

    return () => {
      isActive = false;
      try {
        unsubscribe();
        clearInterval(activityInterval);
        presenceService.setUserOffline(projectId, currentUserId);
      } catch (_error) {
        // Silently handle cleanup errors
      }
    };
  }, [user, projectId]);

  // Update presence when user profile changes (e.g., profile picture)
  useEffect(() => {
    if (!user) return;

    // Update presence data when user profile changes
    presenceService
      .setUserOnline(
        projectId,
        user.id,
        user.displayName,
        user.color,
        user.photoURL
      )
      .catch((_error) => {
        // Silently handle presence update errors
      });
  }, [user?.photoURL, user?.displayName, projectId]); // Only trigger when these specific properties change

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
