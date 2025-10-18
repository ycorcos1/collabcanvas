import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../../hooks/useProjects";
import { useAuth } from "../Auth/AuthProvider";
import { ProjectGrid } from "./ProjectGrid";
import { Button, Input } from "../shared";
import { generateProjectSlug } from "../../utils/projectUtils";

/**
 * All Projects View - Shows all user projects with search and pagination
 *
 * Features:
 * - Search functionality
 * - Pagination with load more
 * - Project filtering and sorting
 * - Bulk actions (future)
 */
export const AllProjects: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"updatedAt" | "createdAt" | "name">(
    "updatedAt"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Memoize options to prevent unnecessary re-renders
  const projectOptions = useMemo(
    () => ({
      searchQuery,
      orderBy: sortBy,
      orderDirection: sortDirection,
      limit: 12,
    }),
    [searchQuery, sortBy, sortDirection]
  );

  const {
    projects,
    isLoading,
    error,
    hasMore,
    hasInitialized,
    openProject,
    renameProject,
    deleteProject,
    loadMore,
    refresh,
  } = useProjects(projectOptions);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSortChange = (field: "updatedAt" | "createdAt" | "name") => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("desc");
    }
  };

  const handleCreateProject = () => {
    // Generate a unique project ID/slug for new project
    const newProjectSlug = generateProjectSlug();
    navigate(`/canvas/${newProjectSlug}`);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadMore();
    }
  };

  const getSortIcon = (field: "updatedAt" | "createdAt" | "name") => {
    if (sortBy !== field) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const getSortLabel = (field: "updatedAt" | "createdAt" | "name") => {
    switch (field) {
      case "updatedAt":
        return "Last Modified";
      case "createdAt":
        return "Date Created";
      case "name":
        return "Name";
    }
  };

  // Empty state for search results
  const EmptySearchState = () => (
    <div className="all-projects-empty">
      <div className="empty-search-icon">⌕</div>
      <h3>No projects found</h3>
      <p>
        No projects match your search for "{searchQuery}". Try adjusting your
        search terms.
      </p>
      <Button variant="ghost" onClick={() => setSearchQuery("")}>
        Clear Search
      </Button>
    </div>
  );

  // Empty state for no projects - same as Recent Projects welcome state
  const EmptyProjectsState = () => (
    <div className="all-projects-empty-welcome">
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

  if (error && hasInitialized) {
    return (
      <div className="all-projects-error">
        <h2>Unable to load projects</h2>
        <p>{error}</p>
        <Button variant="secondary" onClick={refresh}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="all-projects">
      {/* Header */}
      <div className="all-projects-header">
        <div className="header-content">
          <h1>All Projects</h1>
          <p>Manage and organize all your projects</p>
        </div>
      </div>

      {/* Controls */}
      <div className="all-projects-controls">
        {/* Search */}
        <div className="search-section">
          <Input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={handleSearchChange}
            icon="⌕"
          />
        </div>

        {/* Sort Options */}
        <div className="sort-section">
          <span className="sort-label">Sort by:</span>
          <div className="sort-buttons">
            {(["updatedAt", "createdAt", "name"] as const).map((field) => (
              <button
                key={field}
                className={`sort-button ${
                  sortBy === field ? "sort-button-active" : ""
                }`}
                onClick={() => handleSortChange(field)}
              >
                {getSortLabel(field)} {getSortIcon(field)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <ProjectGrid
        projects={projects}
        isLoading={!hasInitialized && isLoading}
        emptyState={searchQuery ? <EmptySearchState /> : <EmptyProjectsState />}
        onOpenProject={openProject}
        onRenameProject={renameProject}
        onDeleteProject={deleteProject}
        currentUserId={user?.id}
      />

      {/* Load More */}
      {hasMore && projects.length > 0 && (
        <div className="all-projects-load-more">
          <Button
            variant="ghost"
            size="lg"
            onClick={handleLoadMore}
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load More Projects"}
          </Button>
        </div>
      )}

      {/* Results Info */}
      {projects.length > 0 && (
        <div className="all-projects-info">
          <p>
            Showing {projects.length} project{projects.length !== 1 ? "s" : ""}
            {searchQuery && ` matching "${searchQuery}"`}
            {hasMore && " • Load more to see additional projects"}
          </p>
        </div>
      )}
    </div>
  );
};

// Add all projects styles
const style = document.createElement("style");
style.textContent = `
  .all-projects {
    min-height: 100vh;
    background-color: var(--bg-primary);
  }

  .all-projects-header {
    padding: var(--space-8) var(--space-6) var(--space-4);
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

  .all-projects-controls {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-6);
    border-bottom: 1px solid var(--border-primary);
    background-color: var(--bg-secondary);
  }

  .search-section {
    flex: 1;
    max-width: 400px;
  }

  .sort-section {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  .sort-label {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
    white-space: nowrap;
  }

  .sort-buttons {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .sort-button {
    padding: var(--space-2) var(--space-3);
    background: var(--bg-elevated);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-out);
    white-space: nowrap;
  }

  .sort-button:hover {
    background-color: var(--interactive-secondary);
    color: var(--text-primary);
  }

  .sort-button-active {
    background-color: var(--interactive-primary);
    color: var(--text-inverse);
    border-color: var(--interactive-primary);
  }

  .sort-button-active:hover {
    background-color: var(--interactive-primary-hover);
  }

  .all-projects-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--space-16) var(--space-8);
    max-width: 400px;
    margin: 0 auto;
  }

  .empty-search-icon,
  .empty-projects-icon {
    font-size: 4rem;
    margin-bottom: var(--space-6);
    opacity: 0.6;
  }

  .all-projects-empty h3 {
    font-size: var(--text-xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--space-3) 0;
  }

  .all-projects-empty p {
    font-size: var(--text-base);
    color: var(--text-secondary);
    line-height: var(--leading-relaxed);
    margin: 0 0 var(--space-6) 0;
  }

  /* Welcome state styles - same as Recent Projects */
  .all-projects-empty-welcome {
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

  .all-projects-empty-welcome h2 {
    font-size: var(--text-2xl);
    font-weight: var(--font-bold);
    color: var(--text-primary);
    margin: 0 0 var(--space-4) 0;
  }

  .all-projects-empty-welcome p {
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

  .all-projects-load-more {
    display: flex;
    justify-content: center;
    padding: var(--space-6);
    border-top: 1px solid var(--border-primary);
  }

  .all-projects-info {
    display: flex;
    justify-content: center;
    padding: var(--space-4) var(--space-6);
    border-top: 1px solid var(--border-primary);
    background-color: var(--bg-secondary);
  }

  .all-projects-info p {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    margin: 0;
    text-align: center;
  }

  .all-projects-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--space-16) var(--space-8);
    min-height: 50vh;
  }

  .all-projects-error h2 {
    font-size: var(--text-2xl);
    font-weight: var(--font-bold);
    color: var(--status-error);
    margin: 0 0 var(--space-4) 0;
  }

  .all-projects-error p {
    font-size: var(--text-base);
    color: var(--text-secondary);
    margin: 0 0 var(--space-6) 0;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .all-projects-header {
      padding: var(--space-6) var(--space-4);
    }

    .header-content h1 {
      font-size: var(--text-2xl);
    }

    .header-content p {
      font-size: var(--text-base);
    }

    .all-projects-controls {
      padding: var(--space-4);
    }

    .sort-section {
      flex-direction: column;
      align-items: flex-start;
    }

    .sort-buttons {
      width: 100%;
    }

    .sort-button {
      flex: 1;
      text-align: center;
    }

    .all-projects-empty {
      padding: var(--space-12) var(--space-4);
    }

    .all-projects-empty-welcome {
      padding: var(--space-12) var(--space-4);
    }

    .empty-canvas {
      width: 160px;
      height: 100px;
    }
  }

  /* Large screen optimizations */
  @media (min-width: 1024px) {
    .all-projects-controls {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }

    .search-section {
      max-width: 500px;
    }
  }
`;

if (!document.head.querySelector("style[data-all-projects-styles]")) {
  style.setAttribute("data-all-projects-styles", "true");
  document.head.appendChild(style);
}
