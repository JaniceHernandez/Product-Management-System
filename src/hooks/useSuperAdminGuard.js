// src/hooks/useSuperAdminGuard.js
// Centralised SUPERADMIN row protection for the Admin Module.
// Provides a guard function and constants used by UserManagementPage
// (and any future admin components that list users).
//
// Project guide Section 7.2:
//   "Even if an ADMIN somehow bypasses the UI, the RLS policy at the
//    database level will reject the UPDATE. Both layers must be in place."
//
// Usage:
//   import { useSuperAdminGuard } from '../hooks/useSuperAdminGuard';
//   const { isProtectedRow, TOOLTIP_TEXT } = useSuperAdminGuard();
//   <button disabled={isProtectedRow(user)} title={isProtectedRow(user) ? TOOLTIP_TEXT : ''}>
//     Activate
//   </button>

// The exact tooltip text required by the project guide and UI spec
export const SUPERADMIN_TOOLTIP = 'SUPERADMIN accounts cannot be modified';

/**
 * Returns guard utilities for SUPERADMIN row protection.
 * No context dependencies — pure utility, no hook state.
 */
export function useSuperAdminGuard() {
  /**
   * Returns true if the target user row should have all action buttons disabled.
   * A row is protected if the user's user_type is 'SUPERADMIN'.
   * This applies regardless of who is currently signed in.
   *
   * @param {object} targetUser - A user row from getAllUsers()
   * @param {string} targetUser.user_type - The role of the target user
   * @returns {boolean}
   */
  function isProtectedRow(targetUser) {
    return targetUser?.user_type === 'SUPERADMIN';
  }

  /**
   * Returns the tooltip text for disabled buttons on protected rows.
   * Returns an empty string for unprotected rows (no tooltip shown).
   *
   * @param {object} targetUser
   * @returns {string}
   */
  function getTooltip(targetUser) {
    return isProtectedRow(targetUser) ? SUPERADMIN_TOOLTIP : '';
  }

  /**
   * Returns the className modifier for a protected row's container <tr>.
   * Protected rows get a distinct visual treatment.
   *
   * @param {object} targetUser
   * @returns {string} Tailwind classes to apply
   */
  function getRowClass(targetUser) {
    return isProtectedRow(targetUser)
      ? 'bg-purple-50'
      : 'hover:bg-gray-50 transition-colors';
  }

  return {
    isProtectedRow,
    getTooltip,
    getRowClass,
    TOOLTIP_TEXT: SUPERADMIN_TOOLTIP,
  };
}