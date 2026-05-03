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

export function useSuperAdminGuard() {
  // True only for the Seeded Superadmin (is_seeded = true)
  function isImmutableRow(targetUser) {
    return targetUser?.user_type === 'SUPERADMIN' && targetUser?.is_seeded === true;
  }

  // For backward compatibility: treat Seeded SA as protected
  function isProtectedRow(targetUser) {
    return isImmutableRow(targetUser);
  }

  function getTooltip(targetUser) {
    return isImmutableRow(targetUser) ? SUPERADMIN_TOOLTIP : '';
  }

  function getRowClass(targetUser) {
    return isImmutableRow(targetUser)
      ? 'bg-purple-50'
      : 'hover:bg-gray-50 transition-colors';
  }

  return {
    isProtectedRow,
    isImmutableRow,        // new
    getTooltip,
    getRowClass,
    TOOLTIP_TEXT: SUPERADMIN_TOOLTIP,
  };
}