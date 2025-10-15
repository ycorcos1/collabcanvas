import React from "react";
import { Project } from "../../types/project";
import { ProjectCard } from "./ProjectCard";

interface ProjectGridProps {
  /** Array of projects to display */
  projects: Project[];
  /** Loading state */
  isLoading?: boolean;
  /** Empty state content */
  emptyState?: React.ReactNode;
  /** Function called when project should be opened */
  onOpenProject: (projectId: string) => void;
  /** Function called when project should be renamed */
  onRenameProject: (projectId: string, newName: string) => void;
  /** Function called when project should be moved to trash */
  onDeleteProject: (projectId: string) => void;
}

/**
 * Project Grid - Responsive grid layout for project cards
 *
 * Features:
 * - Responsive grid (3/2/1 columns based on screen size)
 * - Loading state with skeleton cards
 * - Empty state display
 * - Proper spacing and alignment
 */
export const ProjectGrid: React.FC<ProjectGridProps> = ({
  projects,
  isLoading = false,
  emptyState,
  onOpenProject,
  onRenameProject,
  onDeleteProject,
}) => {
  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="project-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="project-card-skeleton">
            <div className="skeleton-thumbnail"></div>
            <div className="skeleton-content">
              <div className="skeleton-title"></div>
              <div className="skeleton-meta"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Show empty state
  if (projects.length === 0) {
    return (
      <div className="project-grid-empty">
        {emptyState || (
          <div className="empty-state-default">
            <div className="empty-icon">📂</div>
            <h3>No projects yet</h3>
            <p>Create your first project to get started</p>
          </div>
        )}
      </div>
    );
  }

  // Show projects grid
  return (
    <div className="project-grid">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onOpen={onOpenProject}
          onRename={onRenameProject}
          onDelete={onDeleteProject}
        />
      ))}
    </div>
  );
};

// Add project grid styles
const style = document.createElement("style");
style.textContent = `
  .project-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-6);
    padding: var(--space-6);
  }

  .project-grid-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    padding: var(--space-8);
  }

  .empty-state-default {
    text-align: center;
    max-width: 400px;
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: var(--space-4);
  }

  .empty-state-default h3 {
    font-size: var(--text-xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--space-2) 0;
  }

  .empty-state-default p {
    font-size: var(--text-base);
    color: var(--text-secondary);
    margin: 0 0 var(--space-6) 0;
    line-height: var(--leading-relaxed);
  }

  /* Loading skeleton styles */
  .project-card-skeleton {
    background-color: var(--bg-elevated);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-lg);
    overflow: hidden;
    animation: pulse 2s infinite;
  }

  .skeleton-thumbnail {
    width: 100%;
    height: 160px;
    background-color: var(--bg-secondary);
  }

  .skeleton-content {
    padding: var(--space-4);
  }

  .skeleton-title {
    height: 20px;
    background-color: var(--bg-secondary);
    border-radius: var(--radius-sm);
    margin-bottom: var(--space-3);
    width: 70%;
  }

  .skeleton-meta {
    height: 16px;
    background-color: var(--bg-secondary);
    border-radius: var(--radius-sm);
    width: 50%;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  /* Responsive breakpoints */
  @media (max-width: 640px) {
    .project-grid {
      grid-template-columns: 1fr;
      gap: var(--space-4);
      padding: var(--space-4);
    }
  }

  @media (min-width: 641px) and (max-width: 1024px) {
    .project-grid {
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: var(--space-5);
    }
  }

  @media (min-width: 1025px) {
    .project-grid {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    }
  }

  /* Reduce motion for accessibility */
  @media (prefers-reduced-motion: reduce) {
    .project-card-skeleton {
      animation: none;
    }
  }
`;

if (!document.head.querySelector("style[data-project-grid-styles]")) {
  style.setAttribute("data-project-grid-styles", "true");
  document.head.appendChild(style);
}
