// src/context/AuthContext.jsx – Minimal Persistent Session Implementation
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until session + profile are loaded
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      if (existingSession) {
        fetchUserProfile(existingSession.user.id, existingSession.user.email);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        fetchUserProfile(newSession.user.id, newSession.user.email);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user profile from public.user table
  async function fetchUserProfile(userId, email) {
    try {
      const { data, error } = await supabase
        .from('user')
        .select('userid, username, user_type, record_status, firstname, lastname, is_seeded')
        .eq('userid', userId)
        .single();

      if (error) throw error;

      const profile = {
        ...data,
        userId: data.userid,
        email,
        username: data.username || email,
        firstName: data.firstname || '',
        lastName: data.lastname || '',
        isSeededSuperAdmin: data.user_type === 'SUPERADMIN' && data.is_seeded === true,
      };
      setCurrentUser(profile);
    } catch (err) {
      setAuthError('Could not load user profile');
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    // State will be cleared by onAuthStateChange
  }

  const value = {
    session,
    currentUser,
    loading,
    authError,
    signOut,
    refetchProfile: () => {
      if (session) fetchUserProfile(session.user.id, session.user.email);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}