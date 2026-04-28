// src/components/layout/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth }   from '../../hooks/useAuth';
import { useRights } from '../../hooks/useRights';

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || 'U';
}

const base     = 'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150';
const active   = 'bg-blue-600 text-white shadow-sm';
const inactive = 'text-gray-500 hover:bg-gray-100 hover:text-gray-800';

const linkClass = ({ isActive }) => `${base} ${isActive ? active : inactive}`;

const bottomLink = 'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-all duration-150';

export default function Sidebar() {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const {
    canViewReports,
    canViewTopSelling,
    canManageUsers,
  } = useRights();

  const userType       = currentUser?.user_type ?? 'USER';
  const displayName    = currentUser?.username || currentUser?.email || 'User';
  const canViewDeleted = ['ADMIN', 'SUPERADMIN'].includes(userType);
  const isAdminOrAbove = ['ADMIN', 'SUPERADMIN'].includes(userType);

  async function handleLogout() {
    await signOut();
    navigate('/login', { replace: true });
  }

  // Role badge style
  const roleBadge = {
    SUPERADMIN: 'bg-purple-100 text-purple-700',
    ADMIN:      'bg-blue-100 text-blue-700',
    USER:       'bg-gray-100 text-gray-500',
  }[userType] ?? 'bg-gray-100 text-gray-500';

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col shrink-0 h-full">

      {/* ── User profile block ── */}
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">{getInitials(displayName)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
            <span className={`inline-flex items-center px-1.5 py-px rounded text-xs font-semibold mt-0.5 ${roleBadge}`}>
              {userType}
            </span>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">

        {/* Dashboard — ADMIN and SUPERADMIN only */}
        {isAdminOrAbove && (
          <NavLink to="/dashboard" className={linkClass}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </NavLink>
        )}

        {/* Products — always visible */}
        <NavLink to="/products" className={linkClass}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Products
        </NavLink>

        {/* Reports (REP_001) */}
        {canViewReports && (
          <NavLink to="/reports" end className={linkClass}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Reports
          </NavLink>
        )}

        {/* Top Selling (REP_002) — SUPERADMIN only */}
        {canViewTopSelling && (
          <NavLink to="/reports/top-selling" className={linkClass}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Top Selling
          </NavLink>
        )}

        {/* Section divider — admin area */}
        {(canViewDeleted || canManageUsers || isAdminOrAbove) && (
          <div className="pt-3 pb-1">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Admin</p>
          </div>
        )}

        {/* Deleted Items — ADMIN and SUPERADMIN */}
        {canViewDeleted && (
          <NavLink to="/deleted-items" className={linkClass}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Deleted Items
          </NavLink>
        )}

        {/* User Management — ADM_USER = 1 */}
        {canManageUsers && (
          <NavLink to="/admin" className={linkClass}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            User Management
          </NavLink>
        )}

        {/* Activity Log — ADMIN and SUPERADMIN */}
        {isAdminOrAbove && (
          <NavLink to="/activity-log" className={linkClass}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Activity Log
          </NavLink>
        )}

      </nav>

      {/* ── Bottom: Settings + Logout ── */}
      <div className="px-3 py-3 border-t border-gray-100 space-y-0.5">
        <button className={bottomLink} onClick={() => {}}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>

    </aside>
  );
}