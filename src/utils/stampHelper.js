// src/utils/stampHelper.js
// Generates audit trail strings for all write operations.
// Format: ACTION USERID YYYY-MM-DD HH:MM
//
// Examples:
//   ADDED user2 2025-10-20 14:30
//   EDITED user3 2025-11-05 09:15
//   DEACTIVATED user1 2025-11-10 16:00
//   REACTIVATED user1 2025-11-12 09:00

/**
 * Generate a stamp string for audit logging.
 * @param {string} action  - Uppercase action verb (e.g. 'ADDED', 'EDITED', 'DEACTIVATED')
 * @param {string} userId  - The userid of the acting user (currentUser.userid)
 * @returns {string}
 */
export function makeStamp(action, userId) {
  const now  = new Date();
  const date = now.toISOString().slice(0, 10);   // YYYY-MM-DD
  const time = now.toTimeString().slice(0, 5);    // HH:MM (local time)
  return `${action} ${userId} ${date} ${time}`;
}