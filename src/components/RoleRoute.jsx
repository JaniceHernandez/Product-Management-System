// src/components/RoleRoute.jsx
// Role-based route guard — runs inside ProtectedRoute.
// Checks currentUser.user_type against allowedRoles.
// Users with disallowed roles are silently redirected to /products.
// Redirecting silently (no error message) follows the project guide pattern
// for Deleted Items visibility (Section 8.5).

import { Navigate } from 'react-router-dom';
import { useAuth }  from '../hooks/useAuth';

/**
 * @param {string[]} allowedRoles - e.g. ['ADMIN', 'SUPERADMIN']
 * @param {React.ReactNode} children
 */
export default function RoleRoute({ allowedRoles, children }) {
  const { currentUser } = useAuth();

  // currentUser may be null briefly while profile loads.
  // ProtectedRoute handles the loading state — by the time we get here,
  // currentUser should be populated. If null, deny access as a safe default.
  if (!currentUser) {
    return <Navigate to="/products" replace />;
  }

  if (!allowedRoles.includes(currentUser.user_type)) {
    // Silent redirect — no error message shown (matches project guide Section 8.5)
    return <Navigate to="/products" replace />;
  }

  return children;
}