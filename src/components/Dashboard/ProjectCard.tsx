import React, { useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Project } from "../../types/project";

interface ProjectCardProps {
  /** Project data to display */
  project: Project;
  /** Function called when project should be opened */
  onOpen: (projectId: string) => void;
  /** Function called when project should be renamed */
  onRename: (projectId: string, newName: string) => void;
  /** Function called when project should be moved to trash */
  onDelete: (projectId: string) => void;
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
}) => {
  const [showActions, setShowActions] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(project.name);

  const handleCardClick = () => {
    onOpen(project.id);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && newName.trim() !== project.name) {
      onRename(project.id, newName.trim());
    }
    setIsRenaming(false);
    setNewName(project.name);
  };

  const handleRenameCancel = () => {
    setIsRenaming(false);
    setNewName(project.name);
  };

  const handleDelete = () => {
    if (
      window.confirm(
        `Are you sure you want to move "${project.name}" to trash?`
      )
    ) {
      onDelete(project.id);
    }
    setShowActions(false);
  };

  const relativeTime = formatDistanceToNow(project.updatedAt.toDate(), {
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
        <div className="project-actions">
          <button
            className="actions-trigger"
            onClick={() => setShowActions(!showActions)}
            aria-label="Project actions"
          >
            ⋯
          </button>

          {showActions && (
            <div className="actions-menu">
              <Link
                to={`/canvas/${project.slug}`}
                className="action-item"
                onClick={() => setShowActions(false)}
              >
                Open in New Tab
              </Link>
              <button
                className="action-item"
                onClick={() => {
                  setIsRenaming(true);
                  setShowActions(false);
                }}
              >
                Rename
              </button>
              <button
                className="action-item action-danger"
                onClick={handleDelete}
              >
                Move to Trash
              </button>
            </div>
          )}
        </div>
      </div>
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
    overflow: hidden;
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
    top: 100%;
    right: 0;
    background: var(--bg-elevated);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    min-width: 160px;
    z-index: var(--z-dropdown);
    overflow: hidden;
  }

  .action-item {
    display: block;
    width: 100%;
    padding: var(--space-3);
    background: none;
    border: none;
    text-align: left;
    font-size: var(--text-sm);
    color: var(--text-primary);
    text-decoration: none;
    cursor: pointer;
    transition: background-color var(--duration-fast) var(--ease-out);
  }

  .action-item:hover {
    background-color: var(--interactive-secondary);
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
`;

if (!document.head.querySelector("style[data-project-card-styles]")) {
  style.setAttribute("data-project-card-styles", "true");
  document.head.appendChild(style);
}
