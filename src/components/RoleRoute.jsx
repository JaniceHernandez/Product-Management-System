// src/components/RoleRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth }  from '../hooks/useAuth';


export default function RoleRoute({ allowedRoles, children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/products" replace />;
  }

  if (!allowedRoles.includes(currentUser.user_type)) {
    // Silent redirect — no error message shown (matches project guide Section 8.5)
    return <Navigate to="/products" replace />;
  }

  return children;
}