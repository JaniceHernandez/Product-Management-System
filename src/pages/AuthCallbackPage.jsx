// src/pages/AuthCallbackPage.jsx
import { useState } from 'react';

export default function AuthCallbackPage() {
  // status: 'loading' | 'error'
  // M4 (S1-T13) will set status to 'error' if the OAuth exchange fails,
  // or will navigate away on success — so the loading state is the normal visible state.
  const [status, _setStatus] = useState('loading');
  const [errorMessage, _setErrorMessage] = useState('');

  // ── M4 handoff block ─────────────────────────────────────────
  // TODO (M4 — S1-T13): Add useEffect here to handle the OAuth callback.
  // M4 will import { useEffect } from 'react' and { useNavigate } from 'react-router-dom'
  // and { supabase } from '../lib/supabaseClient', then:
  // 1. Rename _setStatus → setStatus and _setErrorMessage → setErrorMessage
  // 2. Implement:
  //
  // useEffect(() => {
  //   const { data: { subscription } } = supabase.auth.onAuthStateChange(
  //     async (event, session) => {
  //       if (event === 'SIGNED_IN' && session) {
  //         const { data: userRow } = await supabase
  //           .from('user')
  //           .select('record_status')
  //           .eq('userId', session.user.id)
  //           .single();
  //
  //         if (userRow?.record_status === 'ACTIVE') {
  //           navigate('/products');
  //         } else {
  //           await supabase.auth.signOut();
  //           navigate('/login?error=not_activated');
  //         }
  //       } else if (event === 'SIGNED_OUT' || !session) {
  //         setStatus('error');
  //         setErrorMessage('Sign-in failed. Please try again.');
  //       }
  //     }
  //   );
  //   return () => subscription.unsubscribe();
  // }, [navigate]);

  // ── Loading state ────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">

        {/* Spinner */}
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />

        {/* Status text */}
        <p className="text-sm text-gray-600 font-medium">Signing you in…</p>
        <p className="text-xs text-gray-400">Please wait while we verify your account.</p>

      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8 text-center">

        <div className="text-red-500 text-4xl mb-3">✕</div>

        <h2 className="text-lg font-bold text-gray-800 mb-2">Sign-in Failed</h2>

        <p className="text-sm text-gray-500 mb-6">
          {errorMessage || 'Something went wrong during sign-in. Please try again.'}
        </p>

        <a
          href="/login"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Back to Login
        </a>

      </div>
    </div>
  );
}