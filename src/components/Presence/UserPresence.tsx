import React from "react";
import { usePresence } from "../../hooks/usePresence";
import "./UserPresence.css";

interface UserPresenceProps {
  variant?: "default" | "right-panel";
}

export const UserPresence: React.FC<UserPresenceProps> = ({ variant = "default" }) => {
  const { onlineUsers, currentUser, getUserCount } = usePresence();

  return (
    <div className={`user-presence ${variant === "right-panel" ? "right-panel-variant" : ""}`}>
      <div className="presence-header">
        <h3>Online ({getUserCount()})</h3>
      </div>

      <div className="users-list">
        {/* Current user */}
        {currentUser && (
          <div className="user-item current-user">
            <div
              className="user-avatar"
              style={{ backgroundColor: currentUser.color }}
            >
              {currentUser.displayName.charAt(0).toUpperCase()}
            </div>
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
            <div
              className="user-avatar"
              style={{ backgroundColor: user.userColor }}
            >
              {user.userName.charAt(0).toUpperCase()}
            </div>
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
