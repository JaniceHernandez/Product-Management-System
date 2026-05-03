// src/components/layout/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth }   from '../../hooks/useAuth';
import { useRights } from '../../hooks/useRights';

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || 'U';
}

const base     = 'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150';
const active   = 'bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white shadow-md';
const inactive = 'text-gray-500 hover:bg-pink-50 hover:text-pink-700';

export default function Sidebar({ onNavigate }) {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const { canViewReports, canViewTopSelling, canManageUsers } = useRights();

  const userType       = currentUser?.user_type ?? 'USER';
  const displayName    = currentUser?.username || currentUser?.email || 'User';
  const isAdminOrAbove = ['ADMIN', 'SUPERADMIN'].includes(userType);

  async function handleLogout() {
    onNavigate?.();
    await signOut();
    navigate('/login', { replace: true });
  }

  const makeClass = ({ isActive }) =>
    `${base} ${isActive ? active : inactive}`;

  const roleBadge = {
    SUPERADMIN: 'bg-pink-100 text-pink-600 border border-pink-200',
    ADMIN:      'bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200',
    USER:       'bg-gray-100 text-gray-500 border border-gray-200',
  }[userType] ?? 'bg-gray-100 text-gray-500';

  return (
    <aside className="w-60 bg-white border-r border-pink-100 flex flex-col shrink-0 h-full">

      {/* ── Brand ── */}
      <div className="hidden lg:flex px-5 py-4 border-b border-pink-50 items-center gap-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #ec4899, #d946ef)', boxShadow: '0 4px 12px rgba(236,72,153,0.35)' }}
        >
          <span className="text-white text-xs font-bold">H</span>
        </div>
        <span className="text-sm font-bold text-gray-800 tracking-tight">HopePMS</span>
        <div className="ml-auto flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
          <span className="text-xs text-pink-300 font-medium">live</span>
        </div>
      </div>

      {/* ── User profile block ── */}
      <div className="px-4 py-4 border-b border-pink-50">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #f472b6, #c026d3)', boxShadow: '0 2px 8px rgba(236,72,153,0.3)' }}
          >
            <span className="text-white text-sm font-bold">{getInitials(displayName)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
            <span className={`inline-flex items-center px-1.5 py-px rounded-md text-xs font-semibold mt-0.5 ${roleBadge}`}>
              {userType}
            </span>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">

        {isAdminOrAbove && (
          <NavLink to="/dashboard" className={makeClass} onClick={onNavigate}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </NavLink>
        )}

        <NavLink to="/products" className={makeClass} onClick={onNavigate}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Products
        </NavLink>

        {canViewReports && (
          <NavLink to="/reports" end className={makeClass} onClick={onNavigate}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Reports
          </NavLink>
        )}

        {(canManageUsers || isAdminOrAbove) && (
          <div className="pt-4 pb-1">
            <p className="px-3 text-xs font-bold text-pink-300 uppercase tracking-widest">Admin</p>
          </div>
        )}

        {canManageUsers && (
          <NavLink to="/admin" className={makeClass} onClick={onNavigate}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            User Management
          </NavLink>
        )}

        {isAdminOrAbove && (
          <NavLink to="/activity-log" className={makeClass} onClick={onNavigate}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Activity Log
          </NavLink>
        )}

      </nav>

      {/* ── Bottom: Settings + Logout ── */}
      <div className="px-3 py-3 border-t border-pink-50 space-y-0.5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-all duration-150"
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