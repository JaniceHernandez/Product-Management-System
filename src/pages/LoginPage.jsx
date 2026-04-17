// src/pages/LoginPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth }  from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';

export default function LoginPage() {
  const { session, loading, currentUser, signOut } = useAuth();
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  const errorParam = searchParams.get('error');

  // Track whether the auto-signout on an error page has already completed.
  // This prevents the redirect useEffect from firing while signout is still
  // in progress, and also prevents double-signout calls.
  const [signedOutForError, setSignedOutForError] = useState(false);

  const errorMessages = {
    not_activated:    'Your account is pending activation by an administrator.',
    setup_incomplete: 'Your account could not be set up automatically. Please contact an administrator.',
  };

  const displayError = errorMessages[errorParam] ?? '';

  // ── Effect 1: Auto-signout when landing on an error URL ──────
  // Only runs when there is an error param in the URL.
  // Signs out, then marks completion so Effect 2 can safely redirect.
  // The auto-redirect to /login (clean) happens after signout resolves.
  useEffect(() => {
    if (!errorParam || loading) return;
    if (signedOutForError) return; // already handled

    signOut()
      .catch(err => console.warn('Auto-signout on error page:', err.message))
      .finally(() => {
        setSignedOutForError(true);
        // Replace the current URL with /login (no error param) so:
        // 1. A page refresh does not re-trigger the error flow
        // 2. The user sees the clean login page after signout
        // Small delay gives React time to process the signout state update
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 100);
      });
  }, [errorParam, loading]); // eslint-disable-line react-hooks/exhaustive-deps
  // signOut and navigate are stable references — omitting to prevent
  // the effect re-running on every render

  // ── Effect 2: Redirect to /products for a valid active session ──
  // Only fires when:
  //   - No error param in URL (clean login page)
  //   - Not currently signing out for an error
  //   - Session confirmed by Supabase
  //   - currentUser is loaded AND has record_status = ACTIVE
  // This ensures a user with a persisted session (hard refresh, new tab)
  // is sent straight to /products without having to click anything.
  useEffect(() => {
    if (loading)       return; // session check still in progress
    if (errorParam)    return; // error page — signout is handling this
    if (!session)      return; // no session — stay on login

    // Wait for the profile to load before checking activation status.
    // currentUser is null while fetchUserProfile is in flight.
    if (!currentUser)  return;

    if (currentUser.record_status === 'ACTIVE') {
      navigate('/products', { replace: true });
    }
    // If record_status is INACTIVE or null, stay on the login page.
    // AuthCallbackPage handles the redirect for those cases during the
    // OAuth flow. If the user somehow arrives here with an INACTIVE
    // session, they just see the login page — which is correct.
  }, [loading, session, currentUser, errorParam, navigate]);

  async function handleGoogleSignIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // Force Google to show account picker every time so the user
        // can choose a different account if their previous one was blocked.
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) console.error('OAuth initiation error:', error.message);
  }

  // Show spinner while:
  // - Initial session check is running (loading = true)
  // - Or an error-param signout is in progress (not yet signedOutForError)
  if (loading || (errorParam && !signedOutForError)) {
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
              You have been signed out. Please try signing in again,
              or use a different account if needed.
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