// src/pages/LoginPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [errors, setErrors]       = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading]     = useState(false);

  // ── Client-side validation ──────────────────────────────────
  function validate() {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    }

    return newErrors;
  }

  // ── Email / Password submit handler ─────────────────────────
  // M4 (S1-T12) will replace the console.log with the real
  // supabase.auth.signInWithPassword() call.
  async function handleEmailLogin() {
    setFormError('');
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      // TODO (M4 — S1-T12): replace with Supabase signInWithPassword
      console.log('Email login submitted:', { email, password });
    } catch {
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Google OAuth handler ─────────────────────────────────────
  // M4 (S1-T13) will replace the console.log with the real
  // supabase.auth.signInWithOAuth() call.
  async function handleGoogleLogin() {
    setFormError('');

    try {
      // TODO (M4 — S1-T13): replace with Supabase signInWithOAuth
      console.log('Google login triggered');
    } catch {
      setFormError('Google sign-in failed. Please try again.');
    }
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800">Hope PMS</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>

        {/* Form-level error (set by M4 after failed Supabase call) */}
        {formError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {formError}
          </div>
        )}

        {/* ── Email field ── */}
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email}</p>
          )}
        </div>

        {/* ── Password field ── */}
        <div className="mb-6">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
            onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password}</p>
          )}
        </div>

        {/* ── Sign In button ── */}
        <button
          onClick={handleEmailLogin}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        {/* ── OR divider ── */}
        <div className="flex items-center my-5">
          <div className="flex-1 border-t border-gray-200" />
          <span className="mx-3 text-xs text-gray-400 uppercase tracking-wide">or</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* ── Google OAuth button ── */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg text-sm transition-colors"
        >
          <img src="/google-icon.svg" alt="" className="w-4 h-4" />
          Sign in with Google
        </button>

        {/* ── Register link ── */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-medium">
            Register
          </Link>
        </p>

      </div>
    </div>
  );
}