import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

import { LoginPage } from './pages/LoginPage';
import { ReportEditorPage } from './pages/ReportEditorPage';
import { ReportHistoryPage } from './pages/ReportHistoryPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { ManagerDashboardPage } from './pages/ManagerDashboardPage';
import { ManagerReviewPage } from './pages/ManagerReviewPage';
import { TeamMembersPage } from './pages/TeamMembersPage';
import { ProjectsPage } from './pages/ProjectsPage';

// Root redirector based on authenticated role
const IndexRedirect: React.FC = () => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center text-surface-400">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={role === 'MANAGER' ? '/dashboard' : '/reports/mine'} replace />;
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<LoginPage />} />

          {/* Root Redirect */}
          <Route path="/" element={<IndexRedirect />} />

          {/* Protected Application Routes inside AppLayout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Team Member & Shared Routes */}
            <Route path="/reports/mine" element={<ReportHistoryPage />} />
            <Route path="/reports/new" element={<ReportEditorPage />} />
            <Route path="/reports/:id/edit" element={<ReportEditorPage />} />
            <Route path="/reports/:id" element={<ReportDetailPage />} />
            <Route path="/projects" element={<ProjectsPage />} />

            {/* Manager-Only Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole="MANAGER">
                  <ManagerDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute requiredRole="MANAGER">
                  <ManagerDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/:id/review"
              element={
                <ProtectedRoute requiredRole="MANAGER">
                  <ManagerReviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/team"
              element={
                <ProtectedRoute requiredRole="MANAGER">
                  <TeamMembersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/team/:id"
              element={
                <ProtectedRoute requiredRole="MANAGER">
                  <TeamMembersPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback 404 Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
