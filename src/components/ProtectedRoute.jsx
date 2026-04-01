import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();

  // Show nothing while the auth session is being checked
  if (loading) {
    return <div>Loading...</div>;
  }

  // Redirect to login if no active session
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
}