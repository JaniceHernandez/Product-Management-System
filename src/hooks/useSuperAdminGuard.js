// src/hooks/useSuperAdminGuard.js
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