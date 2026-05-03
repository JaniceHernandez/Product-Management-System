// src/pages/AuthCallbackPage.jsx
import { useEffect, useRef } from 'react';
import { useNavigate }       from 'react-router-dom';
import { useAuth }           from '../hooks/useAuth';

export default function AuthCallbackPage() {
  const navigate    = useNavigate();
  const { session, loading, currentUser, refetchProfile, signOut } = useAuth();
  const attemptRef  = useRef(0);
  const maxAttempts = 5;
  const signOutRef  = useRef(false); // prevents double-signout on re-renders

  useEffect(() => {
    if (loading) return;

    // No session — OAuth failed or was cancelled
    if (!session) {
      navigate('/login', { replace: true });
      return;
    }

    // Case 1: Profile loaded, explicitly ACTIVE → go to app
    if (currentUser && currentUser.record_status === 'ACTIVE') {
      const destination =
        ['ADMIN', 'SUPERADMIN'].includes(currentUser.user_type)
          ? '/dashboard'
          : '/products';
      navigate(destination, { replace: true });
      return;
    }

    // Case 2: Profile loaded, explicitly INACTIVE → sign out and block
    // Sign out BEFORE navigating so the session is clear when /login loads.
    // This prevents the stuck loop where re-clicking "Sign in with Google"
    // silently re-authenticates the same blocked account.
    if (currentUser && currentUser.record_status === 'INACTIVE') {
      if (!signOutRef.current) {
        signOutRef.current = true;
        signOut()
          .then(() => navigate('/login?error=not_activated', { replace: true }))
          .catch(err => {
            navigate('/login?error=not_activated', { replace: true });
          });
      }
      return;
    }

    // Case 3: record_status is null (DB row missing or not yet loaded) — retry
    if (attemptRef.current < maxAttempts) {
      attemptRef.current += 1;
      const delay = attemptRef.current * 1000; // 1s, 2s, 3s, 4s, 5s

      const timer = setTimeout(() => {
        refetchProfile();
        // useEffect re-runs when currentUser changes after refetch
      }, delay);

      return () => clearTimeout(timer);
    }

    // Case 4: All retries exhausted — provisioning failed or RLS still blocking
    // Sign out to ensure clean state before showing the error
    if (!signOutRef.current) {
      signOutRef.current = true;
      signOut()
        .then(() => navigate('/login?error=setup_incomplete', { replace: true }))
        .catch(err => {
          navigate('/login?error=setup_incomplete', { replace: true });
        });
    }

  }, [loading, session, currentUser, navigate, refetchProfile, signOut]);

  const attemptMessage = attemptRef.current > 0
    ? `Verifying account… (attempt ${attemptRef.current} of ${maxAttempts})`
    : 'Please wait while we verify your account.';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-600 font-medium">Signing you in…</p>
      <p className="text-xs text-gray-400">{attemptMessage}</p>
    </div>
  );
}