// src/hooks/useProductRights.js
// Single hook for all product-related rights and display gates.
// Components import this instead of calling useAuth() + useRights() separately.
//
// Usage:
//   import { useProductRights } from '../hooks/useProductRights';
//   const { canAdd, canEdit, canDelete, showStamp, userType, rightsLoading } = useProductRights();

import { useAuth }   from './useAuth';
import { useRights } from './useRights';
import { useStampVisibility } from './useStampVisibility';

export function useProductRights() {
  const { currentUser }            = useAuth();
  const { rights, rightsLoading }  = useRights();
  const { showProductStamp } = useStampVisibility();

  const userType = currentUser?.user_type ?? 'USER';

  return {
    // ── Rights-based gates (sourced from UserModule_Rights via UserRightsContext) ──
    // Each is true only when the DB-backed right_value = 1 for this user
    canAdd:    rights.PRD_ADD  === 1,
    canEdit:   rights.PRD_EDIT === 1,
    canDelete: rights.PRD_DEL  === 1,   // SUPERADMIN only per rights matrix

    // ── Stamp visibility (display rule — project guide Section 2.3) ──
    // Not a right — gated by user_type, not UserModule_Rights
    // SUPERADMIN: sees stamp on all tables
    // ADMIN: sees stamp on product and priceHist tables
    // USER: never sees stamp anywhere
    showStamp: showProductStamp,

    // ── Raw values available for any edge case ──
    userType,
    currentUser,
    rightsLoading,
    rights,
  };
}