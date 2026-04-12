// src/pages/LoginPage.jsx
// FIXED: Auto-signout when landing on error pages so users are never stuck.
// Google button passes prompt: 'select_account' so a different account can be chosen.
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth }  from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';

export default function LoginPage() {
  const { session, loading, signOut } = useAuth();
  const navigate                      = useNavigate();
  const [searchParams]                = useSearchParams();

  const errorParam = searchParams.get('error');

  const errorMessages = {
    not_activated:    'Your account is pending activation by an administrator.',
    setup_incomplete: 'Your account could not be set up automatically. Please contact an administrator.',
  };

  const displayError = errorMessages[errorParam] ?? '';

  // FIX — Auto-signout on error arrival.
  // When a user is redirected to /login?error=..., their Supabase session
  // may still be active (e.g., if AuthCallbackPage did not sign them out first,
  // or if they navigate directly). Signing out here ensures the session is
  // cleared so clicking "Sign in with Google" starts a fresh flow.
  useEffect(() => {
    if (errorParam && !loading) {
      signOut().catch(err =>
        console.warn('Auto-signout on error page:', err.message)
      );
    }
  }, [errorParam, loading, signOut]);

  // Redirect to /products if already fully signed in with an ACTIVE session
  useEffect(() => {
    if (!loading && session) {
      navigate('/products', { replace: true });
    }
  }, [session, loading, navigate]);

  async function handleGoogleSignIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // Force Google to show account picker every time.
        // Prevents re-authenticating as a blocked account silently.
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) console.error('OAuth initiation error:', error.message);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8 text-center">

        <h1 className="text-2xl font-bold text-gray-800 mb-1">Hope PMS</h1>
        <p className="text-sm text-gray-500 mb-8">Sign in to continue</p>

        {displayError && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 text-left">
            <p className="font-semibold mb-1">⚠️ Sign-in Issue</p>
            <p>{displayError}</p>
            <p className="text-xs mt-2 text-red-500">
              You've been signed out. Please try signing in again, or use a different account.
            </p>
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl text-sm transition-colors"
        >
          <img src="/google-icon.svg" alt="" className="w-5 h-5" />
          Sign in with Google
        </button>

        <p className="mt-6 text-xs text-gray-400">
          New accounts require administrator activation after first sign-in.
        </p>

      </div>
    </div>
  );
}