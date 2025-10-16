import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../Auth/AuthProvider";
import { Button, Avatar } from "../shared";

interface SidebarProps {
  /** Whether sidebar is open (mobile) */
  isOpen: boolean;
  /** Function to close sidebar */
  onClose: () => void;
}

/**
 * Dashboard Sidebar - Navigation and user profile
 *
 * Features:
 * - Logo and branding
 * - Create new project button
 * - Navigation links with active states
 * - User profile section
 * - Sign out functionality
 * - Mobile responsive with overlay
 */
export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleCreateProject = () => {
    // Generate a unique slug for new project
    const timestamp = Date.now();
    const newProjectSlug = `untitled-${timestamp}`;
    navigate(`/canvas/${newProjectSlug}`);
    onClose(); // Close mobile menu
  };

  const navigationItems = [
    {
      path: "/dashboard/recent",
      label: "Recent",
      icon: "⏱",
    },
    {
      path: "/dashboard/all",
      label: "All Projects",
      icon: "▤",
    },
    {
      path: "/dashboard/trash",
      label: "Trash",
      icon: "🗑",
    },
    {
      path: "/dashboard/settings",
      label: "Settings",
      icon: "⚙",
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
      {/* Logo Section */}
      <div className="sidebar-header">
        <Link to="/dashboard/recent" className="sidebar-logo" onClick={onClose}>
          <h1>HØRIZON</h1>
        </Link>
      </div>

      {/* Create Button */}
      <div className="sidebar-create">
        <Button
          variant="primary"
          fullWidth
          onClick={handleCreateProject}
          icon="+"
        >
          Create New Project
        </Button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navigationItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${
              isActive(item.path) ? "nav-item-active" : ""
            }`}
            onClick={onClose}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User Profile Section */}
      <div className="sidebar-footer">
        <div className="user-profile">
          <Avatar
            src={user?.photoURL}
            name={user?.displayName || user?.email || "User"}
            size="md"
          />
          <div className="user-info">
            <div className="user-name">
              {user?.displayName || user?.email?.split("@")[0] || "User"}
            </div>
            <div className="user-email">{user?.email}</div>
          </div>
        </div>

        <Button variant="ghost" size="sm" fullWidth onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
    </aside>
  );
};

// Add sidebar styles
const style = document.createElement("style");
style.textContent = `
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 240px;
    height: 100vh;
    background-color: var(--bg-elevated);
    border-right: 1px solid var(--border-primary);
    display: flex;
    flex-direction: column;
    z-index: var(--z-fixed);
    transform: translateX(-100%);
    transition: transform var(--duration-normal) var(--ease-out);
  }

  .sidebar-open {
    transform: translateX(0);
  }

  .sidebar-header {
    padding: var(--space-6) var(--space-4);
    border-bottom: 1px solid var(--border-primary);
  }

  .sidebar-logo {
    text-decoration: none;
    color: var(--text-primary);
  }

  .sidebar-logo h1 {
    font-size: var(--text-xl);
    font-weight: var(--font-bold);
    margin: 0;
    color: var(--brand-primary);
  }

  .sidebar-create {
    padding: var(--space-4);
    border-bottom: 1px solid var(--border-primary);
  }

  .sidebar-nav {
    flex: 1;
    padding: var(--space-4) 0;
    overflow-y: auto;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    color: var(--text-secondary);
    text-decoration: none;
    transition: all var(--duration-fast) var(--ease-out);
    border-left: 3px solid transparent;
  }

  .nav-item:hover {
    background-color: var(--interactive-secondary);
    color: var(--text-primary);
  }

  .nav-item-active {
    background-color: var(--interactive-secondary);
    color: var(--interactive-primary);
    border-left-color: var(--interactive-primary);
    font-weight: var(--font-medium);
  }

  .nav-icon {
    font-size: var(--text-lg);
    width: 24px;
    text-align: center;
    color: inherit;
    filter: grayscale(1);
  }

  .nav-label {
    font-size: var(--text-sm);
  }

  .sidebar-footer {
    padding: var(--space-4);
    border-top: 1px solid var(--border-primary);
    gap: var(--space-4);
    display: flex;
    flex-direction: column;
  }

  .user-profile {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .user-info {
    flex: 1;
    min-width: 0;
  }

  .user-name {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-email {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Desktop styles */
  @media (min-width: 769px) {
    .sidebar {
      position: fixed;
      transform: translateX(0);
    }
  }

  /* Mobile styles */
  @media (max-width: 768px) {
    .sidebar {
      width: 280px;
      box-shadow: var(--shadow-xl);
    }
  }
`;

if (!document.head.querySelector("style[data-sidebar-styles]")) {
  style.setAttribute("data-sidebar-styles", "true");
  document.head.appendChild(style);
}
