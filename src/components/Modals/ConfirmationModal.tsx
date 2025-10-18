import React from "react";
import { Button } from "../shared";
import "./ConfirmationModal.css";

interface ConfirmationModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to close the modal */
  onClose: () => void;
  /** Function called when user confirms */
  onConfirm: () => void;
  /** Modal title */
  title: string;
  /** Modal message/description */
  message: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Whether the action is destructive (red button) */
  isDestructive?: boolean;
  /** Whether the confirm action is loading */
  isLoading?: boolean;
}

/**
 * Confirmation Modal - Reusable confirmation dialog
 *
 * Features:
 * - Customizable title and message
 * - Destructive action styling
 * - Loading state support
 * - Keyboard navigation (ESC to cancel)
 * - Click outside to close
 */
export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  isLoading = false,
}) => {
  // Handle keyboard events
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="confirmation-modal-backdrop" onClick={handleBackdropClick}>
      <div className="confirmation-modal">
        <div className="confirmation-modal-header">
          <h2 className="confirmation-modal-title">{title}</h2>
          <button
            className="confirmation-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="confirmation-modal-body">
          <p className="confirmation-modal-message">{message}</p>
        </div>

        <div className="confirmation-modal-footer">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={isDestructive ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={isLoading}
            loading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

