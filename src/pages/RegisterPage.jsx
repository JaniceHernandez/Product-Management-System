// src/pages/RegisterPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function RegisterPage() {
  const [firstName,       setFirstName]       = useState('');
  const [lastName,        setLastName]        = useState('');
  const [username,        setUsername]        = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors,          setErrors]          = useState({});
  const [formError,       setFormError]       = useState('');
  const [loading,         setLoading]         = useState(false);
  const [success,         setSuccess]         = useState(false);

  // ── Client-side validation ──────────────────────────────────
  function validate() {
    const e = {};

    if (!firstName.trim()) {
      e.firstName = 'First name is required.';
    } else if (!/^[A-Za-z\s\-']+$/.test(firstName.trim())) {
      e.firstName = 'First name must contain letters only.';
    }

    if (!lastName.trim()) {
      e.lastName = 'Last name is required.';
    } else if (!/^[A-Za-z\s\-']+$/.test(lastName.trim())) {
      e.lastName = 'Last name must contain letters only.';
    }

    if (!username.trim()) {
      e.username = 'Username is required.';
    } else if (username.trim().length < 3) {
      e.username = 'Username must be at least 3 characters.';
    } else if (!/^[A-Za-z0-9_]+$/.test(username.trim())) {
      e.username = 'Username can only contain letters, numbers, and underscores.';
    }

    if (!email.trim()) {
      e.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = 'Enter a valid email address.';
    }

    if (!password) {
      e.password = 'Password is required.';
    } else if (password.length < 8) {
      e.password = 'Password must be at least 8 characters.';
    }

    if (!confirmPassword) {
      e.confirmPassword = 'Please confirm your password.';
    } else if (confirmPassword !== password) {
      e.confirmPassword = 'Passwords do not match.';
    }

    return e;
  }

  // ── Email / Password register handler ───────────────────────
  async function handleEmailRegister() {
    setFormError('');
    setSuccess(false);
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      
    } catch {
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Google OAuth register handler ────────────────────────────
  async function handleGoogleRegister() {
    setFormError('');

    try {

    } catch {
      setFormError('Google sign-up failed. Please try again.');
    }
  }

  // ── Success state ────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 text-center">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Check your email</h2>
          <p className="text-sm text-gray-500">
            A confirmation link has been sent to <strong>{email}</strong>.
            Click the link to activate your account. Your account will also
            need to be activated by an administrator before you can log in.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block text-sm text-blue-600 hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800">Create Account</h1>
          <p className="text-sm text-gray-500 mt-1">Register for Hope PMS</p>
        </div>

        {/* Form-level error */}
        {formError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {formError}
          </div>
        )}

        {/* ── First Name & Last Name (side by side) ── */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Juan"
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.firstName ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.firstName && (
              <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>
            )}
          </div>

          <div className="flex-1">
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="dela Cruz"
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.lastName ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.lastName && (
              <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* ── Username ── */}
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="juandelacruz"
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.username ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
          />
          {errors.username && (
            <p className="mt-1 text-xs text-red-600">{errors.username}</p>
          )}
        </div>

        {/* ── Email ── */}
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="juan@example.com"
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email}</p>
          )}
        </div>

        {/* ── Password ── */}
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password}</p>
          )}
        </div>

        {/* ── Confirm Password ── */}
        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
            onKeyDown={(e) => e.key === 'Enter' && handleEmailRegister()}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
          )}
        </div>

        {/* ── Register button ── */}
        <button
          onClick={handleEmailRegister}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        {/* ── OR divider ── */}
        <div className="flex items-center my-5">
          <div className="flex-1 border-t border-gray-200" />
          <span className="mx-3 text-xs text-gray-400 uppercase tracking-wide">or</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* ── Register with Google ── */}
        <button
          onClick={handleGoogleRegister}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg text-sm transition-colors"
        >
          <img src="/google-icon.svg" alt="" className="w-4 h-4" />
          Register with Google
        </button>

        {/* ── Login link ── */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}