// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';

import LandingPage        from './pages/LandingPage';
import LoginPage          from './pages/LoginPage';
import AuthCallbackPage   from './pages/AuthCallbackPage';
import ProductsPage       from './pages/ProductsPage';
import AdminPage          from './pages/AdminPage';
import DeletedItemsPage   from './pages/DeletedItemsPage';
import ProductReportPage  from './pages/ProductReportPage';
import UserManagementPage from './pages/UserManagementPage';
import AppLayout          from './components/layout/AppLayout';
import ProtectedRoute     from './components/ProtectedRoute';
import RoleRoute          from './components/RoleRoute';
import ActivityLogPage    from './pages/ActivityLogPage';
import DashboardPage      from './pages/DashboardPage';

export default function App() {
  return (
    <Routes>
      {/* Public */}

      {/*
        / → LandingPage (mobile/tablet hero with Sign In button)
              LandingPage self-redirects to /login on desktop (lg+)
              so desktop users always land on the split-view login.
      */}
      <Route path="/"              element={<LandingPage />} />
      <Route path="/login"         element={<LoginPage />} />
      <Route path="/register"      element={<Navigate to="/login" replace />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Protected — session required */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout><DashboardPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/products" element={
        <ProtectedRoute>
          <AppLayout><ProductsPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/reports" element={
        <ProtectedRoute>
          <AppLayout><ProductReportPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/reports/top-selling" element={<Navigate to="/reports" replace />} />

      <Route path="/admin" element={
        <ProtectedRoute>
          <AppLayout><UserManagementPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/deleted-items" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
            <AppLayout><DeletedItemsPage /></AppLayout>
          </RoleRoute>
        </ProtectedRoute>
      } />

      <Route path="/activity-log" element={
        <ProtectedRoute>
          <AppLayout><ActivityLogPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}