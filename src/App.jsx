// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';

import LoginPage        from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import ProductsPage     from './pages/ProductsPage';
import ReportsPage      from './pages/ReportsPage';
import AdminPage        from './pages/AdminPage';
import DeletedItemsPage from './pages/DeletedItemsPage';
import AppLayout        from './components/layout/AppLayout';
import ProtectedRoute   from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/"              element={<Navigate to="/login" replace />} />

      {/* Public routes */}
      <Route path="/login"         element={<LoginPage />} />
      <Route path="/register"      element={<Navigate to="/login" replace />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Protected routes */}
      <Route path="/products" element={
        <ProtectedRoute>
          <AppLayout><ProductsPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <AppLayout><ReportsPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute>
          <AppLayout><AdminPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/deleted-items" element={
        <ProtectedRoute>
          <AppLayout><DeletedItemsPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}