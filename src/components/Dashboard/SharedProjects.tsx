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
  const { sharedProjects, collaborationRequests, isLoading, error } = useSharedProjects();
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

  if (error) {
    return (
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Shared Projects</h1>
          <p>Projects shared between multiple users</p>
        </div>
        <div className="error-container">
          <p>Unable to load shared projects. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>Shared Projects</h1>
        <p>Projects shared between multiple users</p>
      </div>

      {/* Collaboration Requests */}
      <CollaborationRequests
        requests={collaborationRequests}
        isMinimized={isRequestsMinimized}
        onToggleMinimize={() => setIsRequestsMinimized(!isRequestsMinimized)}
      />

      {/* Shared Projects Grid */}
      <div className="projects-section">
        {sharedProjects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3>No Shared Projects</h3>
            <p>
              Projects shared with you or by you will appear here.
              <br />
              Create a project and share it with others to get started!
            </p>
          </div>
        ) : (
          <ProjectGrid 
            projects={sharedProjects} 
            showCollaborationIndicators={true}
            showHostIndicators={true}
          />
        )}
      </div>
    </div>
  );
};
