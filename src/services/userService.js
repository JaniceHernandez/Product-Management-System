// src/services/userService.js
import { supabase }  from '../lib/supabaseClient';
import { makeStamp } from '../utils/stampHelper';
import { logActivity } from './activityLogService';
import { ROLE_RIGHTS_DEFAULTS, ROLE_MODULE_DEFAULTS } from '../utils/roleDefaults';

// ── getAllUsers ────────────────────────────────────────────────
export async function getAllUsers(callerUserType = 'SUPERADMIN') {
  let query = supabase
    .from('user')
    .select('userid, username, firstname, lastname, email, user_type, record_status, stamp, is_seeded')  // ← add is_seeded
    .order('user_type')
    .order('username');

  // ADMIN: only USER-type rows (RLS enforces this too — client filter is a safety net)
  if (callerUserType === 'ADMIN') {
    query = query.eq('user_type', 'USER');
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error };
  }

  return { data: data ?? [], error: null };
}

// ── activateUser ───────────────────────────────────────────────
export async function activateUser(userId, currentUser) {
  const stamp = makeStamp('ACTIVATED');

  const { error } = await supabase
    .from('user')
    .update({ record_status: 'ACTIVE', stamp })
    .eq('userid', userId);

  if (error) {
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
export async function deactivateUser(userId, currentUser) {
  const stamp = makeStamp('DEACTIVATED');

  const { error } = await supabase
    .from('user')
    .update({ record_status: 'INACTIVE', stamp })
    .eq('userid', userId);

  if (error) {
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

export async function changeUserRole(targetUserId, newRole, currentUser) {
  if (!['ADMIN', 'USER', 'SUPERADMIN'].includes(newRole)) {
    return { error: { message: 'Invalid role. Must be ADMIN, USER, or SUPERADMIN.' } };
  }

  // Only Seeded Superadmin can promote to SUPERADMIN
  if (newRole === 'SUPERADMIN' && !currentUser?.isSeededSuperAdmin) {
    return { error: { message: 'Only the Seeded Superadmin can promote to SUPERADMIN.' } };
  }

  // Prevent changing Seeded Superadmin's role
  const { data: targetData, error: targetError } = await supabase
    .from('user')
    .select('is_seeded')
    .eq('userid', targetUserId)
    .single();
  if (targetError) return { error: targetError };
  if (targetData?.is_seeded === true) {
    return { error: { message: 'Cannot change the role of the Seeded Superadmin.' } };
  }

  const rightDefaults = ROLE_RIGHTS_DEFAULTS[newRole];
  const moduleDefaults = ROLE_MODULE_DEFAULTS[newRole];
  const stamp = makeStamp('ROLE_CHANGED');

  // ── Ensure all 6 rights rows exist ────────────────────────
  const allRights = ['PRD_ADD', 'PRD_EDIT', 'PRD_DEL', 'REP_001', 'REP_002', 'ADM_USER'];
  for (const rightId of allRights) {
    const { data: existing } = await supabase
      .from('usermodule_rights')
      .select('right_id')
      .eq('userid', targetUserId)
      .eq('right_id', rightId)
      .maybeSingle();
    if (!existing) {
      await supabase.from('usermodule_rights').insert({
        userid: targetUserId,
        right_id: rightId,
        right_value: 0,
        record_status: 'ACTIVE',
        stamp: 'MIGRATED'
      });
    }
  }

  // ── Ensure all 3 module rows exist ────────────────────────
  const allModules = ['Prod_Mod', 'Report_Mod', 'Adm_Mod'];
  for (const moduleId of allModules) {
    const { data: existing } = await supabase
      .from('user_module')
      .select('module_id')
      .eq('userid', targetUserId)
      .eq('module_id', moduleId)
      .maybeSingle();
    if (!existing) {
      await supabase.from('user_module').insert({
        userid: targetUserId,
        Module_ID: moduleId,
        rights_value: 0,
        record_status: 'ACTIVE',
        stamp: 'MIGRATED'
      });
    }
  }

  // 1. Update user_type and is_seeded
  const userUpdate = { user_type: newRole, stamp };
  if (newRole === 'SUPERADMIN') userUpdate.is_seeded = false;
  const { error: userError } = await supabase
    .from('user')
    .update(userUpdate)
    .eq('userid', targetUserId);
  if (userError) return { error: userError };

  // 2. Update fine‑grained rights
  const rightUpdates = Object.entries(rightDefaults).map(([rightId, rightValue]) =>
    supabase
      .from('usermodule_rights')
      .update({ right_value: rightValue, stamp })
      .eq('userid', targetUserId)
      .eq('right_id', rightId)
  );
  const rightResults = await Promise.all(rightUpdates);
  const rightError = rightResults.find(r => r.error)?.error;
  if (rightError) {
    return { error: { message: `Rights sync failed: ${rightError.message}` } };
  }

  // 3. Update module rights
  const moduleUpdates = Object.entries(moduleDefaults).map(([moduleId, rightsValue]) =>
    supabase
      .from('user_module')
      .update({ rights_value: rightsValue, stamp })
      .eq('userid', targetUserId)
      .eq('module_id', moduleId)
  );
  const moduleResults = await Promise.all(moduleUpdates);
  const moduleError = moduleResults.find(r => r.error)?.error;
  if (moduleError) {
    return { error: { message: `Module rights sync failed: ${moduleError.message}` } };
  }

  // Log activity
  await logActivity({
    actorId: currentUser.userid,
    actorEmail: currentUser.email,
    actorRole: currentUser.user_type,
    action: 'ROLE_CHANGED',
    targetTable: 'user',
    targetId: targetUserId,
    detail: `Changed role to ${newRole} for user ${targetUserId}`,
  });

  return { error: null };
}

// ── getUserPermissions ─────────────────────────────────────────
export async function getUserPermissions(targetUserId) {
  const { data, error } = await supabase
    .from('usermodule_rights')
    .select('right_id, right_value')
    .eq('userid', targetUserId);

  if (error) {
    return { data: null, error };
  }

  const map = {};
  for (const row of (data ?? [])) {
    map[row.right_id] = row.right_value;
  }
  return { data: map, error: null };
}

// ── updateUserPermission ───────────────────────────────────────
export async function updateUserPermission(targetUserId, rightId, newValue, currentUser) {
  const stamp = makeStamp('PERMISSIONS_UPDATED');

  const { error } = await supabase
    .from('usermodule_rights')
    .update({ right_value: newValue, stamp })
    .eq('userid', targetUserId)
    .eq('right_id', rightId);

  if (error) {
    return { error };
  }

  await logActivity({
    actorId:     currentUser.userid,
    actorEmail:  currentUser.email,
    actorRole:   currentUser.user_type,
    action:      'PERMISSIONS_UPDATED',
    targetTable: 'usermodule_rights',
    targetId:    targetUserId,
    detail:      `${rightId} set to ${newValue === 1 ? 'ALLOWED' : 'BLOCKED'}`,
  });

  return { error: null };
}
