// src/components/layout/Sidebar.jsx
// Sprint 3 final: all sidebar links gated by correct rights and roles.
// No TODOs, no placeholders.
// All gated links use conditional rendering — absent from DOM when not permitted.
import { NavLink } from 'react-router-dom';
import { useAuth }   from '../../hooks/useAuth';
import { useRights } from '../../hooks/useRights';

const base    = 'flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors';
const active  = 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 pl-3.5';
const inactive = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';

const linkClass = ({ isActive }) => `${base} ${isActive ? active : inactive}`;

export default function Sidebar() {
  const { currentUser }  = useAuth();
  const {
    rights,
    canViewReports,       // rights.REP_001 === 1
    canViewTopSelling,    // rights.REP_002 === 1
    canManageUsers,       // rights.ADM_USER === 1
  } = useRights();

  const userType = currentUser?.user_type ?? 'USER';

  // ── Gate: Deleted Items ──────────────────────────────────────
  // Role-based — project guide Section 8.8.
  // Uses user_type directly (not rights map): ADMIN and SUPERADMIN only.
  const canViewDeleted = ['ADMIN', 'SUPERADMIN'].includes(userType);

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col py-4 shrink-0 h-full">
      <nav className="flex flex-col gap-1 px-2">

        {/* Products — always visible to all authenticated users */}
        <NavLink to="/products" className={linkClass}>
          📦 Products
        </NavLink>

        {/* Reports (REP_001) — all user types by default */}
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

        {/* Deleted Items — ADMIN and SUPERADMIN (role-based, not rights-based) */}
        {canViewDeleted && (
          <NavLink to="/deleted-items" className={linkClass}>
            🗑 Deleted Items
          </NavLink>
        )}

        {/* Admin / User Management (ADM_USER = 1) — SUPERADMIN only */}
        {canManageUsers && (
          <NavLink to="/admin" className={linkClass}>
            ⚙ Admin
          </NavLink>
        )}

      </nav>
    </aside>
  );
}