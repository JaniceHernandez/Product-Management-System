// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { session, loading, currentUser } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!currentUser) {
    // session exists but profile not loaded – wait a moment and retry
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="ml-2 text-sm text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (currentUser.record_status !== 'ACTIVE') {
    return <Navigate to="/login?error=not_activated" replace />;
  }

  return children;
}