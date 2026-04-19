// src/components/layout/Sidebar.jsx
// Sprint 2 update: real rights-based and role-based gating replaces Sprint 1 placeholders.
// All gated links use conditional rendering — absent from DOM when condition is false.
// Project guide Section 8.8 (Deleted Items), Section 2.2 (rights matrix).
import { NavLink } from 'react-router-dom';
import { useAuth }   from '../../hooks/useAuth';
import { useRights } from '../../hooks/useRights';

const baseLink = 'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors';
const activeStyle  = 'bg-blue-50 text-blue-700 border-l-4 border-blue-600';
const inactiveStyle = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';

const linkClass = ({ isActive }) =>
  `${baseLink} ${isActive ? activeStyle : inactiveStyle}`;

export default function Sidebar() {
  const { currentUser }   = useAuth();
  const { rights, canManageUsers, canViewReports, canViewTopSelling } = useRights();

  const userType = currentUser?.user_type ?? 'USER';

  // ── Gate: Deleted Items ────────────────────────────────────────────
  // Project guide Section 8.8: role-based gate — ADMIN and SUPERADMIN only.
  // Uses user_type directly (not rights map) per prescribed implementation.
  const canViewDeleted = ['ADMIN', 'SUPERADMIN'].includes(userType);

  // ── Gate: Admin ────────────────────────────────────────────────────
  // Right-based: ADM_USER = 1 in UserModule_Rights (SUPERADMIN only per matrix).
  // Replaces Sprint 1 placeholder: currentUser.user_type === 'SUPERADMIN'
  const canViewAdmin = canManageUsers; // rights.ADM_USER === 1

  // ── Gate: Reports (REP_001) ────────────────────────────────────────
  // All three user types have REP_001 = 1 by default.
  // Gated via rights map for future flexibility.
  const canViewReportsList = canViewReports; // rights.REP_001 === 1

  // ── Gate: Top Selling (REP_002) ────────────────────────────────────
  // SUPERADMIN only per rights matrix (ADMIN = 0, USER = 0).
  // Link hidden until Sprint 3 Reports page is built (S3-T03).
  const canViewTopSellingSub = canViewTopSelling; // rights.REP_002 === 1

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col py-4 shrink-0 h-full">
      <nav className="flex flex-col gap-1 px-2">

        {/* ── Products — always visible to all authenticated users ── */}
        <NavLink to="/products" className={linkClass}>
          📦 Products
        </NavLink>

        {/* ── Reports — REP_001 = 1 (all user types by default) ── */}
        {canViewReportsList && (
          <NavLink to="/reports" className={linkClass}>
            📊 Reports
          </NavLink>
        )}

        {/* ── Top Selling — REP_002 = 1 (SUPERADMIN only) ── */}
        {/* Absent from DOM for ADMIN and USER until Sprint 3 page is ready */}
        {canViewTopSellingSub && (
          <NavLink to="/reports/top-selling" className={linkClass}>
            🏆 Top Selling
          </NavLink>
        )}

        {/* ── Deleted Items — ADMIN and SUPERADMIN only ── */}
        {/* Project guide Section 8.8: role-based gate */}
        {canViewDeleted && (
          <NavLink to="/deleted-items" className={linkClass}>
            🗑 Deleted Items
          </NavLink>
        )}

        {/* ── Admin — ADM_USER = 1 only (SUPERADMIN only per matrix) ── */}
        {/* Right-based: replaces Sprint 1 placeholder (user_type === 'SUPERADMIN') */}
        {canViewAdmin && (
          <NavLink to="/admin" className={linkClass}>
            ⚙ Admin
          </NavLink>
        )}

      </nav>
    </aside>
  );
}