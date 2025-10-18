import React, { useState } from "react";
import { useCollaborationRequests } from "../../hooks/useCollaborationRequests";
import "./AddCollaboratorsModal.css";

interface AddCollaboratorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

/**
 * Add Collaborators Modal - Email-based project sharing
 *
 * Features:
 * - Email input with validation
 * - Optional message field
 * - Duplicate request prevention
 * - Success/error feedback
 * - Professional modal design
 */
export const AddCollaboratorsModal: React.FC<AddCollaboratorsModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
}) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { sendCollaborationRequest } = useCollaborationRequests();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    if (!validateEmail(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await sendCollaborationRequest(
        projectId,
        projectName,
        email.trim(),
        message.trim() || undefined
      );

      if (result.success) {
        setSuccess("Collaboration invitation sent successfully!");
        setEmail("");
        setMessage("");

        // Auto-close after success
        setTimeout(() => {
          onClose();
          setSuccess(null);
        }, 2000);
      }
    } catch (err: any) {
      console.error("Failed to send collaboration invitation:", err);

      // Handle specific error cases
      if (
        err.message?.includes("already been sent") ||
        err.message?.includes("already exists")
      ) {
        setError(
          "A collaboration invitation has already been sent to this user"
        );
      } else if (
        err.message?.includes("already collaborator") ||
        err.message?.includes("already a collaborator")
      ) {
        setError("This user is already a collaborator on this project");
      } else if (err.message?.includes("user not found")) {
        setError("No user found with this email address");
      } else {
        setError("Failed to send collaboration invitation. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEmail("");
    setMessage("");
    setError(null);
    setSuccess(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Collaborators</h2>
          <button className="modal-close" onClick={handleCancel}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <p className="project-info">
            Share "<strong>{projectName}</strong>" with others to collaborate in
            real-time.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="collaborator-email">Email Address</label>
              <input
                id="collaborator-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter collaborator's email"
                className="form-input"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="collaboration-message">Message (Optional)</label>
              <textarea
                id="collaboration-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal message to your invitation..."
                className="form-textarea"
                rows={3}
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="error-message">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div className="success-message">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                {success}
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button primary"
                disabled={isLoading || !email.trim()}
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner" />
                    Sending...
                  </>
                ) : (
                  "Send Invitation"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
