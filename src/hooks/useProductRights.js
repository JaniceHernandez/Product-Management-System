// src/hooks/useProductRights.js

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

    // ── Stamp visibility ──
    showStamp: showProductStamp,

    // ── Raw values available for any edge case ──
    userType,
    currentUser,
    rightsLoading,
    rights,
  };
}