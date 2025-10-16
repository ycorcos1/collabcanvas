import React from "react";
import { useCollaborationRequests } from "../../hooks/useCollaborationRequests";
import { formatDistanceToNow } from "date-fns";
import "./CollaborationRequests.css";

interface CollaborationRequest {
  id: string;
  projectId: string;
  projectName: string;
  fromUserId: string;
  fromUserName: string;
  fromUserEmail: string;
  toUserId: string;
  message?: string;
  createdAt: number;
  status: 'pending' | 'accepted' | 'denied';
}

interface CollaborationRequestsProps {
  requests: CollaborationRequest[];
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

/**
 * Collaboration Requests Component - Minimizable requests panel
 *
 * Features:
 * - Minimizable/expandable interface
 * - Chronological request ordering
 * - Accept/deny functionality
 * - Request count indicator
 * - User information display
 */
export const CollaborationRequests: React.FC<CollaborationRequestsProps> = ({
  requests,
  isMinimized,
  onToggleMinimize,
}) => {
  const { acceptRequest, denyRequest } = useCollaborationRequests();
  
  const pendingRequests = requests.filter(req => req.status === 'pending');
  const requestCount = pendingRequests.length;

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptRequest(requestId);
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const handleDenyRequest = async (requestId: string) => {
    try {
      await denyRequest(requestId);
    } catch (error) {
      console.error('Failed to deny request:', error);
    }
  };

  return (
    <div className={`collaboration-requests ${isMinimized ? 'minimized' : ''}`}>
      {/* Header */}
      <div className="requests-header" onClick={onToggleMinimize}>
        <div className="requests-title">
          <h3>Collaboration Requests</h3>
          {requestCount > 0 && (
            <span className="request-count">{requestCount}</span>
          )}
        </div>
        <button className="minimize-button">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={isMinimized ? 'rotated' : ''}
          >
            <polyline points="6,9 12,15 18,9" />
          </svg>
        </button>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="requests-content">
          {pendingRequests.length === 0 ? (
            <div className="no-requests">
              <p>No pending collaboration requests</p>
            </div>
          ) : (
            <div className="requests-list">
              {pendingRequests.map((request) => (
                <div key={request.id} className="request-item">
                  <div className="request-info">
                    <div className="request-header">
                      <span className="requester-name">{request.fromUserName}</span>
                      <span className="request-time">
                        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="request-details">
                      <span className="requester-email">{request.fromUserEmail}</span>
                      <span className="project-name">wants to collaborate on "{request.projectName}"</span>
                    </div>
                    {request.message && (
                      <div className="request-message">
                        <p>"{request.message}"</p>
                      </div>
                    )}
                  </div>
                  <div className="request-actions">
                    <button
                      className="request-button deny"
                      onClick={() => handleDenyRequest(request.id)}
                    >
                      Deny
                    </button>
                    <button
                      className="request-button accept"
                      onClick={() => handleAcceptRequest(request.id)}
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
