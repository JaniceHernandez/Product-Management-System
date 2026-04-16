// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth }  from '../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { session, loading, currentUser } = useAuth();

  // Still loading session — show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No session — redirect to login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // currentUser is null even though session exists — data didn't load
  // Wait a moment and redirect to login for a fresh attempt
  if (!currentUser) {
    console.warn('ProtectedRoute — session exists but currentUser is null');
    return <Navigate to="/login?error=session_invalid" replace />;
  }

  // currentUser exists and is explicitly INACTIVE — block access
  if (currentUser.record_status === 'INACTIVE') {
    console.warn('ProtectedRoute — user is INACTIVE', currentUser);
    return <Navigate to="/login?error=not_activated" replace />;
  }

  // If record_status is null (still loading) — show loading spinner, don't render children
  if (currentUser.record_status === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // User is ACTIVE or valid — allow access
  return children;
}