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
  const [ownerId, setOwnerId] = useState<string | null>(null);

  // Fetch ownerId once for role labeling; presence remains the source of truth for who is online
  useEffect(() => {
    const fetchOwner = async () => {
      try {
        const projectRef = doc(db, "projects", projectId);
        const snap = await getDoc(projectRef);
        if (snap.exists()) {
          const data: any = snap.data();
          setOwnerId(data.ownerId as string);
        } else {
          setOwnerId(null);
        }
      } catch {
        setOwnerId(null);
      }
    };
    fetchOwner();
  }, [projectId]);

  // Build members list directly from presence each render to avoid stale UI
  const members: Member[] = useMemo(() => {
    const list: Member[] = [];
    if (currentUser) {
      list.push({
        id: currentUser.id,
        name: currentUser.displayName || "You",
        role: ownerId && currentUser.id === ownerId ? "Host" : "Collaborator",
        photoURL: currentUser.photoURL,
        online: true,
        color: currentUser.color || getUserColor(currentUser.id),
      });
    }
    onlineUsers.forEach((u) => {
      if (currentUser && u.userId === currentUser.id) return;
      list.push({
        id: u.userId,
        name: u.userName || "User",
        role: ownerId && u.userId === ownerId ? "Host" : "Collaborator",
        photoURL: (u as any).photoURL,
        online: true,
        color: u.userColor || getUserColor(u.userId),
      });
    });
    return list;
  }, [onlineUsers, currentUser, ownerId]);

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

      {sortedMembers.length <= 1 && (
        <div className="empty-message">Invite others to collaborate!</div>
      )}
    </div>
  );
};
