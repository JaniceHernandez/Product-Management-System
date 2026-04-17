// src/context/UserRightsContext.jsx
// Loads the current user's rights map from UserModule_Rights on login.
// Exposes useRights() for all components that gate buttons, columns, or routes.
// Clears the map on logout; re-fetches when currentUser.userid changes.
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth }  from '../hooks/useAuth';
 
const UserRightsContext = createContext(null);
 
// The six right IDs used in this application (project guide Section 2.2)
const ALL_RIGHTS = ['PRD_ADD', 'PRD_EDIT', 'PRD_DEL', 'REP_001', 'REP_002', 'ADM_USER'];
 
// Safe default: all rights = 0 while loading or on error
// Prevents any write button from appearing before permissions are confirmed
function defaultRights() {
  return Object.fromEntries(ALL_RIGHTS.map(id => [id, 0]));
}
 
// Normalize a raw DB row to { id: string, value: number, status: string }
// Handles both lowercase and mixed-case column names
function normalizeRow(row) {
  return {
    id:     row.right_id    ?? row['Right_ID']     ?? '',
    value:  Number(row.right_value ?? row['Right_value'] ?? 0),
    status: row.record_status ?? row['Record_status'] ?? '',
  };
}
 
export function UserRightsProvider({ children }) {
  const { currentUser }  = useAuth();
  const [rights,         setRights]         = useState(defaultRights());
  const [rightsLoading,  setRightsLoading]  = useState(true);
  const [rightsError,    setRightsError]    = useState('');
 
  // Re-fetch whenever the signed-in user changes (login, logout, or user switch)
  useEffect(() => {
    if (!currentUser?.userid) {
      // Signed out or profile not yet loaded — reset to safe defaults immediately
      setRights(defaultRights());
      setRightsLoading(false);
      setRightsError('');
      return;
    }
 
    // Only fetch if account is ACTIVE — INACTIVE accounts should not load rights
    if (currentUser.record_status !== 'ACTIVE') {
      setRights(defaultRights());
      setRightsLoading(false);
      return;
    }
 
    fetchRights(currentUser.userid);
  }, [currentUser?.userid, currentUser?.record_status]);
 
  async function fetchRights(userId) {
    setRightsLoading(true);
    setRightsError('');
 
    try {
      // First attempt: lowercase column names
      const { data, error } = await supabase
        .from('UserModule_Rights')
        .select('right_id, right_value, record_status')
        .eq('userid', userId);
 
      if (!error && data) {
        buildAndSetMap(data);
        return;
      }
 
      // Second attempt: mixed-case column names (if table was created with quoted identifiers)
      const { data: data2, error: error2 } = await supabase
        .from('UserModule_Rights')
        .select('"Right_ID", "Right_value", "Record_status"')
        .eq('userid', userId);
 
      if (error2) {
        console.error('[UserRightsContext] fetchRights failed:', error2.message);
        setRightsError('Could not load user permissions. Please refresh the page.');
        setRights(defaultRights());
        return;
      }
 
      buildAndSetMap(data2);
 
    } catch (err) {
      console.error('[UserRightsContext] Unexpected error:', err);
      setRightsError('Could not load user permissions.');
      setRights(defaultRights());
    } finally {
      setRightsLoading(false);
    }
  }
 
  // Build the normalized rights map from raw DB rows
  function buildAndSetMap(rows) {
    const map = defaultRights();
    for (const row of (rows ?? [])) {
      const { id, value, status } = normalizeRow(row);
      // Only include ACTIVE rights rows — INACTIVE rights are ignored
      if (id && status === 'ACTIVE') {
        map[id] = value;
      }
    }
    setRights(map);
  }
 
  // Convenience boolean flags — prevent === 1 comparisons in every component
  const canAdd             = rights.PRD_ADD  === 1;
  const canEdit            = rights.PRD_EDIT === 1;
  const canDelete          = rights.PRD_DEL  === 1;
  const canViewReports     = rights.REP_001  === 1;
  const canViewTopSelling  = rights.REP_002  === 1;
  const canManageUsers     = rights.ADM_USER === 1;
 
  const value = {
    // Full rights map — for components that need any right beyond the convenience flags
    rights,
    // Convenience boolean flags
    canAdd,
    canEdit,
    canDelete,
    canViewReports,
    canViewTopSelling,
    canManageUsers,
    // Loading and error state
    rightsLoading,
    rightsError,
    // Force a manual re-fetch (used after an admin changes a user's rights)
    refetchRights: () => currentUser?.userid && fetchRights(currentUser.userid),
  };
 
  return (
    <UserRightsContext.Provider value={value}>
      {children}
    </UserRightsContext.Provider>
  );
}
 
export function useRights() {
  const ctx = useContext(UserRightsContext);
  if (!ctx) throw new Error('useRights must be used inside a <UserRightsProvider>.');
  return ctx;
}