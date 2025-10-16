import React, { useState } from "react";
import { CollaborationRequests } from "./CollaborationRequests";
import { ProjectGrid } from "./ProjectGrid";
import { useSharedProjects } from "../../hooks/useSharedProjects";

/**
 * Shared Projects Component - Displays shared projects and collaboration requests
 *
 * Features:
 * - Shared projects grid with host/collaborator indicators
 * - Minimizable collaboration requests component
 * - Multi-user project indicators
 * - Accept/deny request functionality
 */
export const SharedProjects: React.FC = () => {
  const { sharedProjects, collaborationRequests, isLoading } = useSharedProjects();
  const [isRequestsMinimized, setIsRequestsMinimized] = useState(false);

  if (isLoading) {
    return (
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Shared Projects</h1>
          <p>Projects shared between multiple users</p>
        </div>
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading shared projects...</p>
        </div>
      </div>
    );
  }

  // For now, don't show errors - just show empty state if no projects
  // This will be improved once we have proper Firestore setup

  // Empty state component for users with no shared projects
  const EmptyState = () => (
    <div className="shared-projects-empty">
      <div className="empty-illustration">
        <div className="collaboration-icon">👥</div>
      </div>
      
      <div className="empty-content">
        <h2>No Shared Projects</h2>
        <p>
          You don't have any shared projects yet. Projects shared with you or by you will appear here.
        </p>
      </div>

      <div className="empty-features">
        <div className="feature-item">
          <span className="feature-icon">🤝</span>
          <span className="feature-text">
            Collaborate in real-time with team members
          </span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">📤</span>
          <span className="feature-text">
            Share projects and invite collaborators
          </span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">🔄</span>
          <span className="feature-text">
            See live updates from all contributors
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="shared-projects">
      {/* Header */}
      <div className="shared-projects-header">
        <div className="header-content">
          <h1>Shared Projects</h1>
          <p>Projects shared between multiple users</p>
        </div>
      </div>

      {/* Collaboration Requests */}
      <CollaborationRequests
        requests={collaborationRequests}
        isMinimized={isRequestsMinimized}
        onToggleMinimize={() => setIsRequestsMinimized(!isRequestsMinimized)}
      />

      {/* Shared Projects Grid */}
      <ProjectGrid
        projects={sharedProjects}
        isLoading={isLoading}
        emptyState={<EmptyState />}
        showCollaborationIndicators={true}
        showHostIndicators={true}
      />
    </div>
  );
};

// Add shared projects specific styles
const style = document.createElement("style");
style.textContent = `
  .shared-projects {
    padding: var(--space-6);
    min-height: 100vh;
  }

  .shared-projects-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: var(--space-8);
    gap: var(--space-4);
  }

  .shared-projects-header .header-content h1 {
    font-size: var(--text-3xl);
    font-weight: var(--font-bold);
    color: var(--text-primary);
    margin: 0 0 var(--space-2) 0;
  }

  .shared-projects-header .header-content p {
    font-size: var(--text-lg);
    color: var(--text-secondary);
    margin: 0;
  }

  .shared-projects-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--space-16) var(--space-8);
    min-height: 400px;
  }

  .shared-projects-empty .empty-illustration {
    margin-bottom: var(--space-8);
  }

  .shared-projects-empty .collaboration-icon {
    font-size: 4rem;
    opacity: 0.6;
    margin-bottom: var(--space-4);
  }

  .shared-projects-empty .empty-content h2 {
    font-size: var(--text-2xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--space-4) 0;
  }

  .shared-projects-empty .empty-content p {
    font-size: var(--text-lg);
    color: var(--text-secondary);
    margin: 0 0 var(--space-8) 0;
    max-width: 500px;
    line-height: var(--leading-relaxed);
  }

  .shared-projects-empty .empty-features {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    max-width: 400px;
  }

  .shared-projects-empty .feature-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    text-align: left;
  }

  .shared-projects-empty .feature-icon {
    font-size: var(--text-xl);
    flex-shrink: 0;
  }

  .shared-projects-empty .feature-text {
    font-size: var(--text-base);
    color: var(--text-secondary);
    line-height: var(--leading-normal);
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .shared-projects {
      padding: var(--space-4);
    }

    .shared-projects-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .shared-projects-header .header-content h1 {
      font-size: var(--text-2xl);
    }

    .shared-projects-header .header-content p {
      font-size: var(--text-base);
    }

    .shared-projects-empty {
      padding: var(--space-8) var(--space-4);
    }

    .shared-projects-empty .empty-content h2 {
      font-size: var(--text-xl);
    }

    .shared-projects-empty .empty-content p {
      font-size: var(--text-base);
    }
  }
`;

if (!document.head.querySelector("style[data-shared-projects-styles]")) {
  style.setAttribute("data-shared-projects-styles", "");
  document.head.appendChild(style);
}
