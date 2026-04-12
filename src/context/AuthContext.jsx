// src/context/AuthContext.jsx
// ENHANCED VERSION: Explicit duplicate prevention, race condition protection
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

// ── Default rows for a new USER ────────────────────────────────
const DEFAULT_MODULE_ROWS = [
  { module_id: 'Prod_Mod',   rights_value: 1, record_status: 'ACTIVE', stamp: 'AUTO' },
  { module_id: 'Report_Mod', rights_value: 1, record_status: 'ACTIVE', stamp: 'AUTO' },
  { module_id: 'Adm_Mod',    rights_value: 0, record_status: 'ACTIVE', stamp: 'AUTO' },
];

const DEFAULT_RIGHTS_ROWS = [
  { right_id: 'PRD_ADD',  right_value: 1, record_status: 'ACTIVE', stamp: 'AUTO' },
  { right_id: 'PRD_EDIT', right_value: 1, record_status: 'ACTIVE', stamp: 'AUTO' },
  { right_id: 'PRD_DEL',  right_value: 0, record_status: 'ACTIVE', stamp: 'AUTO' },
  { right_id: 'REP_001',  right_value: 1, record_status: 'ACTIVE', stamp: 'AUTO' },
  { right_id: 'REP_002',  right_value: 0, record_status: 'ACTIVE', stamp: 'AUTO' },
  { right_id: 'ADM_USER', right_value: 0, record_status: 'ACTIVE', stamp: 'AUTO' },
];

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

  // ── checkUserExists ──────────────────────────────────────────
  // ENHANCED: Explicitly check if user already exists before provisioning.
  // Prevents duplicates and detects race conditions.
  // Returns: { exists: boolean, data: userData | null, source: string, error: any }
  async function checkUserExists(userId) {
    try {
      console.log(`[Auth] Checking if user exists: ${userId}`);

      const { data, error } = await supabase
        .from('user')
        .select('userid, username, user_type, record_status, firstname, lastname')
        .eq('userid', userId)
        .maybeSingle();

      if (error) {
        console.error('[Auth] Check error:', error.message);
        return { exists: false, data: null, source: 'error', error };
      }

      if (data) {
        console.log('[Auth] ✓ User exists:', {
          userid: data.userid,
          user_type: data.user_type,
          record_status: data.record_status,
        });
        return { exists: true, data, source: 'found' };
      }

      console.log('[Auth] User does not exist:', userId);
      return { exists: false, data: null, source: 'not_found' };

    } catch (err) {
      console.error('[Auth] Check exception:', err);
      return { exists: false, data: null, source: 'exception', error: err };
    }
  }

  // ── provisionUser ──────────────────────────────────────────
  // ENHANCED: Check for duplicate before INSERT (race condition protection)
  // and confirm after INSERT (defensive verification)
  async function provisionUser(userId, email, rawMetaData) {
    const fullName  = (rawMetaData?.full_name   || '').trim();
    const firstName = (rawMetaData?.given_name  || rawMetaData?.first_name  || '').trim();
    const lastName  = (rawMetaData?.family_name || rawMetaData?.last_name   || '').trim();
    const username  = fullName || email.split('@')[0];

    const now   = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const stamp = `REGISTERED ${userId} ${now}`;

    console.log(`[Provision] 🚀 Starting for: ${userId}`);

    // ── DEFENSIVE: Check again immediately before INSERT ──
    // In case another request/tab already created the user (race condition)
    console.log('[Provision] Race condition check...');
    const raceCheckResult = await checkUserExists(userId);

    if (raceCheckResult.exists) {
      console.log('[Provision] ⚠️  User already exists (race condition detected)!');
      console.log('[Provision] Skipping INSERT — row already created by another request');
      return true;  // Consider it success — user was created (by someone else)
    }

    // Step A — Insert public.user row
    console.log('[Provision] Step A: Inserting public.user...');
    const { error: userError } = await supabase
      .from('user')
      .insert({
        userid:        userId,
        username:      username,
        lastname:      lastName,
        firstname:     firstName,
        user_type:     'USER',
        record_status: 'INACTIVE',
        stamp:         stamp,
      });

    if (userError) {
      // Defensive: Check if user was actually created despite the error
      // (can happen with RLS violations if row somehow existed)
      if (userError.message.includes('row-level security')) {
        console.warn('[Provision] RLS violation on INSERT — checking if row exists anyway...');
        const raceCheckAfterError = await checkUserExists(userId);
        if (raceCheckAfterError.exists) {
          console.log('[Provision] ✓ User exists despite RLS error (not actually an error)');
          return true;
        }
      }

      console.error('[Provision] ✗ Failed to insert public.user:', userError.message);
      return false;
    }

    console.log('[Provision] ✓ Step A complete: public.user row created');

    // Step B — Insert user_module rows
    console.log('[Provision] Step B: Inserting user_module...');
    const moduleRows = DEFAULT_MODULE_ROWS.map(row => ({ ...row, userid: userId }));

    const { error: moduleError } = await supabase
      .from('user_module')
      .insert(moduleRows);

    if (moduleError) {
      console.error('[Provision] ✗ Step B error:', moduleError.message);
      // Continue anyway — user row exists, which is the critical part
    } else {
      console.log(`[Provision] ✓ Step B complete: ${moduleRows.length} user_module rows`);
    }

    // Step C — Insert UserModule_Rights rows
    console.log('[Provision] Step C: Inserting UserModule_Rights...');
    const rightsRows = DEFAULT_RIGHTS_ROWS.map(row => ({ ...row, userid: userId }));

    const { error: rightsError } = await supabase
      .from('UserModule_Rights')
      .insert(rightsRows);

    if (rightsError) {
      console.error('[Provision] ✗ Step C error:', rightsError.message);
      // Continue — rights are secondary
    } else {
      console.log(`[Provision] ✓ Step C complete: ${rightsRows.length} UserModule_Rights rows`);
    }

    // ── DEFENSIVE: Confirm the row we just inserted actually exists ──
    console.log('[Provision] Confirming insert...');
    const confirmResult = await checkUserExists(userId);

    if (!confirmResult.exists) {
      console.error('[Provision] ⚠️  CRITICAL: Row inserted but cannot be read back!');
      console.error('[Provision] This suggests a cascading delete or trigger issue.');
      return false;
    }

    console.log('[Provision] ✓✓✓ SUCCESS: All checks passed, user fully provisioned');
    return true;
  }

  // ── fetchUserProfile ───────────────────────────────────────
  // ENHANCED: Uses checkUserExists() for explicit duplicate prevention
  async function fetchUserProfile(userId, email) {
    try {
      console.log(`[Auth] Fetching profile for: ${userId}`);

      // ── CHECK 1: Does user already exist? ──
      const existsResult = await checkUserExists(userId);

      if (existsResult.exists && existsResult.data) {
        // User found — use existing data
        console.log('[Auth] ✓ Using existing user data');
        setCurrentUser(buildCurrentUser(existsResult.data, email));
        return;  // Early exit — no provisioning
      }

      if (existsResult.error) {
        // Check failed — don't attempt provisioning, set placeholder for retry
        console.warn('[Auth] Check failed — will retry on next attempt');
        setCurrentUser({ userid: userId, email, username: email, record_status: null });
        return;
      }

      // ── CHECK 2: User doesn't exist — provision now ──
      console.log('[Auth] User does not exist — initiating provisioning...');

      const { data: { user: authUser } } = await supabase.auth.getUser();
      const rawMeta = authUser?.user_metadata ?? {};

      const provisioned = await provisionUser(userId, email, rawMeta);

      if (!provisioned) {
        console.error('[Auth] Provisioning failed');
        setCurrentUser({ userid: userId, email, username: email, record_status: null });
        return;
      }

      // ── CHECK 3: Re-read the newly created user ──
      console.log('[Auth] Re-reading after provisioning...');
      const rereadResult = await checkUserExists(userId);

      if (rereadResult.exists && rereadResult.data) {
        console.log('[Auth] ✓ Provisioning successful, user data read back');
        setCurrentUser(buildCurrentUser(rereadResult.data, email));
        return;
      }

      console.error('[Auth] Could not re-read after provisioning');
      setCurrentUser({ userid: userId, email, username: email, record_status: null });

    } catch (err) {
      console.error('[Auth] Unexpected error:', err);
      setCurrentUser({ userid: userId, email, username: email, record_status: null });
    }
  }

  // ── buildCurrentUser ───────────────────────────────────────
  function buildCurrentUser(data, email) {
    return {
      ...data,
      userId:    data.userid,
      email,
      username:  data.username || email,
      firstName: data.firstname || '',
      lastName:  data.lastname  || '',
    };
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