// src/components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { useAuth }   from '../../hooks/useAuth';
import { useRights } from '../../hooks/useRights';

const base     = 'flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors';
const active   = 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 pl-3.5';
const inactive = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';

const linkClass = ({ isActive }) => `${base} ${isActive ? active : inactive}`;

export default function Sidebar() {
  const { currentUser } = useAuth();
  const {
    canViewReports,
    canViewTopSelling,
    canManageUsers,
  } = useRights();

  const userType       = currentUser?.user_type ?? 'USER';
  const canViewDeleted = ['ADMIN', 'SUPERADMIN'].includes(userType);
  const isAdminOrAbove = ['ADMIN', 'SUPERADMIN'].includes(userType);  // ← NEW

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col py-4 shrink-0 h-full">
      <nav className="flex flex-col gap-1 px-2">

        {isAdminOrAbove && (
        <NavLink to="/dashboard" className={linkClass}>
          🏠 Dashboard
        </NavLink>
        )}

        {/* Products — always visible */}
        <NavLink to="/products" className={linkClass}>
          📦 Products
        </NavLink>

        {/* Reports (REP_001) */}
        {canViewReports && (
          <NavLink to="/reports" end className={linkClass}>
            📊 Reports
          </NavLink>
        )}

        {/* Top Selling (REP_002) — SUPERADMIN only */}
        {canViewTopSelling && (
          <NavLink to="/reports/top-selling" className={linkClass}>
            🏆 Top Selling
          </NavLink>
        )}

        {/* Deleted Items — ADMIN and SUPERADMIN */}
        {canViewDeleted && (
          <NavLink to="/deleted-items" className={linkClass}>
            🗑 Deleted Items
          </NavLink>
        )}

        {/* Admin / User Management — ADM_USER = 1 */}
        {canManageUsers && (
          <NavLink to="/admin" className={linkClass}>
            ⚙ Admin
          </NavLink>
        )}

        {/* Activity Log — all authenticated users */}
        <NavLink to="/activity-log" className={linkClass}>
          📋 Activity Log
        </NavLink>

      </nav>
    </aside>
  );
}