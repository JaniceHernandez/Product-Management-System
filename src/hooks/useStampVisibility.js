// src/hooks/useStampVisibility.js
// Centralised stamp visibility hook — project guide Section 2.3.
//
// Stamp visibility rules:
//   SUPERADMIN: stamp visible on ALL tables (product, priceHist, user, deleted items)
//   ADMIN:      stamp visible on product and priceHist tables ONLY
//   USER:       stamp NEVER visible on any table
//
// Each flag is a boolean. Components use {flagName && <th>Stamp</th>}
// for DOM-absent conditional rendering.
//
// Usage:
//   import { useStampVisibility } from '../hooks/useStampVisibility';
//   const { showProductStamp, showUserStamp } = useStampVisibility();

import { useAuth } from './useAuth';

export function useStampVisibility() {
  const { currentUser } = useAuth();
  const userType = currentUser?.user_type ?? 'USER';

  const isSuperAdmin = userType === 'SUPERADMIN';
  const isAdmin      = userType === 'ADMIN';
  const isAdminOrAbove = isSuperAdmin || isAdmin;

  return {
    // product table (ProductsPage, DeletedItemsPage)
    // Visible to: ADMIN and SUPERADMIN
    showProductStamp: isAdminOrAbove,

    // priceHist table (PriceHistoryPanel)
    // Visible to: ADMIN and SUPERADMIN
    showPriceHistStamp: isAdminOrAbove,

    // Deleted Items page (product table — INACTIVE rows)
    // Page is already role-gated to ADMIN/SUPERADMIN — stamp always shown here
    showDeletedItemsStamp: isAdminOrAbove,

    // user table (UserManagementPage)
    // Project guide Section 2.3: ADMIN sees stamp on product/priceHist ONLY.
    // Therefore ADMIN cannot see stamp on the user table.
    showUserStamp: isSuperAdmin,

    // Convenience — raw user type for any edge-case component logic
    userType,
    isSuperAdmin,
    isAdminOrAbove,
  };
}