import { useState, useEffect } from "react";
import { useAuth } from "../components/Auth/AuthProvider";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { firestore as db } from "../services/firebase";

interface Notification {
  id: string;
  type: "collaboration_request" | "info" | "success" | "error";
  title: string;
  message: string;
  data?: any;
  createdAt: number;
  read: boolean;
}

/**
 * Hook for managing notifications and collaboration request alerts
 */
export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications on mount
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    loadNotifications();
  }, [user]);

  // Update unread count when notifications change
  useEffect(() => {
    const unread = notifications.filter((n) => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const loadNotifications = async () => {
    try {
      if (!user) {
        setNotifications([]);
        return;
      }

      // Set up real-time listener for notifications
      const notificationsRef = collection(db, "notifications");
      const notificationsQuery = query(
        notificationsRef,
        where("userId", "==", user.id),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(
        notificationsQuery,
        (snapshot) => {
          const notifications: Notification[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            notifications.push({
              id: doc.id,
              type: data.type,
              title: data.title,
              message: data.message,
              data: data.data || {},
              createdAt: data.createdAt?.toMillis() || Date.now(),
              read: data.read || false,
            });
          });
          setNotifications(notifications);
        },
        (_error) => {
          // Handle all errors gracefully - no console output for missing collections
          setNotifications([]);
        }
      );

      // Return unsubscribe function for cleanup
      return unsubscribe;
    } catch (_error) {
      // Silently handle setup errors
      setNotifications([]);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true,
        readAt: Timestamp.now(),
      });
    } catch (_error) {
      // Silently handle errors
    }
  };

  const markAllAsRead = async () => {
    try {
      // In a real app, you'd use a batch write for better performance
      const unreadNotifications = notifications.filter((n) => !n.read);
      await Promise.all(
        unreadNotifications.map((notification) =>
          updateDoc(doc(db, "notifications", notification.id), {
            read: true,
            readAt: Timestamp.now(),
          })
        )
      );
    } catch (_error) {
      // Silently handle errors
    }
  };

  const removeNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, "notifications", notificationId));
    } catch (_error) {
      // Silently handle errors
    }
  };

  const addNotification = async (
    notification: Omit<Notification, "id" | "createdAt" | "read">
  ) => {
    try {
      const notificationData = {
        ...notification,
        createdAt: Timestamp.now(),
        read: false,
      };

      const docRef = await addDoc(
        collection(db, "notifications"),
        notificationData
      );

      return {
        id: docRef.id,
        ...notificationData,
        createdAt: Date.now(),
      };
    } catch (error) {
      // Silently handle errors but still throw for caller to handle
      throw error;
    }
  };

  // Handle collaboration request notification click
  const handleCollaborationRequestClick = (notification: Notification) => {
    markAsRead(notification.id);

    // Navigate to shared page if not already there
    const currentPath = window.location.pathname;
    if (!currentPath.includes("/dashboard/shared")) {
      window.location.href = "/dashboard/shared";
    }
  };

  return {
    notifications,
    unreadCount,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    addNotification,
    handleCollaborationRequestClick,
  };
};
