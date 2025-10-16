import React from "react";
import { useNavigate } from "react-router-dom";
import { useRecentProjects, useProjects } from "../../hooks/useProjects";
import { ProjectGrid } from "./ProjectGrid";
import { Button } from "../shared";

/**
 * Recent Projects View - Shows the 5 most recently accessed projects
 *
 * Features:
 * - Display recent projects in grid layout
 * - Create new project button
 * - Empty state for new users
 * - Integration with project management hooks
 */
export const RecentProjects: React.FC = () => {
  const navigate = useNavigate();
  const { projects: recentProjects, isLoading, error } = useRecentProjects();
  const { openProject, renameProject, deleteProject } = useProjects();

  const handleCreateProject = () => {
    // Generate a unique slug for new project
    const timestamp = Date.now();
    const newProjectSlug = `untitled-${timestamp}`;
    navigate(`/canvas/${newProjectSlug}`);
  };

  const handleOpenProject = (projectId: string) => {
    openProject(projectId);
  };

  const handleRenameProject = async (projectId: string, newName: string) => {
    await renameProject(projectId, newName);
  };

  const handleDeleteProject = async (projectId: string) => {
    await deleteProject(projectId);
  };

  // Empty state component for users with no projects
  const EmptyState = () => (
    <div className="recent-projects-empty">
      <div className="empty-illustration">
        <div className="empty-canvas">
          <div className="empty-shapes">
            <div className="empty-shape shape-1"></div>
            <div className="empty-shape shape-2"></div>
            <div className="empty-shape shape-3"></div>
          </div>
        </div>
      </div>

      <h2>Welcome to HØRIZON!</h2>
      <p>
        You don't have any projects yet. Create your first project to start
        designing and collaborating with your team in real-time.
      </p>

      <div className="empty-actions">
        <Button
          variant="primary"
          size="lg"
          onClick={handleCreateProject}
          icon="+"
        >
          Create Your First Project
        </Button>
      </div>

      <div className="empty-features">
        <div className="feature-item">
          <span className="feature-icon">✏</span>
          <span className="feature-text">
            Draw shapes and collaborate in real-time
          </span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">👤</span>
          <span className="feature-text">
            See other users' cursors and selections
          </span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">💿</span>
          <span className="feature-text">
            Auto-save and sync across devices
          </span>
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="recent-projects-error">
        <h2>Unable to load projects</h2>
        <p>{error}</p>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="recent-projects">
      {/* Header */}
      <div className="recent-projects-header">
        <div className="header-content">
          <h1>Recent Projects</h1>
          <p>Pick up where you left off</p>
        </div>

        <Button variant="primary" onClick={handleCreateProject} icon="+">
          Create New Project
        </Button>
      </div>

      {/* Projects Grid */}
      <ProjectGrid
        projects={recentProjects}
        isLoading={isLoading}
        emptyState={<EmptyState />}
        onOpenProject={handleOpenProject}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
      />

      {/* View All Link */}
      {recentProjects.length > 0 && (
        <div className="recent-projects-footer">
          <Button variant="ghost" onClick={() => navigate("/dashboard/all")}>
            View All Projects →
          </Button>
        </div>
      )}
    </div>
  );
};

// Add recent projects styles
const style = document.createElement("style");
style.textContent = `
  .recent-projects {
    min-height: 100vh;
    background-color: var(--bg-primary);
  }

  .recent-projects-header {
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

  .recent-projects-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--space-16) var(--space-8);
    max-width: 500px;
    margin: 0 auto;
  }

  .empty-illustration {
    margin-bottom: var(--space-8);
  }

  .empty-canvas {
    width: 200px;
    height: 120px;
    background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
    border: 2px solid var(--border-primary);
    border-radius: var(--radius-lg);
    position: relative;
    overflow: hidden;
    margin: 0 auto var(--space-6);
  }

  .empty-shapes {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .empty-shape {
    position: absolute;
    border-radius: var(--radius-sm);
    opacity: 0.6;
  }

  .shape-1 {
    width: 40px;
    height: 30px;
    background-color: var(--brand-primary);
    top: -20px;
    left: -20px;
    transform: rotate(-15deg);
  }

  .shape-2 {
    width: 30px;
    height: 30px;
    background-color: #FF6B6B;
    top: -10px;
    right: -15px;
    border-radius: var(--radius-full);
  }

  .shape-3 {
    width: 35px;
    height: 25px;
    background-color: #4ECDC4;
    bottom: -15px;
    left: -10px;
    transform: rotate(20deg);
  }

  .recent-projects-empty h2 {
    font-size: var(--text-2xl);
    font-weight: var(--font-bold);
    color: var(--text-primary);
    margin: 0 0 var(--space-4) 0;
  }

  .recent-projects-empty p {
    font-size: var(--text-lg);
    color: var(--text-secondary);
    line-height: var(--leading-relaxed);
    margin: 0 0 var(--space-6) 0;
  }

  .empty-actions {
    margin-bottom: var(--space-8);
  }

  .empty-features {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    max-width: 320px;
    margin: 0 auto;
  }

  .feature-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3);
    background-color: var(--bg-secondary);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-primary);
  }

  .feature-icon {
    font-size: var(--text-xl);
    width: 32px;
    text-align: center;
  }

  .feature-text {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    line-height: var(--leading-relaxed);
  }

  .recent-projects-footer {
    display: flex;
    justify-content: center;
    padding: var(--space-6);
    border-top: 1px solid var(--border-primary);
  }

  .recent-projects-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--space-16) var(--space-8);
    min-height: 50vh;
  }

  .recent-projects-error h2 {
    font-size: var(--text-2xl);
    font-weight: var(--font-bold);
    color: var(--status-error);
    margin: 0 0 var(--space-4) 0;
  }

  .recent-projects-error p {
    font-size: var(--text-base);
    color: var(--text-secondary);
    margin: 0 0 var(--space-6) 0;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .recent-projects-header {
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

    .recent-projects-empty {
      padding: var(--space-12) var(--space-4);
    }

    .empty-canvas {
      width: 160px;
      height: 100px;
    }
  }
`;

if (!document.head.querySelector("style[data-recent-projects-styles]")) {
  style.setAttribute("data-recent-projects-styles", "true");
  document.head.appendChild(style);
}
