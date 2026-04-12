// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session,     setSession]     = useState(undefined);
  const [currentUser, setCurrentUser] = useState(null);
  const [authError,   setAuthError]   = useState('');

  const loading = session === undefined;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing ?? null);
      if (existing) {
        fetchUserProfile(existing.user.id, existing.user.email);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession ?? null);
        if (newSession) {
          fetchUserProfile(newSession.user.id, newSession.user.email);
        } else {
          setCurrentUser(null);
          setAuthError('');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Fetch the public.user profile row.
  // Uses lowercase 'userid' — PostgreSQL lowercases unquoted column names.
  // If Step 2 shows a different casing for your column, update .eq() accordingly.
  // email is passed so the Navbar always has something to display.
  async function fetchUserProfile(userId, email) {
    try {
      const { data, error } = await supabase
        .from('user')
        .select('userid, username, user_type, record_status, firstname, lastname')
        .eq('userid', userId)   // lowercase — adjust if your DB uses 'userId'
        .maybeSingle();

      if (error) {
        console.warn('fetchUserProfile — DB error:', error.message);
        // Set placeholder so Navbar shows something; AuthCallbackPage will retry
        setCurrentUser({ userid: userId, email, username: email, record_status: null });
        return;
      }

      if (data) {
        setCurrentUser({
          ...data,
          userId:    data.userid,             // camelCase alias for compatibility
          email,                              // always include auth email
          username:  data.username || email,  // fallback to email if username empty
          firstName: data.firstname || '',    // camelCase alias
          lastName:  data.lastname  || '',    // camelCase alias
        });
      } else {
        // No row found — trigger may not have run yet.
        // Set placeholder with record_status: null so AuthCallbackPage can distinguish
        // "no DB row" from "profile loaded as INACTIVE".
        setCurrentUser({ userid: userId, email, username: email, record_status: null });
      }
    } catch (err) {
      console.warn('fetchUserProfile — unexpected error:', err);
      setCurrentUser({ userid: userId, email, username: email, record_status: null });
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
    refetchProfile: () => {
      if (session) fetchUserProfile(session.user.id, session.user.email);
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an <AuthProvider>.');
  return ctx;
}