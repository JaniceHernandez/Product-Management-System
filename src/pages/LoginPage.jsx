// src/pages/LoginPage.jsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';

export default function LoginPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Show activation error when redirected from login guard
  const activationError = searchParams.get('error') === 'not_activated'
    ? 'Your account is pending activation by an administrator.'
    : '';

  // Redirect to /products if already logged in
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
      },
    });
    if (error) {
      console.error('Google sign-in error:', error.message);
    }
  }

  // Show spinner while auth state is loading
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

        {/* Activation error — shown when redirected from ProtectedRoute or AuthCallbackPage */}
        {activationError && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {activationError}
          </div>
        )}

        {/* Google Sign-In — only auth method */}
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