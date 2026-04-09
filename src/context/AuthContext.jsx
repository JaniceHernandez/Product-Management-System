// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session,     setSession]     = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [authError,   setAuthError]   = useState('');

  // ── Login guard helper ───────────────────────────────────────
  // Project guide Section 4.6 — runs after every SIGNED_IN event.
  // Fetches the user row from public.user, checks record_status,
  // and either populates currentUser or signs the user out.
  async function runLoginGuard(supabaseSession) {
    if (!supabaseSession) {
      setCurrentUser(null);
      setSession(null);
      return;
    }

    const { data: userRow, error } = await supabase
      .from('user')
      .select('record_status, user_type, username, firstName, lastName')
      .eq('userId', supabaseSession.user.id)
      .single();

    if (error || !userRow) {
      // User row not found — may happen if trigger hasn't run yet
      await supabase.auth.signOut();
      setSession(null);
      setCurrentUser(null);
      setAuthError('Account setup is incomplete. Please contact an administrator.');
      return;
    }

    if (userRow.record_status !== 'ACTIVE') {
      // Project guide Section 4.6 — inactive account: sign out and show error
      await supabase.auth.signOut();
      setSession(null);
      setCurrentUser(null);
      setAuthError('Your account is pending activation by an administrator.');
      return;
    }

    // Active user — populate currentUser with merged auth + db data
    setSession(supabaseSession);
    setCurrentUser({
      ...supabaseSession.user,
      username:      userRow.username,
      user_type:     userRow.user_type,
      record_status: userRow.record_status,
      firstName:     userRow.firstName,
      lastName:      userRow.lastName,
    });
    setAuthError('');
  }

  // ── Auth state listener ──────────────────────────────────────
  useEffect(() => {
    // Check for an existing session on app load
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      runLoginGuard(existingSession).finally(() => setLoading(false));
    });

    // Listen for all subsequent auth events (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (event === 'SIGNED_IN') {
          setLoading(true);
          await runLoginGuard(newSession);
          setLoading(false);
        }

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setCurrentUser(null);
        }

        if (event === 'TOKEN_REFRESHED') {
          setSession(newSession);
        }
      }
    );

    // Cleanup listener on unmount
    return () => subscription.unsubscribe();
  }, []);

  // ── Sign out helper ──────────────────────────────────────────
  async function signOut() {
    setAuthError('');
    await supabase.auth.signOut();
    // onAuthStateChange SIGNED_OUT event clears currentUser and session
  }

  const value = {
    session,
    currentUser,
    loading,
    authError,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>.');
  }
  return context;
}