import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "../components/Dashboard/DashboardLayout";
import { RecentProjects } from "../components/Dashboard/RecentProjects";
import { SharedProjects } from "../components/Dashboard/SharedProjects";
import { AllProjects } from "../components/Dashboard/AllProjects";
import { TrashProjects } from "../components/Dashboard/TrashProjects";
import { Settings } from "../components/Dashboard/Settings";

/**
 * Dashboard Page - Container for dashboard routes with layout
 *
 * Route Structure:
 * - /dashboard → redirect to /dashboard/recent
 * - /dashboard/recent → Recent projects (current MVP dashboard)
 * - /dashboard/all → All projects (Phase 3)
 * - /dashboard/trash → Trash (Phase 3)
 * - /dashboard/settings → Settings (Phase 3)
 */
const DashboardPage: React.FC = () => {
  return (
    <DashboardLayout>
      <Routes>
        {/* Default redirect to recent */}
        <Route path="/" element={<Navigate to="/dashboard/recent" replace />} />

        {/* Recent projects (new implementation) */}
        <Route path="/recent" element={<RecentProjects />} />

        {/* Shared projects with collaboration requests */}
        <Route path="/shared" element={<SharedProjects />} />

        {/* All projects with pagination */}
        <Route path="/all" element={<AllProjects />} />
        
        {/* Trash system */}
        <Route path="/trash" element={<TrashProjects />} />
        
        {/* Settings page */}
        <Route path="/settings" element={<Settings />} />

        {/* Fallback for unknown dashboard routes */}
        <Route path="*" element={<Navigate to="/dashboard/recent" replace />} />
      </Routes>
    </DashboardLayout>
  );
};


export default DashboardPage;
