// src/components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

// Reusable NavLink style — active link gets a blue left border + background
const linkClass = ({ isActive }) =>
  `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  }`;

export default function Sidebar() {
  const { currentUser } = useAuth();

  // ── Role-based visibility ────────────────────────────────────
  // From project guide Section 8.8:
  // "Deleted Items" is visible only to ADMIN and SUPERADMIN
  const canViewDeleted =
    currentUser &&
    ['ADMIN', 'SUPERADMIN'].includes(currentUser.user_type);

  // "Admin" link: gated by ADM_USER right — placeholder for now.
  // M4 (S2-T13) will replace this with: rights.ADM_USER === 1
  // from UserRightsContext once it is built in Sprint 2.
  const canViewAdmin =
    currentUser && currentUser.user_type === 'SUPERADMIN';

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col py-4 shrink-0">

      <nav className="flex flex-col gap-1 px-2">

        {/* ── Always visible ── */}
        <NavLink to="/products" className={linkClass}>
          Products
        </NavLink>

        <NavLink to="/reports" className={linkClass}>
          Reports
        </NavLink>

        {/* ── Deleted Items — ADMIN and SUPERADMIN only ── */}
        {/* Project guide Section 8.8 — exact gating rule */}
        {canViewDeleted && (
          <NavLink to="/deleted-items" className={linkClass}>
            Deleted Items
          </NavLink>
        )}

        {/* ── Admin — SUPERADMIN only in Sprint 1 placeholder ── */}
        {/* TODO (M4 — S2-T13): replace canViewAdmin with rights.ADM_USER === 1 */}
        {canViewAdmin && (
          <NavLink to="/admin" className={linkClass}>
            Admin
          </NavLink>
        )}

      </nav>

    </aside>
  );
}