import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import AppLayout from '../layouts/AppLayout';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import MemberDashboardPage from '../pages/MemberDashboardPage';
import WeeklyReportPage from '../pages/WeeklyReportPage';
import ReportHistoryPage from '../pages/ReportHistoryPage';
import ManagerDashboardPage from '../pages/ManagerDashboardPage';
import ProjectsPage from '../pages/ProjectsPage';
import ProtectedRoute from './ProtectedRoute';
import PublicOnlyRoute from './PublicOnlyRoute';
import { UserRole } from '../types';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public / Guest Routes */}
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Route>

      {/* Authenticated Application Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Team Member Routes */}
          <Route element={<ProtectedRoute allowedRoles={[UserRole.TEAM_MEMBER]} />}>
            <Route path="/member" element={<MemberDashboardPage />} />
            <Route path="/reports/new" element={<WeeklyReportPage />} />
            <Route path="/reports/history" element={<ReportHistoryPage />} />
          </Route>

          {/* Manager & Admin Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={[UserRole.MANAGER, UserRole.ADMIN]} />
            }
          >
            <Route path="/manager" element={<ManagerDashboardPage />} />
          </Route>

          {/* Shared Authenticated Routes */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  UserRole.TEAM_MEMBER,
                  UserRole.MANAGER,
                  UserRole.ADMIN,
                ]}
              />
            }
          >
            <Route path="/projects" element={<ProjectsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Root & Fallback */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
