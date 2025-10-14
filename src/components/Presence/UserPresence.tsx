import React from "react";
import { usePresence } from "../../hooks/usePresence";
import "./UserPresence.css";

export const UserPresence: React.FC = () => {
  const { onlineUsers, currentUser, getUserCount } = usePresence();

  console.log("🔥 COMPONENT - UserPresence render:", {
    onlineUsersCount: onlineUsers.length,
    onlineUsers,
    currentUser: currentUser?.displayName,
    totalCount: getUserCount(),
  });

  return (
    <div className="user-presence">
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
            <span className="user-name">{currentUser.displayName} (you)</span>
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
            <span className="user-name">{user.userName}</span>
          </div>
        ))}
      </div>

      {getUserCount() === 1 && (
        <div className="empty-message">Invite others to collaborate!</div>
      )}
    </div>
  );
};
