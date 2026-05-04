// src/context/AuthContext.jsx – Persistent Session with Single Sign‑In Log
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { logActivity } from '../services/activityLogService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // Helper: log sign-in – only called for fresh sign-ins
  function logSignIn(profile) {
    if (!profile || profile.record_status !== 'ACTIVE') return;
    logActivity({
      actorId: profile.userid,
      actorEmail: profile.email,
      actorRole: profile.user_type,
      action: 'USER_SIGNED_IN',
      targetTable: 'user',
      targetId: profile.userid,
      detail: `${profile.username ?? profile.email} signed in`,
    });
  }

  // Fetch user profile – shouldLog = true only on fresh sign-in
  async function fetchUserProfile(userId, email, shouldLog = false) {
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
      
      // Only log if this is a fresh sign-in (not session restore)
      if (shouldLog && profile.record_status === 'ACTIVE') {
        logSignIn(profile);
      }
    } catch (err) {
      setAuthError('Could not load user profile');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // 1. Get initial session (page reload / existing session) – do NOT log
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      if (existingSession) {
        fetchUserProfile(existingSession.user.id, existingSession.user.email, false);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'SIGNED_IN' && newSession) {
        // Fresh sign-in – log it
        fetchUserProfile(newSession.user.id, newSession.user.email, true);
      } else if (newSession) {
        // Session restored (e.g., token refresh) – no log
        fetchUserProfile(newSession.user.id, newSession.user.email, false);
      } else {
        // Signed out
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    if (currentUser) {
      await logActivity({
        actorId: currentUser.userid,
        actorEmail: currentUser.email,
        actorRole: currentUser.user_type,
        action: 'USER_SIGNED_OUT',
        targetTable: 'user',
        targetId: currentUser.userid,
        detail: `${currentUser.username ?? currentUser.email} signed out`,
      });
    }
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
      if (session) fetchUserProfile(session.user.id, session.user.email, false);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}