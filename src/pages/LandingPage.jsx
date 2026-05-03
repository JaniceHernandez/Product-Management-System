// src/pages/LandingPage.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

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

export default function LandingPage() {
  const { session, loading, currentUser } = useAuth();
  const navigate = useNavigate();

  // If already logged in and active, skip landing entirely
  useEffect(() => {
    if (loading || !session || !currentUser) return;
    if (currentUser.record_status === 'ACTIVE') {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, session, currentUser, navigate]);

  // On desktop (lg+), redirect straight to /login which shows the split view
  useEffect(() => {
    if (window.innerWidth >= 1024) {
      navigate('/login', { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf6f9' }}>
        <div
          className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#fce7f3', borderTopColor: '#ec4899' }}
        />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      <div
        className="min-h-screen flex flex-col relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #fff0f8 0%, #fdf2f8 45%, #fce7f3 100%)',
        }}
      >
        {/* ── Background decorations ── */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, #fce7f3 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.55,
          animation: 'fadeIn 0.6s ease both',
        }} />
        <div className="absolute top-0 right-0 pointer-events-none" style={{
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)',
          transform: 'translate(30%, -30%)',
        }} />
        <div className="absolute bottom-0 left-0 pointer-events-none" style={{
          width: 260, height: 260, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(217,70,239,0.08) 0%, transparent 70%)',
          transform: 'translate(-30%, 30%)',
        }} />

        {/* ── Content ── */}
        <div className="relative z-10 flex flex-col flex-1 px-6 pt-14 pb-10 max-w-md mx-auto w-full">

          {/* Logo */}
          <div
          className="flex items-center gap-3 mb-10"
          style={{ animation: 'fadeUp 0.4s ease both', animationDelay: '0ms' }}
        >
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white shadow-md flex items-center justify-center p-1">
            <img
              src="/hope-logo.png"
              alt="HopePMS Logo"
              className="h-10 w-auto rounded-lg"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none">HopePMS</h1>
            <p className="text-xs font-semibold mt-0.5" style={{ color: '#ec4899' }}>
              Hope, Inc. — Product Management System
            </p>
          </div>
        </div>

          {/* Headline */}
          <div
            style={{ animation: 'fadeUp 0.4s ease both', animationDelay: '60ms' }}
          >
            <h2 className="text-4xl font-bold leading-tight text-gray-900 mb-3">
              Manage products{' '}
              <span style={{
                background: 'linear-gradient(90deg, #ec4899, #d946ef)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                with clarity.
              </span>
            </h2>
            <p className="text-sm leading-relaxed text-gray-500 mb-8">
              A secure, role-based web application for managing products and price history
              with soft-delete functionality.
            </p>
          </div>

          {/* Feature cards */}
          <div className="flex flex-col gap-2.5 mb-10">
            {FEATURES.map((f, i) => (
              <div
                key={f.label}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.75)',
                  border: '1px solid rgba(252,231,243,0.9)',
                  backdropFilter: 'blur(8px)',
                  animation: 'fadeUp 0.4s ease both',
                  animationDelay: `${120 + i * 55}ms`,
                }}
              >
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#fce7f3', color: '#ec4899' }}
                >
                  {f.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 leading-none">{f.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#f9a8d4' }}>{f.desc}</p>
                </div>
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#fce7f3' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="#ec4899">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div
            className="mt-auto flex flex-col gap-3"
            style={{ animation: 'fadeUp 0.4s ease both', animationDelay: '360ms' }}
          >
            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all duration-200 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #ec4899, #d946ef)',
                boxShadow: '0 6px 20px rgba(236,72,153,0.35)',
              }}
            >
              Sign In
            </button>
            <p className="text-center text-xs" style={{ color: '#f9a8d4' }}>
              New registrations require administrator activation.
            </p>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs" style={{ color: '#fce7f3' }}>
            Hope, Inc. · New Era University · AY 2025–2026
          </p>
        </div>
      </div>
    </>
  );
}