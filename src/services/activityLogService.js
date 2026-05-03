// src/services/activityLogService.js

import { supabase } from '../lib/supabaseClient';

export async function logActivity({ actorId, actorEmail, actorRole, action, targetTable, targetId, detail }) {
  const { error } = await supabase
    .from('activity_log')
    .insert({
      actor_id:     actorId,
      actor_email:  actorEmail  ?? null,
      actor_role:   actorRole   ?? null,
      action,
      target_table: targetTable ?? null,
      target_id:    targetId    ?? null,
      detail:       detail      ?? null,
    });
}

export async function getActivityLog({ limit = 100, excludeSuperadmin = true } = {}) {
  let query = supabase
    .from('activity_log')
    .select('log_id, actor_id, actor_email, actor_role, action, target_table, target_id, detail, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  // If caller is not SUPERADMIN, hide SUPERADMIN actions
  const { data: caller } = await supabase.auth.getUser();
  if (caller?.user) {
    const { data: userRow } = await supabase
      .from('user')
      .select('user_type')
      .eq('userid', caller.user.id)
      .single();
    if (userRow?.user_type !== 'SUPERADMIN') {
      query = query.neq('actor_role', 'SUPERADMIN');
    }
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error };
  }

  return { data: data ?? [], error: null };
}