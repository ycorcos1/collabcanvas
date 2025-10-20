import React from "react";
import { usePresence } from "../../hooks/usePresence";
import { useEffect, useMemo, useState } from "react";
import { firestore as db } from "../../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getUserColor } from "../../utils/canvasHelpers";
import { Avatar } from "../shared/Avatar";
import "./UserPresence.css";

interface UserPresenceProps {
  variant?: "default" | "right-panel";
  projectId: string;
}

type Member = {
  id: string;
  name: string;
  role: "Host" | "Collaborator";
  photoURL?: string;
  online: true;
  color?: string;
};

export const UserPresence: React.FC<UserPresenceProps> = ({
  variant = "default",
  projectId,
}) => {
  const { onlineUsers, currentUser, getUserCount } = usePresence(projectId);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    const loadOnline = async () => {
      try {
        const projectRef = doc(db, "projects", projectId);
        const snap = await getDoc(projectRef);
        let ownerId: string | null = null;
        let collaborators: string[] = [];
        let ids: string[] = [];
        if (snap.exists()) {
          const data: any = snap.data();
          ownerId = data.ownerId as string;
          collaborators = (data.collaborators || []) as string[];
          ids = [
            ownerId,
            ...collaborators.filter((c: string) => c !== ownerId),
          ];
        } else {
          // Still render from presence even if project doc is not yet available
          console.log("[UserPresence] Project not found:", projectId);
        }

        // Debug logging
        if (import.meta.env.DEV) {
          console.log("[UserPresence] Debug:", {
            projectId,
            ownerId,
            collaborators,
            ids,
            currentUser: currentUser?.id,
            onlineUsersCount: onlineUsers.length,
            onlineUsers: onlineUsers.map((u) => ({
              id: u.userId,
              name: u.userName,
            })),
          });
        }

        // Source of truth: presence list + current user
        const out: Member[] = [];

        // 1) Add current user first
        if (currentUser) {
          out.push({
            id: currentUser.id,
            name: currentUser.displayName || "You",
            role:
              ownerId && currentUser.id === ownerId ? "Host" : "Collaborator",
            photoURL: currentUser.photoURL,
            online: true,
            color: currentUser.color || getUserColor(currentUser.id),
          });
        }

        // 2) Add everyone from presence (excluding current user)
        onlineUsers.forEach((u) => {
          if (currentUser && u.userId === currentUser.id) return;
          out.push({
            id: u.userId,
            name: u.userName || "User",
            role: ownerId && u.userId === ownerId ? "Host" : "Collaborator",
            photoURL: (u as any).photoURL,
            online: true,
            color: u.userColor || getUserColor(u.userId),
          });
        });

        if (import.meta.env.DEV) {
          console.log("[UserPresence] Final members list:", out.length, out);
        }

        setMembers(out);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("[UserPresence] Error loading online users:", error);
        }
      }
    };
    loadOnline();
  }, [projectId, onlineUsers, currentUser]);

  // Memoize sorted members for performance
  const sortedMembers = useMemo(
    () => [...members].sort((a, b) => a.name.localeCompare(b.name)),
    [members]
  );

  return (
    <div
      className={`user-presence ${
        variant === "right-panel" ? "right-panel-variant" : ""
      }`}
    >
      <div className="presence-header">
        <h3>Online ({getUserCount()})</h3>
      </div>

      <div className="users-list">
        {sortedMembers.map((m) => (
          <div
            key={m.id}
            className={`user-item ${
              m.id === currentUser?.id ? "current-user" : ""
            }`}
          >
            <Avatar
              src={m.photoURL}
              name={m.name}
              size="sm"
              className="user-avatar-component is-online"
            />
            <div className="user-name">
              <span>{m.name}</span>
              <span className="user-status">{m.role} • Online</span>
            </div>
          </div>
        ))}
      </div>

      {getUserCount() === 1 && (
        <div className="empty-message">Invite others to collaborate!</div>
      )}
    </div>
  );
};
