// src/components/layout/Navbar.jsx
import { useAuth } from '../../hooks/useAuth';

export default function Navbar() {
  const { currentUser, signOut } = useAuth();

  // ── Logout handler ───────────────────────────────────────────
  // M4 (S1-T11) will replace this with the real supabase.auth.signOut()
  // via AuthContext. The stub useAuth() does not expose signOut yet.
  async function handleLogout() {
    if (signOut) {
      await signOut();
    } else {
      // TODO (M4 — S1-T11): signOut will be provided by AuthContext
      console.log('Logout triggered — AuthContext not yet wired');
    }
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">

      {/* App name / logo */}
      <span className="text-base font-semibold text-gray-800 tracking-tight">
        Hope PMS
      </span>

      {/* Right side — user info + logout */}
      <div className="flex items-center gap-4">
        {currentUser && (
          <span className="text-sm text-gray-600">
            {currentUser.username || currentUser.email}
          </span>
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