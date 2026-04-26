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
import { logActivity } from './activityLogService';
import { ROLE_RIGHTS_DEFAULTS, ROLE_MODULE_DEFAULTS } from '../utils/roleDefaults';

// ── changeUserRole ─────────────────────────────────────────────
// US-26: SUPERADMIN changes a user's role and resets their rights

// ── getAllUsers ────────────────────────────────────────────────
// Returns users scoped by the caller's role:
//   SUPERADMIN → all users (all user_types)
//   ADMIN      → only USER-type accounts
//
// The RLS SELECT policy (023_add_user_email.sql) enforces the same
// scoping at the DB level. The callerUserType param adds an explicit
// client-side filter as a second layer.
//
// @param {string} callerUserType - currentUser.user_type
// @returns {{ data: Array, error: object|null }}
export async function getAllUsers(callerUserType = 'SUPERADMIN') {
  let query = supabase
    .from('user')
    .select('userid, username, firstname, lastname, email, user_type, record_status, stamp')
    .order('user_type')
    .order('username');

  // ADMIN: only USER-type rows (RLS enforces this too — client filter is a safety net)
  if (callerUserType === 'ADMIN') {
    query = query.eq('user_type', 'USER');
  }

  const { data, error } = await query;

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
export async function activateUser(userId, currentUser) {
  const stamp = makeStamp('ACTIVATED');

  const { error } = await supabase
    .from('user')
    .update({ record_status: 'ACTIVE', stamp })
    .eq('userid', userId);

  if (error) {
    console.error('activateUser error:', error.message);
    return { error };
  }

  await logActivity({
    actorId:     currentUser.userid,
    actorEmail:  currentUser.email,
    actorRole:   currentUser.user_type,
    action:      'USER_ACTIVATED',
    targetTable: 'user',
    targetId:    userId,
    detail:      `Activated user account ${userId}`,
  });

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
export async function deactivateUser(userId, currentUser) {
  const stamp = makeStamp('DEACTIVATED');

  const { error } = await supabase
    .from('user')
    .update({ record_status: 'INACTIVE', stamp })
    .eq('userid', userId);

  if (error) {
    console.error('deactivateUser error:', error.message);
    return { error };
  }

  await logActivity({
    actorId:     currentUser.userid,
    actorEmail:  currentUser.email,
    actorRole:   currentUser.user_type,
    action:      'USER_DEACTIVATED',
    targetTable: 'user',
    targetId:    userId,
    detail:      `Deactivated user account ${userId}`,
  });

  return { error: null };
}

// ── changeUserRole ─────────────────────────────────────────────
// US-26: SUPERADMIN changes a user's role and resets their rights
//        to the canonical defaults for the new role.
//
// Steps performed atomically (sequential Supabase calls):
//   1. UPDATE public.user SET user_type = newRole + stamp
//   2. For each of the 6 rights: UPDATE UserModule_Rights
//      SET right_value = <default for newRole>, stamp
//   3. For each of the 3 modules: UPDATE user_module
//      SET rights_value = <default for newRole>, stamp
//
// SUPERADMIN protection: enforced by RLS (022_rls_role_update.sql).
// Attempting to change a SUPERADMIN's role will be blocked by the DB.
// Attempting to promote to SUPERADMIN is blocked by WITH CHECK.
//
// @param {string} targetUserId - userid of the user whose role changes
// @param {string} newRole - 'ADMIN' or 'USER'
// @param {string} actorId - currentUser.userid of SUPERADMIN performing the action
// @returns {{ error: object|null }}
export async function changeUserRole(targetUserId, newRole, currentUser) {
  if (!['ADMIN', 'USER'].includes(newRole)) {
    return { error: { message: 'Invalid role. Must be ADMIN or USER.' } };
  }

  const rightDefaults  = ROLE_RIGHTS_DEFAULTS[newRole];
  const moduleDefaults = ROLE_MODULE_DEFAULTS[newRole];
  const stamp          = makeStamp('ROLE_CHANGED');

  // ── Step 1: Update user_type ────────────────────────────────
  const { error: userError } = await supabase
    .from('user')
    .update({ user_type: newRole, stamp })
    .eq('userid', targetUserId);

  if (userError) {
    console.error('changeUserRole — user update failed:', userError.message);
    return { error: userError };
  }

  // ── Step 2: Reset all 6 UserModule_Rights rows ──────────────
  const rightUpdates = Object.entries(rightDefaults).map(([rightId, rightValue]) =>
    supabase
      .from('usermodule_rights')
      .update({ right_value: rightValue, stamp })
      .eq('userid', targetUserId)
      .eq('right_id', rightId)
  );

  const rightResults = await Promise.all(rightUpdates);
  const rightError   = rightResults.find(r => r.error)?.error ?? null;

  if (rightError) {
    console.error('changeUserRole — rights update failed:', rightError.message);
    // user_type was already updated — log but do not fail silently
    return {
      error: {
        message: `Role updated to ${newRole}, but rights sync failed: ${rightError.message}. Please check the user's rights manually.`,
      },
    };
  }

  // ── Step 3: Reset all 3 user_module rows ────────────────────
  const moduleUpdates = Object.entries(moduleDefaults).map(([moduleId, rightsValue]) =>
    supabase
      .from('user_module')
      .update({ rights_value: rightsValue, stamp })
      .eq('userid', targetUserId)
      .eq('module_id', moduleId)
  );

  const moduleResults = await Promise.all(moduleUpdates);
  const moduleError   = moduleResults.find(r => r.error)?.error ?? null;

  if (moduleError) {
    console.error('changeUserRole — module update failed:', moduleError.message);
    return {
      error: {
        message: `Role and rights updated to ${newRole}, but module sync failed: ${moduleError.message}. Please check the user's modules manually.`,
      },
    };
  }

  await logActivity({
    actorId:     currentUser.userid,
    actorEmail:  currentUser.email,
    actorRole:   currentUser.user_type,
    action:      'ROLE_CHANGED',
    targetTable: 'user',
    targetId:    targetUserId,
    detail:      `Changed role to ${newRole} for user ${targetUserId}`,
  });

  return { error: null };
}