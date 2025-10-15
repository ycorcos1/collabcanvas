import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Dashboard Layout - Two-column layout with sidebar and main content
 *
 * Features:
 * - Responsive sidebar (collapsible on mobile)
 * - Main content area with React Router Outlet or children
 * - Mobile hamburger menu
 * - Proper z-index and overlay handling
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="dashboard-layout">
      {/* Mobile Menu Button */}
      <button
        className="mobile-menu-button"
        onClick={toggleMobileMenu}
        aria-label="Toggle navigation menu"
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={closeMobileMenu} />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />

      {/* Main Content */}
      <main className="dashboard-main">{children || <Outlet />}</main>
    </div>
  );
};

// Add dashboard layout styles
const style = document.createElement("style");
style.textContent = `
  .dashboard-layout {
    display: flex;
    min-height: 100vh;
    background-color: var(--bg-secondary);
  }

  .mobile-menu-button {
    display: none;
    position: fixed;
    top: var(--space-4);
    left: var(--space-4);
    z-index: var(--z-fixed);
    background: var(--bg-elevated);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    cursor: pointer;
    flex-direction: column;
    gap: 4px;
    width: 44px;
    height: 44px;
    align-items: center;
    justify-content: center;
  }

  .hamburger-line {
    width: 20px;
    height: 2px;
    background-color: var(--text-primary);
    transition: all var(--duration-fast) var(--ease-out);
  }

  .mobile-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--bg-overlay);
    z-index: var(--z-modal-backdrop);
  }

  .dashboard-main {
    flex: 1;
    min-width: 0; /* Prevent flex item from overflowing */
    background-color: var(--bg-primary);
  }

  /* Mobile styles */
  @media (max-width: 768px) {
    .mobile-menu-button {
      display: flex;
    }
    
    .dashboard-main {
      margin-left: 0;
    }
  }

  /* Desktop styles */
  @media (min-width: 769px) {
    .dashboard-main {
      margin-left: 240px; /* Sidebar width */
    }
  }
`;

if (!document.head.querySelector("style[data-dashboard-layout-styles]")) {
  style.setAttribute("data-dashboard-layout-styles", "true");
  document.head.appendChild(style);
}
