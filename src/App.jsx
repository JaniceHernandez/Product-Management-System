// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
 
// Public pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
 
// Protected pages
import ProductsPage from './pages/ProductsPage';
import ReportsPage from './pages/ReportsPage';
import AdminPage from './pages/AdminPage';
import DeletedItemsPage from './pages/DeletedItemsPage';
 
// Route guard
import ProtectedRoute from './components/ProtectedRoute';
 
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
 
        {/* Default redirect — root path sends to /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
 
        {/* ── Public routes ── */}
        <Route path="/login"          element={<LoginPage />} />
        <Route path="/register"       element={<RegisterPage />} />
        <Route path="/auth/callback"  element={<AuthCallbackPage />} />
 
        {/* ── Protected routes ── */}
        <Route path="/products" element={
          <ProtectedRoute>
            <ProductsPage />
          </ProtectedRoute>
        } />
 
        <Route path="/reports" element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        } />
 
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        } />
 
        <Route path="/deleted-items" element={
          <ProtectedRoute>
            <DeletedItemsPage />
          </ProtectedRoute>
        } />
 
        {/* Catch-all — unknown paths redirect to /login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
 
      </Routes>
    </BrowserRouter>
  );
}