// src/components/layout/Navbar.jsx
import { useNavigate } from 'react-router-dom';
import { useAuth }     from '../../hooks/useAuth';

// Generate avatar initials from a name or email
function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || 'U';
}

// Role badge colour
function roleBadgeClass(userType) {
  if (userType === 'SUPERADMIN') return 'bg-purple-100 text-purple-700 border border-purple-200';
  if (userType === 'ADMIN')      return 'bg-blue-100 text-blue-700 border border-blue-200';
  return 'bg-gray-100 text-gray-600 border border-gray-200';
}

export default function Navbar() {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate('/login', { replace: true });
  }

  const displayName = currentUser
    ? (currentUser.username || currentUser.email || 'User')
    : '';

  const userType = currentUser?.user_type ?? '';

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-10">

      {/* Left — Brand */}
      <div className="flex items-center gap-3">
        {/* Logo mark */}
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold tracking-tight">H</span>
        </div>
        <span className="text-sm font-bold text-gray-800 tracking-tight">
          HopePMS
        </span>
        {/* System status pill */}
        <div className="hidden sm:flex items-center gap-1.5 ml-2 px-2.5 py-0.5 rounded-full bg-green-50 border border-green-200">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-600 font-medium">All systems operational</span>
        </div>
      </div>

      {/* Right — User area */}
      <div className="flex items-center gap-3">

        {/* Notification bell — placeholder */}
        <button
          aria-label="Notifications"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors relative"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-9.33-5 6 6 0 00-2.67 5v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        {/* Settings icon — placeholder */}
        <button
          aria-label="Settings"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200" />

        {/* User info */}
        {displayName && (
          <div className="flex items-center gap-2.5">
            {/* Avatar circle */}
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-semibold">
                {getInitials(displayName)}
              </span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-800 leading-tight">{displayName}</p>
              {userType && (
                <span className={`inline-flex items-center px-1.5 py-px rounded text-xs font-semibold ${roleBadgeClass(userType)}`}>
                  {userType}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>

    </header>
  );
}