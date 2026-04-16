// src/components/layout/Navbar.jsx
import { useNavigate } from 'react-router-dom';
import { useAuth }     from '../../hooks/useAuth';

export default function Navbar() {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate('/login', { replace: true });
  }

  // Fallback chain: username → email → 'User'
  const displayName = currentUser
    ? (currentUser.username || currentUser.email || 'User')
    : '';

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">

      <span className="text-base font-semibold text-gray-800 tracking-tight">
        Hope PMS
      </span>

      <div className="flex items-center gap-4">
        {displayName && (
          <span className="text-sm text-gray-600">{displayName}</span>
        )}
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-600 transition-colors"
        >
          Logout
        </button>
      </div>

    </header>
  );
}