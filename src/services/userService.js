// src/services/userService.js
// Data-access layer for the Admin Module (User Management page).
// getAllUsers() — fetch all user rows for the management table
// activateUser() — set record_status = 'ACTIVE'
// deactivateUser() — set record_status = 'INACTIVE' (soft deactivation)
//
// RLS from S3-T07 enforces SUPERADMIN protection at the DB level:
// - ADMIN cannot update SUPERADMIN rows
// - SUPERADMIN has full access
// The service passes operations through without additional role checks.

import { supabase }  from '../lib/supabaseClient';
import { makeStamp } from '../utils/stampHelper';

// ── getAllUsers ────────────────────────────────────────────────
// US-21, US-24: SUPERADMIN and ADMIN view all registered users.
//
// Returns all rows from public.user ordered by user_type then username.
// The RLS SELECT policy on public.user (USING true from migration 009)
// allows all authenticated users to read user rows.
// Stamp column included — visibility gated in the UI by user_type.
//
// @returns {{ data: Array, error: object|null }}
export async function getAllUsers() {
  const { data, error } = await supabase
    .from('user')
    .select('userid, username, firstname, lastname, user_type, record_status, stamp')
    .order('user_type')
    .order('username');

  if (error) {
    console.error('getAllUsers error:', error.message);
    return { data: [], error };
  }

  return { data: data ?? [], error: null };
}

// ── activateUser ───────────────────────────────────────────────
// US-22: SUPERADMIN activates a newly registered user.
//
// Sets record_status = 'ACTIVE'. After activation, the user can sign in.
// ADMIN attempting to activate a SUPERADMIN account will be blocked by
// the admin_update_record_status RLS policy (S3-T07) — the error is
// returned to the caller for display.
//
// @param {string} userId - The userid of the account to activate
// @param {string} actorId - currentUser.userid of the person performing the action
// @returns {{ error: object|null }}
export async function activateUser(userId, actorId) {
  const stamp = makeStamp('ACTIVATED', actorId);

  const { error } = await supabase
    .from('user')
    .update({ record_status: 'ACTIVE', stamp })
    .eq('userid', userId);

  if (error) {
    console.error('activateUser error:', error.message);
    return { error };
  }

  return { error: null };
}

// ── deactivateUser ─────────────────────────────────────────────
// US-23: SUPERADMIN deactivates a user account.
// US-25: System prevents ADMIN from deactivating SUPERADMIN accounts.
//
// Sets record_status = 'INACTIVE'. The deactivated user is immediately
// blocked by the login guard (AuthCallbackPage checks record_status).
//
// Note: This is a SOFT operation — record_status = 'INACTIVE', not DELETE.
// Per the project rule: no hard deletes. User rows are never removed.
//
// @param {string} userId - The userid of the account to deactivate
// @param {string} actorId - currentUser.userid of the person performing the action
// @returns {{ error: object|null }}
export async function deactivateUser(userId, actorId) {
  const stamp = makeStamp('DEACTIVATED', actorId);

  const { error } = await supabase
    .from('user')
    .update({ record_status: 'INACTIVE', stamp })
    .eq('userid', userId);

  if (error) {
    console.error('deactivateUser error:', error.message);
    return { error };
  }

  return { error: null };
}