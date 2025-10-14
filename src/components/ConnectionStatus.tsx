import React, { useState, useEffect } from "react";
import "./ConnectionStatus.css";

export const ConnectionStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Monitor browser online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Only show status when offline
  if (isOnline) {
    return null;
  }

  return (
    <div className="connection-status offline">
      <div className="status-indicator">
        <div className="status-dot"></div>
        <span className="status-text">No internet connection</span>
      </div>
    </div>
  );
};
