import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './Dashboard'; // Import existing Dashboard component

/**
 * Dashboard Page - Container for dashboard routes
 * 
 * Temporary implementation for Phase 2 routing setup.
 * Will be replaced with full dashboard layout in Phase 3.
 * 
 * Route Structure:
 * - /dashboard → redirect to /dashboard/recent
 * - /dashboard/recent → Recent projects (default)
 * - /dashboard/all → All projects (future)
 * - /dashboard/trash → Trash (future)
 * - /dashboard/settings → Settings (future)
 */
const DashboardPage: React.FC = () => {
  return (
    <Routes>
      {/* Default redirect to recent */}
      <Route path="/" element={<Navigate to="/dashboard/recent" replace />} />
      
      {/* Recent projects (current dashboard) */}
      <Route path="/recent" element={<Dashboard />} />
      
      {/* Placeholder routes for future implementation */}
      <Route path="/all" element={<DashboardPlaceholder title="All Projects" />} />
      <Route path="/trash" element={<DashboardPlaceholder title="Trash" />} />
      <Route path="/settings" element={<DashboardPlaceholder title="Settings" />} />
      
      {/* Fallback for unknown dashboard routes */}
      <Route path="*" element={<Navigate to="/dashboard/recent" replace />} />
    </Routes>
  );
};

/**
 * Placeholder component for future dashboard sections
 */
const DashboardPlaceholder: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-primary)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: 'var(--text-3xl)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-4)'
        }}>
          {title}
        </h1>
        <p style={{
          fontSize: 'var(--text-lg)',
          color: 'var(--text-secondary)',
          marginBottom: 'var(--space-6)'
        }}>
          Coming soon in Phase 3: Dashboard Implementation
        </p>
        <div style={{
          padding: 'var(--space-4)',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-primary)'
        }}>
          <p style={{ 
            fontSize: 'var(--text-sm)', 
            color: 'var(--text-tertiary)',
            margin: 0
          }}>
            This section will include advanced project management features
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
