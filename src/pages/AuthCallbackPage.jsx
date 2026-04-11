// src/pages/AuthCallbackPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { session, loading, currentUser } = useAuth();
  const [waited, setWaited] = useState(false);

  // Give AuthContext 2 seconds to process the OAuth redirect
  useEffect(() => {
    const timer = setTimeout(() => setWaited(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading || !waited) return;

    if (!session) {
      // No session after 2 seconds — OAuth failed or was cancelled
      navigate('/login', { replace: true });
      return;
    }

    if (currentUser) {
      if (currentUser.record_status === 'ACTIVE') {
        navigate('/products', { replace: true });
      } else {
        // INACTIVE — account not yet activated by admin
        navigate('/login?error=not_activated', { replace: true });
      }
    } else {
      // Session confirmed but public.user row not yet available
      // (trigger may still be running) — go to /products anyway.
      // ProtectedRoute will handle the INACTIVE check on arrival.
      navigate('/products', { replace: true });
    }
  }, [session, loading, currentUser, waited, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-600 font-medium">Signing you in…</p>
      <p className="text-xs text-gray-400">Please wait while we verify your account.</p>
    </div>
  );
}