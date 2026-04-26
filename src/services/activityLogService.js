// src/services/activityLogService.js
// Service for the activity_log table.
//
// logActivity()    — write one log entry after a successful operation.
// getActivityLog() — read log entries; RLS scopes result per caller's role.
//
// logActivity() is intentionally non-fatal: a log write failure never blocks
// the main product or user operation. Errors are logged to console only.

import { supabase } from '../lib/supabaseClient';

/**
 * Write one activity log entry.
 * Call this AFTER every successful write operation in productService,
 * priceHistService, userService, and AuthContext.
 *
 * @param {object} p
 * @param {string} p.actorId     - currentUser.userid (auth.uid())
 * @param {string} p.actorEmail  - currentUser.email
 * @param {string} p.actorRole   - currentUser.user_type
 * @param {string} p.action      - e.g. 'PRODUCT_ADDED', 'USER_ACTIVATED'
 * @param {string} [p.targetTable] - e.g. 'product', 'user', 'pricehist'
 * @param {string} [p.targetId]    - e.g. 'AK0001', the userid
 * @param {string} [p.detail]      - human-readable description
 */
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

  if (error) {
    // Non-fatal — main operation already succeeded
    console.warn('[activityLogService] logActivity failed:', error.message);
  }
}

/**
 * Fetch activity log entries (most recent first).
 * RLS automatically scopes result:
 *   SUPERADMIN → all entries
 *   ADMIN      → own entries only (actor_id = auth.uid())
 *
 * @param {object} [options]
 * @param {number} [options.limit] - max rows to return (default 100)
 * @returns {{ data: Array, error: object|null }}
 */
export async function getActivityLog({ limit = 100 } = {}) {
  const { data, error } = await supabase
    .from('activity_log')
    .select('log_id, actor_id, actor_email, actor_role, action, target_table, target_id, detail, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[activityLogService] getActivityLog failed:', error.message);
    return { data: [], error };
  }

  return { data: data ?? [], error: null };
}