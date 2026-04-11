// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { session, loading, currentUser } = useAuth();

  // Still determining if a session exists — show spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No Supabase session → redirect to login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Session exists but account is INACTIVE → redirect with error param
  if (currentUser && currentUser.record_status === 'INACTIVE') {
    return <Navigate to="/login?error=not_activated" replace />;
  }

  // Session confirmed — render the page.
  // currentUser may still be null while the profile loads — that is OK.
  // The Navbar will update with the username once fetchUserProfile completes.
  return children;
}