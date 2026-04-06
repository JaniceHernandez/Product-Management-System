// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Public pages
import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import AuthCallbackPage from './pages/AuthCallbackPage';

// Protected pages
import ProductsPage     from './pages/ProductsPage';
import ReportsPage      from './pages/ReportsPage';
import AdminPage        from './pages/AdminPage';
import DeletedItemsPage from './pages/DeletedItemsPage';

// Shell + guard
import AppLayout        from './components/layout/AppLayout';
import ProtectedRoute   from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ── Public routes — no shell ── */}
        <Route path="/login"         element={<LoginPage />} />
        <Route path="/register"      element={<RegisterPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* ── Protected routes — wrapped in AppLayout ── */}
        <Route path="/products" element={
          <ProtectedRoute>
            <AppLayout>
              <ProductsPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/reports" element={
          <ProtectedRoute>
            <AppLayout>
              <ReportsPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute>
            <AppLayout>
              <AdminPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/deleted-items" element={
          <ProtectedRoute>
            <AppLayout>
              <DeletedItemsPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}