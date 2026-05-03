// src/utils/stampHelper.js
// Simplified stamp format — S3-T20.
// New format: ACTION YYYY-MM-DD HH:MM
// The userid is no longer embedded — actor identity is tracked in activity_log.
//
// BREAKING CHANGE: second argument (userId) is removed.
// Old call: makeStamp('ADDED', userId)  → now just: makeStamp('ADDED')
// JavaScript silently ignores extra args, but remove them for clarity.

/**
 * Generate a stamp string for audit trail columns.
 * @param {string} action - e.g. 'ADDED', 'EDITED', 'DEACTIVATED', 'ROLE_CHANGED'
 * @returns {string} e.g. 'ADDED 2025-10-20 14:30'
 */
export function makeStamp(action) {
  const now  = new Date();
  const date = now.toISOString().slice(0, 10);   // YYYY-MM-DD
  const time = now.toTimeString().slice(0, 5);   // HH:MM
  return `${action} ${date} ${time}`;
}