import React from "react";
import { usePresence } from "../../hooks/usePresence";
import { Avatar } from "../shared/Avatar";
import "./UserPresence.css";

interface UserPresenceProps {
  variant?: "default" | "right-panel";
  projectId: string;
}

export const UserPresence: React.FC<UserPresenceProps> = ({
  variant = "default",
  projectId,
}) => {
  const { onlineUsers, currentUser, getUserCount } = usePresence(projectId);

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
        {/* Current user */}
        {currentUser && (
          <div className="user-item current-user">
            <Avatar
              src={currentUser.photoURL}
              name={currentUser.displayName}
              size="sm"
              color={currentUser.color}
              className="user-avatar-component"
            />
            <div className="user-name">
              <span>{currentUser.displayName}</span>
              {variant === "right-panel" && (
                <span className="user-status">You • Active now</span>
              )}
              {variant === "default" && <span> (you)</span>}
            </div>
          </div>
        )}

        {/* Other online users */}
        {onlineUsers.map((user) => (
          <div key={user.userId} className="user-item">
            <Avatar
              src={user.photoURL}
              name={user.userName}
              size="sm"
              color={user.userColor}
              className="user-avatar-component"
            />
            <div className="user-name">
              <span>{user.userName}</span>
              {variant === "right-panel" && (
                <span className="user-status">Online • Collaborating</span>
              )}
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
