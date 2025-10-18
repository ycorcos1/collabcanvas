import React, { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { Project } from "../../types/project";
import { ConfirmationModal } from "../shared";

interface ProjectCardProps {
  /** Project data to display */
  project: Project;
  /** Function called when project should be opened */
  onOpen?: (projectId: string) => void;
  /** Function called when project should be renamed */
  onRename?: (projectId: string, newName: string) => void;
  /** Function called when project should be moved to trash */
  onDelete?: (projectId: string) => void;
  /** Show collaboration indicator for multi-user projects */
  showCollaborationIndicator?: boolean;
  /** Show host/collaborator indicator */
  showHostIndicator?: boolean;
  /** Current user ID to check permissions */
  currentUserId?: string;
}

/**
 * Project Card - Individual project display with thumbnail and actions
 *
 * Features:
 * - Project thumbnail with fallback
 * - Project name and last edited time
 * - Actions menu (open, rename, delete)
 * - Responsive grid layout
 * - Hover states and interactions
 */
export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onOpen,
  onRename,
  onDelete,
  showCollaborationIndicator = false,
  showHostIndicator = false,
  currentUserId,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(project.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        actionsRef.current &&
        !actionsRef.current.contains(event.target as Node)
      ) {
        setShowActions(false);
      }
    };

    if (showActions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showActions]);

  const handleCardClick = () => {
    if (onOpen) {
      onOpen(project.id);
    }
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && newName.trim() !== project.name && onRename) {
      onRename(project.id, newName.trim());
    }
    setIsRenaming(false);
    setNewName(project.name);
  };

  const handleRenameCancel = () => {
    setIsRenaming(false);
    setNewName(project.name);
  };

  const handleOpenInNewTab = () => {
    window.open(`/canvas/${project.id}`, "_blank");
    setShowActions(false);
  };

  const handleSendAccess = () => {
    // TODO: Implement send access functionality
    alert("Send access functionality coming soon!");
    setShowActions(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
    setShowActions(false);
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(project.id);
      setShowDeleteConfirm(false);
    } catch (error: any) {
      console.error("Failed to delete project:", error);
      // Show error to user
      alert(`Failed to delete project: ${error.message || "Unknown error"}`);
      // Keep modal open on error so user can try again
    } finally {
      setIsDeleting(false);
    }
  };

  // Safe timestamp conversion
  const getDate = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (typeof timestamp.toDate === "function") return timestamp.toDate();
    if (typeof timestamp === "number") return new Date(timestamp);
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
    return new Date();
  };

  const relativeTime = formatDistanceToNow(getDate(project.updatedAt), {
    addSuffix: true,
  });

  // Generate fallback thumbnail
  const generateFallbackThumbnail = () => {
    const firstLetter = project.name.charAt(0).toUpperCase();
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FECA57"];
    const colorIndex = project.name.length % colors.length;
    const backgroundColor = colors[colorIndex];

    return (
      <div className="project-thumbnail-fallback" style={{ backgroundColor }}>
        <span>{firstLetter}</span>
      </div>
    );
  };

  return (
    <div className="project-card">
      {/* Thumbnail */}
      <div className="project-thumbnail" onClick={handleCardClick}>
        {project.thumbnailUrl ? (
          <img
            src={project.thumbnailUrl}
            alt={`${project.name} thumbnail`}
            className="project-thumbnail-image"
            onError={(e) => {
              // Replace with fallback on error
              const target = e.target as HTMLElement;
              target.style.display = "none";
            }}
          />
        ) : null}
        {generateFallbackThumbnail()}

        {/* Collaboration Indicator */}
        {showCollaborationIndicator && (
          <div className="collaboration-indicator">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
        )}

        {/* Host Indicator */}
        {showHostIndicator && (project as any).isHost && (
          <div className="host-indicator">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="project-content">
        {/* Name */}
        {isRenaming ? (
          <form onSubmit={handleRenameSubmit} className="project-rename-form">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="project-rename-input"
              autoFocus
              onBlur={handleRenameCancel}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  handleRenameCancel();
                }
              }}
            />
          </form>
        ) : (
          <h3 className="project-name" onClick={handleCardClick}>
            {project.name}
          </h3>
        )}

        {/* Metadata */}
        <div className="project-meta">
          <span className="project-time">Edited {relativeTime}</span>
        </div>

        {/* Actions */}
        <div className="project-actions" ref={actionsRef}>
          <button
            className="actions-trigger"
            onClick={() => setShowActions(!showActions)}
            aria-label="Project actions"
          >
            ⋯
          </button>

          {showActions && (
            <div className="actions-menu">
              <button className="action-item" onClick={handleCardClick}>
                Open Project
              </button>
              <button className="action-item" onClick={handleOpenInNewTab}>
                Open in New Tab
              </button>
              <button
                className="action-item"
                onClick={() => {
                  setIsRenaming(true);
                  setShowActions(false);
                }}
              >
                Rename
              </button>
              <button className="action-item" onClick={handleSendAccess}>
                Send Access
              </button>
              {/* Only show delete option if user is the project owner */}
              {currentUserId && currentUserId === project.ownerId && (
                <>
                  <div className="action-divider"></div>
                  <button
                    className="action-item action-danger"
                    onClick={handleDelete}
                  >
                    Delete Project
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Project"
        message={`Are you sure you want to move "${project.name}" to trash? You can recover it later from the trash.`}
        confirmText="Move to Trash"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};

// Add project card styles
const style = document.createElement("style");
style.textContent = `
  .project-card {
    background-color: var(--bg-elevated);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-lg);
    transition: all var(--duration-fast) var(--ease-out);
    cursor: pointer;
    position: relative;
  }

  .project-card:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--border-secondary);
  }

  .project-thumbnail {
    position: relative;
    width: 100%;
    height: 160px;
    overflow: hidden;
    background-color: var(--bg-secondary);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }

  .project-thumbnail-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .project-thumbnail-fallback {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-4xl);
    font-weight: var(--font-bold);
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .project-content {
    padding: var(--space-4);
    position: relative;
  }

  .project-name {
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--space-2) 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
  }

  .project-name:hover {
    color: var(--interactive-primary);
  }

  .project-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-3);
  }

  .project-time {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
  }

  .project-actions {
    position: absolute;
    top: var(--space-3);
    right: var(--space-3);
    z-index: 10;
  }

  .actions-trigger {
    background: var(--bg-elevated);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-lg);
    color: var(--text-tertiary);
    cursor: pointer;
    opacity: 0;
    transition: all var(--duration-fast) var(--ease-out);
  }

  .project-card:hover .actions-trigger {
    opacity: 1;
  }

  .actions-trigger:hover {
    color: var(--text-primary);
    background-color: var(--interactive-secondary);
  }

  .actions-menu {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    background: var(--bg-elevated);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    min-width: 180px;
    z-index: 1000;
    overflow: visible;
    padding: var(--space-1) 0;
  }

  .action-item {
    display: block;
    width: 100%;
    padding: var(--space-3) var(--space-4);
    background: none;
    border: none;
    text-align: left;
    font-size: var(--text-sm);
    color: var(--text-primary);
    text-decoration: none;
    cursor: pointer;
    transition: background-color var(--duration-fast) var(--ease-out);
    white-space: nowrap;
  }

  .action-item:hover {
    background-color: var(--interactive-secondary);
  }

  .action-divider {
    height: 1px;
    background-color: var(--border-primary);
    margin: var(--space-2) 0;
  }

  .action-danger {
    color: var(--status-error);
  }

  .action-danger:hover {
    background-color: var(--status-error-bg);
  }

  .project-rename-form {
    margin: 0;
  }

  .project-rename-input {
    width: 100%;
    padding: var(--space-2);
    border: 1px solid var(--border-focus);
    border-radius: var(--radius-sm);
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    background-color: var(--bg-primary);
    color: var(--text-primary);
  }

  .project-rename-input:focus {
    outline: none;
    border-color: var(--interactive-primary);
  }

  /* Collaboration and Host Indicators */
  .collaboration-indicator,
  .host-indicator {
    position: absolute;
    top: 8px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border-radius: 4px;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .collaboration-indicator {
    right: 8px;
  }

  .host-indicator {
    right: 32px;
    background: rgba(255, 193, 7, 0.9);
    color: #000;
  }

  .collaboration-indicator svg,
  .host-indicator svg {
    display: block;
  }
`;

if (!document.head.querySelector("style[data-project-card-styles]")) {
  style.setAttribute("data-project-card-styles", "true");
  document.head.appendChild(style);
}
