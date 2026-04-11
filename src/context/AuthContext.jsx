// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session,     setSession]     = useState(undefined); // undefined = still loading
  const [currentUser, setCurrentUser] = useState(null);
  const [authError,   setAuthError]   = useState('');

  // loading is true only until we know whether a session exists
  const loading = session === undefined;

  useEffect(() => {
    // 1. Check for an existing session on mount (handles page refresh)
    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing ?? null);
      if (existing) fetchUserProfile(existing.user.id);
    });

    // 2. Listen for future auth events (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession ?? null);
        if (newSession) {
          fetchUserProfile(newSession.user.id);
        } else {
          setCurrentUser(null);
          setAuthError('');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Fetch the public.user profile row — non-blocking.
  // maybeSingle() returns null (not an error) when no row is found.
  // A failed fetch does NOT sign the user out — session stays alive.
  async function fetchUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('user')
        .select('userId, username, user_type, record_status, firstName, lastName')
        .eq('userId', userId)
        .maybeSingle();

      if (error) {
        console.warn('Could not fetch user profile:', error.message);
        return; // session stays alive; profile just won't be populated yet
      }

      if (data) setCurrentUser(data);
      // If data is null, trigger may still be running — session stays alive
    } catch (err) {
      console.warn('fetchUserProfile error:', err);
    }
  }

  async function signOut() {
    setAuthError('');
    setCurrentUser(null);
    await supabase.auth.signOut();
  }

  const value = {
    session,
    currentUser,
    loading,
    authError,
    setAuthError,
    signOut,
    refetchProfile: () => session && fetchUserProfile(session.user.id),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}