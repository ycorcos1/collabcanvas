import React, { useState } from "react";
import { useProjects } from "../../hooks/useProjects";
import { Button, ConfirmationModal } from "../shared";

/**
 * Trash Projects View - Shows deleted projects with recovery options
 *
 * Features:
 * - View deleted projects
 * - Recover individual projects
 * - Permanently delete projects
 * - Bulk operations (recover all, delete all)
 * - Auto-cleanup after 30 days (future)
 */
export const TrashProjects: React.FC = () => {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showBulkRecoverConfirm, setShowBulkRecoverConfirm] = useState(false);
  const [showEmptyTrashConfirm, setShowEmptyTrashConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  const {
    projects: trashedProjects,
    isLoading,
    error,
    recoverProjectFromTrash,
    permanentlyDeleteProject,
    batchRecover,
    batchDelete,
    refresh,
  } = useProjects({
    includeDeleted: true,
    orderBy: "updatedAt",
    orderDirection: "desc",
  });

  const handleRecoverProject = async (projectId: string) => {
    await recoverProjectFromTrash(projectId);
  };

  const handlePermanentlyDeleteProject = async (projectId: string) => {
    setProjectToDelete(projectId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    setIsDeleting(true);
    try {
      await permanentlyDeleteProject(projectToDelete);
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error("Failed to delete project:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProjects.length === trashedProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(trashedProjects.map((p) => p.id));
    }
  };

  const handleBulkRecover = async () => {
    if (selectedProjects.length === 0) return;
    setShowBulkRecoverConfirm(true);
  };

  const handleBulkDelete = async () => {
    if (selectedProjects.length === 0) return;
    setShowBulkDeleteConfirm(true);
  };

  const handleConfirmBulkDelete = async () => {
    setIsDeleting(true);
    try {
      await batchDelete(selectedProjects);
      setSelectedProjects([]);
      setShowBulkDeleteConfirm(false);
    } catch (error) {
      console.error("Failed to delete projects:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEmptyTrash = async () => {
    if (trashedProjects.length === 0) return;
    setShowEmptyTrashConfirm(true);
  };

  const handleConfirmBulkRecover = async () => {
    setIsRecovering(true);
    try {
      await batchRecover(selectedProjects);
      setSelectedProjects([]);
      setShowBulkRecoverConfirm(false);
    } catch (error) {
      console.error("Failed to recover projects:", error);
    } finally {
      setIsRecovering(false);
    }
  };

  const handleConfirmEmptyTrash = async () => {
    setIsDeleting(true);
    try {
      await batchDelete(trashedProjects.map((p) => p.id));
      setSelectedProjects([]);
      setShowEmptyTrashConfirm(false);
    } catch (error) {
      console.error("Failed to empty trash:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Custom project card for trash with different actions
  const TrashProjectCard: React.FC<{ project: any }> = ({ project }) => {
    const isSelected = selectedProjects.includes(project.id);

    return (
      <div className={`trash-project-card ${isSelected ? "selected" : ""}`}>
        <div className="project-selection">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => handleSelectProject(project.id)}
          />
        </div>

        <div className="project-thumbnail">
          {project.thumbnailUrl ? (
            <img src={project.thumbnailUrl} alt={`${project.name} thumbnail`} />
          ) : (
            <div className="project-thumbnail-fallback">
              <span>{project.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>

        <div className="project-content">
          <h3 className="project-name">{project.name}</h3>
          <div className="project-meta">
            <span className="project-deleted">
              Deleted{" "}
              {new Date(project.deletedAt.toDate()).toLocaleDateString()}
            </span>
          </div>

          <div className="project-actions">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleRecoverProject(project.id)}
            >
              Recover
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handlePermanentlyDeleteProject(project.id)}
            >
              Delete Forever
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Empty state
  const EmptyTrashState = () => (
    <div className="trash-empty">
      <div className="empty-trash-icon">🗂</div>
      <h3>Trash is empty</h3>
      <p>
        Deleted projects will appear here. You can recover them or delete them
        permanently.
      </p>
    </div>
  );

  if (error) {
    return (
      <div className="trash-error">
        <h2>Unable to load trash</h2>
        <p>{error}</p>
        <Button variant="secondary" onClick={refresh}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="trash-projects">
      {/* Header */}
      <div className="trash-header">
        <div className="header-content">
          <h1>Trash</h1>
          <p>Recover or permanently delete projects</p>
        </div>

        {trashedProjects.length > 0 && (
          <Button variant="danger" onClick={handleEmptyTrash}>
            Empty Trash
          </Button>
        )}
      </div>

      {/* Bulk Actions */}
      {trashedProjects.length > 0 && (
        <div className="trash-controls">
          <div className="selection-controls">
            <label className="select-all">
              <input
                type="checkbox"
                checked={selectedProjects.length === trashedProjects.length}
                onChange={handleSelectAll}
              />
              Select All ({trashedProjects.length})
            </label>
          </div>

          <div
            className={`bulk-actions ${
              selectedProjects.length === 0 ? "bulk-actions-hidden" : ""
            }`}
          >
            <Button
              variant="secondary"
              onClick={handleBulkRecover}
              disabled={selectedProjects.length === 0}
            >
              Recover Selected ({selectedProjects.length})
            </Button>
            <Button
              variant="danger"
              onClick={handleBulkDelete}
              disabled={selectedProjects.length === 0}
            >
              Delete Selected ({selectedProjects.length})
            </Button>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {isLoading ? (
        <div className="trash-loading">
          <div className="loading-spinner"></div>
          <p>Loading deleted projects...</p>
        </div>
      ) : trashedProjects.length === 0 ? (
        <EmptyTrashState />
      ) : (
        <div className="trash-grid">
          {trashedProjects.map((project) => (
            <TrashProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Info */}
      {trashedProjects.length > 0 && (
        <div className="trash-info">
          <p>💡 Projects in trash are automatically deleted after 30 days</p>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Permanently Delete Project"
        message={`Are you sure you want to permanently delete this project? This action cannot be undone.`}
        confirmText="Delete Forever"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
      />

      <ConfirmationModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleConfirmBulkDelete}
        title="Permanently Delete Projects"
        message={`Are you sure you want to permanently delete ${
          selectedProjects.length
        } project${
          selectedProjects.length !== 1 ? "s" : ""
        }? This action cannot be undone.`}
        confirmText="Delete Forever"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
      />

      <ConfirmationModal
        isOpen={showBulkRecoverConfirm}
        onClose={() => setShowBulkRecoverConfirm(false)}
        onConfirm={handleConfirmBulkRecover}
        title="Recover Projects"
        message={`Are you sure you want to recover ${
          selectedProjects.length
        } project${
          selectedProjects.length !== 1 ? "s" : ""
        }? They will be moved back to your projects.`}
        confirmText="Recover"
        cancelText="Cancel"
        isDestructive={false}
        isLoading={isRecovering}
      />

      <ConfirmationModal
        isOpen={showEmptyTrashConfirm}
        onClose={() => setShowEmptyTrashConfirm(false)}
        onConfirm={handleConfirmEmptyTrash}
        title="Empty Trash"
        message={`Are you sure you want to permanently delete all ${trashedProjects.length} projects in trash? This action cannot be undone.`}
        confirmText="Empty Trash"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};

// Add trash styles
const style = document.createElement("style");
style.textContent = `
  .trash-projects {
    min-height: 100vh;
    background-color: var(--bg-primary);
  }

  .trash-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-8) var(--space-6) var(--space-6);
    border-bottom: 1px solid var(--border-primary);
  }

  .header-content h1 {
    font-size: var(--text-3xl);
    font-weight: var(--font-bold);
    color: var(--text-primary);
    margin: 0 0 var(--space-2) 0;
  }

  .header-content p {
    font-size: var(--text-lg);
    color: var(--text-secondary);
    margin: 0;
  }

  .trash-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-6);
    background-color: var(--bg-secondary);
    border-bottom: 1px solid var(--border-primary);
  }

  .selection-controls {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .select-all {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--text-secondary);
    cursor: pointer;
  }

  .bulk-actions {
    display: flex;
    gap: var(--space-3);
    transition: opacity var(--duration-fast) var(--ease-out);
  }

  .bulk-actions-hidden {
    opacity: 0;
    pointer-events: none;
  }

  .trash-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-6);
    padding: var(--space-6);
  }

  .trash-project-card {
    background-color: var(--bg-elevated);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: all var(--duration-fast) var(--ease-out);
    position: relative;
  }

  .trash-project-card.selected {
    border-color: var(--interactive-primary);
    box-shadow: 0 0 0 2px var(--interactive-primary-bg);
  }

  .project-selection {
    position: absolute;
    top: var(--space-3);
    left: var(--space-3);
    z-index: 1;
  }

  .project-selection input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .project-thumbnail {
    position: relative;
    width: 100%;
    height: 160px;
    overflow: hidden;
    background-color: var(--bg-secondary);
    opacity: 0.7;
  }

  .project-thumbnail img {
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
    background-color: #6b7280;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .project-content {
    padding: var(--space-4);
  }

  .project-name {
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    color: var(--text-secondary);
    margin: 0 0 var(--space-2) 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .project-meta {
    margin-bottom: var(--space-4);
  }

  .project-deleted {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
  }

  .project-actions {
    display: flex;
    gap: var(--space-2);
  }

  .project-actions .btn {
    flex: 1;
  }

  .trash-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--space-16) var(--space-8);
    max-width: 400px;
    margin: 0 auto;
  }

  .empty-trash-icon {
    font-size: 4rem;
    margin-bottom: var(--space-6);
    opacity: 0.6;
  }

  .trash-empty h3 {
    font-size: var(--text-xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--space-3) 0;
  }

  .trash-empty p {
    font-size: var(--text-base);
    color: var(--text-secondary);
    line-height: var(--leading-relaxed);
    margin: 0;
  }

  .trash-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-16) var(--space-8);
    gap: var(--space-4);
  }

  .trash-loading p {
    font-size: var(--text-base);
    color: var(--text-secondary);
    margin: 0;
  }

  .trash-info {
    display: flex;
    justify-content: center;
    padding: var(--space-4) var(--space-6);
    border-top: 1px solid var(--border-primary);
    background-color: var(--bg-secondary);
  }

  .trash-info p {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    margin: 0;
    text-align: center;
  }

  .trash-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--space-16) var(--space-8);
    min-height: 50vh;
  }

  .trash-error h2 {
    font-size: var(--text-2xl);
    font-weight: var(--font-bold);
    color: var(--status-error);
    margin: 0 0 var(--space-4) 0;
  }

  .trash-error p {
    font-size: var(--text-base);
    color: var(--text-secondary);
    margin: 0 0 var(--space-6) 0;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .trash-header {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-4);
      padding: var(--space-6) var(--space-4);
    }

    .header-content h1 {
      font-size: var(--text-2xl);
    }

    .header-content p {
      font-size: var(--text-base);
    }

    .trash-controls {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-4);
      padding: var(--space-4);
    }

    .bulk-actions {
      width: 100%;
    }

    .bulk-actions .btn {
      flex: 1;
    }

    .trash-grid {
      grid-template-columns: 1fr;
      gap: var(--space-4);
      padding: var(--space-4);
    }

    .trash-empty {
      padding: var(--space-12) var(--space-4);
    }
  }
`;

if (!document.head.querySelector("style[data-trash-projects-styles]")) {
  style.setAttribute("data-trash-projects-styles", "true");
  document.head.appendChild(style);
}
