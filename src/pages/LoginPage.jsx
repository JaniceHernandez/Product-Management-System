// src/pages/LoginPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';

const FEATURES = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    label: 'Role-based Access',
    desc: 'SUPERADMIN, ADMIN, USER',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    label: 'Soft Delete & Audit Trail',
    desc: 'Full activity history retained',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    label: 'Google OAuth',
    desc: 'Secure, passwordless sign-in',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    label: 'Real-time Dashboard & Reports',
    desc: 'Live metrics and analytics',
  },
];

function Logo({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };
  return (
    <img
      src="/hope-logo.png"
      alt="HopePMS Logo"
      className={`object-contain shrink-0 ${sizeClasses[size]} ${className}`}
    />
  );
}

function GoogleButton({ onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200"
      style={{
        border: hovered ? '1.5px solid #ec4899' : '1.5px solid #e5e7eb',
        backgroundColor: hovered ? '#fdf2f8' : '#ffffff',
        color: '#374151',
        boxShadow: hovered
          ? '0 4px 14px rgba(236,72,153,0.12)'
          : '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Continue with Google
    </button>
  );
}

// Desktop-only hero panel (hidden on mobile/tablet)
function HeroPanel() {
  return (
    <div
      className="hidden lg:flex flex-col justify-center px-12 xl:px-16 relative overflow-hidden"
      style={{
        width: '55%',
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #fff0f8 0%, #fdf2f8 40%, #fce7f3 100%)',
      }}
    >
      <div className="absolute top-0 right-0 pointer-events-none" style={{
        width: 420, height: 420, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)',
        transform: 'translate(30%, -30%)',
      }} />
      <div className="absolute bottom-0 left-0 pointer-events-none" style={{
        width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(217,70,239,0.07) 0%, transparent 70%)',
        transform: 'translate(-30%, 30%)',
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, #fce7f3 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        opacity: 0.6,
      }} />

      <div className="relative z-10 max-w-md">
        <div className="flex items-center gap-3 mb-10">
          <Logo size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Hope, Inc.</h1>
            <p className="text-xs font-semibold mt-0.5" style={{ color: '#ec4899' }}>
              Product Management System
            </p>
          </div>
        </div>

        <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-4 text-gray-900">
          Manage products{' '}
          <span style={{
            background: 'linear-gradient(90deg, #ec4899, #d946ef)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            with clarity.
          </span>
        </h2>

        <p className="text-sm leading-relaxed mb-10 text-gray-500">
          A secure, role-based web application for managing products and price history
          with soft-delete functionality.
        </p>

        <div className="flex flex-col gap-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.label}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                backgroundColor: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(252,231,243,0.8)',
                backdropFilter: 'blur(8px)',
                animation: 'fadeUp 0.4s ease both',
                animationDelay: `${i * 60}ms`,
              }}
            >
              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#fce7f3', color: '#ec4899' }}>
                {f.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 leading-none">{f.label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#f9a8d4' }}>{f.desc}</p>
              </div>
              <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#fce7f3' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="#ec4899">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          ))}
        </div>

        <p className="mt-10 text-xs font-medium" style={{ color: '#f9a8d4' }}>
          Hope, Inc. · New Era University · AY 2025–2026
        </p>
      </div>
    </div>
  );
}

function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf6f9' }}>
      <div
        className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#fce7f3', borderTopColor: '#ec4899' }}
      />
    </div>
  );
}

export default function LoginPage() {
  const { session, loading, currentUser, signOut } = useAuth();
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  const errorParam = searchParams.get('error');
  const [signedOutForError, setSignedOutForError] = useState(false);

  const errorMessages = {
    not_activated:    'Your account is pending activation by an administrator.',
    setup_incomplete: 'Your account could not be set up automatically. Please contact an administrator.',
  };
  const displayError = errorMessages[errorParam] ?? '';

  useEffect(() => {
    if (!errorParam || loading) return;
    if (signedOutForError) return;
    signOut()
      .finally(() => {
        setSignedOutForError(true);
        setTimeout(() => navigate('/login', { replace: true }), 100);
      });
  }, [errorParam, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (loading || errorParam || !session || !currentUser) return;
    if (currentUser.record_status === 'ACTIVE') {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, session, currentUser, errorParam, navigate]);

  async function handleGoogleSignIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    });
  }

  if (loading || (errorParam && !signedOutForError)) {
    return <FullPageSpinner />;
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="min-h-screen flex" style={{ backgroundColor: '#fdf6f9' }}>

        {/* Desktop hero (left 55%) */}
        <HeroPanel />

        {/* Login panel — full width on mobile, right 45% on desktop */}
        <div
          className="flex flex-col items-center justify-center flex-1 px-4 py-12"
          style={{ minHeight: '100vh' }}
        >
          <div
            className="w-full flex flex-col items-center"
            style={{
              maxWidth: 400,
              animation: 'fadeUp 0.45s ease both',
              animationDelay: '80ms',
            }}
          >
            {/* Desktop: mini label above card */}
            <div className="hidden lg:flex items-center gap-2.5 mb-8 self-start">
              <Logo size="sm" />
              <div>
                <p className="text-sm font-bold text-gray-800 leading-none">Sign in</p>
                <p className="text-xs mt-0.5" style={{ color: '#f9a8d4' }}>Secure · Role-based · Real-time</p>
              </div>
            </div>

            {/* Card */}
            <div
              className="bg-white rounded-2xl p-8 w-full"
              style={{
                border: '1px solid #f3e8f5',
                boxShadow: '0 10px 40px rgba(236,72,153,0.06), 0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              {/* Mobile-only logo inside card */}
              <div className="flex flex-col items-center mb-7 lg:hidden">
                <Logo size="md" />
                <h1 className="text-xl font-bold text-gray-900 mt-3">Hope, Inc.</h1>
                <p className="text-xs font-semibold mt-0.5" style={{ color: '#ec4899' }}>
                  Product Management System
                </p>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900">Welcome back</h2>
                <p className="text-sm mt-1" style={{ color: '#f9a8d4' }}>
                  Sign in with your Google account to continue.
                </p>
              </div>

              {displayError && (
                <div
                  className="mb-6 rounded-xl px-4 py-3 text-sm"
                  style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c' }}
                >
                  <p className="font-semibold mb-1">⚠️ Sign-in Issue</p>
                  <p>{displayError}</p>
                  <p className="text-xs mt-2" style={{ color: '#e11d48' }}>
                    You have been signed out. Please try signing in again,
                    or use a different account if needed.
                  </p>
                </div>
              )}

              <GoogleButton onClick={handleGoogleSignIn} />

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px" style={{ backgroundColor: '#fce7f3' }} />
                <span className="text-xs font-medium" style={{ color: '#f9a8d4' }}>secure sign-in</span>
                <div className="flex-1 h-px" style={{ backgroundColor: '#fce7f3' }} />
              </div>

              <p className="text-xs text-center" style={{ color: '#d1d5db' }}>
                New registrations require administrator activation.
              </p>

              {/* Mobile: back to landing page */}
              <button
                onClick={() => navigate('/')}
                className="lg:hidden mt-5 w-full text-xs text-center transition-colors duration-150"
                style={{ color: '#f9a8d4' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ec4899'}
                onMouseLeave={e => e.currentTarget.style.color = '#f9a8d4'}
              >
                ← Back to Home
              </button>
            </div>

            <p className="hidden lg:block mt-6 text-xs text-center" style={{ color: '#fce7f3' }}>
              Hope, Inc. · New Era University · AY 2025–2026
            </p>
          </div>
        </div>
      </div>
    </>
  );
}